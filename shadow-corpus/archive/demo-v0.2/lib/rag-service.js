'use strict';

/**
 * RAG backend service for archive/demo-v0.2.
 * Works offline (local rule refine + memory-retrieval); upgrades to Supabase + embedding when configured.
 */

const path = require('node:path');
const fs = require('node:fs');
const { selectMemories } = require('./memory-retrieval');
const { calendarYearForNarrative, loadWorldYearPool } = require('./fate-bridge');

let kit = null;

async function loadKit() {
  if (kit) return kit;
  const base = path.join(__dirname, '../../../packages/rag-kit/lib');
  const [config, worldPool, sessionIndex, traceIndex, retrieveMod, supabaseMod, embedMod] = await Promise.all([
    import(path.join(base, 'config.mjs')),
    import(path.join(base, 'world-pool.mjs')),
    import(path.join(base, 'session-index.mjs')),
    import(path.join(base, 'trace-index.mjs')),
    import(path.join(base, 'retrieve.mjs')),
    import(path.join(base, 'supabase-client.mjs')),
    import(path.join(base, 'embed.mjs'))
  ]);
  config.loadEnv();
  kit = {
    config: config.ragConfig(),
    buildFateQuery: worldPool.buildFateQuery,
    refineWorldPool: worldPool.refineWorldPool,
    buildSessionCandidates: sessionIndex.buildSessionCandidates,
    sessionChunksForUpsert: sessionIndex.sessionChunksForUpsert,
    sessionChunksForYear: sessionIndex.sessionChunksForYear,
    buildTraceSummary: traceIndex.buildTraceSummary,
    retrieve: retrieveMod.retrieve,
    upsertChunks: supabaseMod.upsertChunks,
    createRagClient: supabaseMod.createRagClient,
    embedOne: embedMod.embedOne
  };
  return kit;
}

const LOCAL_INDEX_DIR = path.join(__dirname, '../../../packages/rag-kit/data/local-index');

function hasLocalRagIndex() {
  try {
    for (const ns of ['world', 'harness', 'session', 'trace']) {
      const file = path.join(LOCAL_INDEX_DIR, `${ns}.json`);
      if (fs.existsSync(file) && fs.statSync(file).size > 4) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function isConfiguredSecret(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (/YOUR_PROJECT|your_|sk-your|placeholder|changeme|^xxx$/i.test(v)) return false;
  if (v.startsWith('https://YOUR_') || v === 'your_service_role_key' || v === 'your_anon_key') {
    return false;
  }
  return true;
}

function isServiceRoleKey(key) {
  if (!isConfiguredSecret(key)) return false;
  try {
    const payload = key.split('.')[1];
    const role = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
    ).role;
    return role === 'service_role';
  } catch {
    return false;
  }
}

function isRagLive(cfg) {
  if (!cfg.enabled) return false;
  if (isConfiguredSecret(cfg.supabaseUrl) && isServiceRoleKey(cfg.supabaseServiceKey)) return true;
  return hasLocalRagIndex();
}

async function canHybridRetrieve(namespace) {
  const k = await loadKit();
  if (!isEmbedLive(k.config)) return false;
  try {
    const { localIndexHasEmbeddings } = await import(path.join(__dirname, '../../../packages/rag-kit/lib/local-index.mjs'));
    if (localIndexHasEmbeddings(namespace)) return true;
  } catch {
    /* ignore */
  }
  return isConfiguredSecret(k.config.supabaseUrl) && isServiceRoleKey(k.config.supabaseServiceKey);
}

function isLocalProvider(provider) {
  return provider === 'local' || provider === 'xenova';
}

function isEmbedLive(cfg) {
  if (isLocalProvider(cfg.embeddingProvider)) return true;
  return isConfiguredSecret(cfg.dashscopeApiKey) || isConfiguredSecret(cfg.zhipuApiKey);
}

/**
 * M1: Narrow world pool before sampleFateContext (always runs local rules).
 * @param {object} pool
 * @param {object} opts
 */
async function refineWorldPoolForFate(pool, opts) {
  const k = await loadKit();
  const query = k.buildFateQuery(opts);
  let boostIds = [];

  if (isRagLive(k.config) && isEmbedLive(k.config) && query) {
    try {
      const hits = await k.retrieve({
        namespace: 'world',
        query,
        filters: { calendar_year: String(opts.calendarYear) },
        limit: 8,
        strategy: 'hybrid',
        beat_type: opts.beatType
      });
      boostIds = hits.map(h => h.source_id).filter(Boolean);
    } catch (err) {
      console.warn('[rag-service] world vector boost skipped:', err.message);
    }
  }

  return k.refineWorldPool(pool, { ...opts, query, boostIds });
}

/**
 * M2: Build dialogue retrieval context (memory + year snippets + era citations).
 */
async function buildDialogueContext(input) {
  const {
    memory_stream = [],
    years = [],
    user_question = '',
    at_year = 7,
    run_id = 'local',
    profile = {},
    persona_card = null,
    last_fate_context = null
  } = input;

  const k = await loadKit();
  const sessionCandidates = k.buildSessionCandidates({ memory_stream, years, run_id });

  const memoryCandidates = sessionCandidates.filter(c => c.source_type === 'memory');
  const yearCandidates = sessionCandidates.filter(c => c.source_type === 'year_narrative');

  let memoryHits = [];
  let yearHits = [];

  if (user_question) {
    memoryHits = await hybridPick({
      candidates: memoryCandidates,
      namespace: 'session',
      query: user_question,
      filters: run_id ? { run_id } : {},
      limit: 3,
      at_year,
      fallback: () => selectMemories(memory_stream, { limit: 3, at_year, query: user_question })
    });

    yearHits = await hybridPick({
      candidates: yearCandidates,
      namespace: 'session',
      query: user_question,
      filters: run_id ? { run_id } : {},
      limit: 2,
      at_year,
      fallback: () => pickYearSnippetsByOverlap(years, user_question, 2)
    });
  } else {
    memoryHits = selectMemories(memory_stream, { limit: 3, at_year }).map(m => ({
      source_id: m.id,
      content: m.content,
      metadata: { year: m.year, type: m.type, weight: m.weight }
    }));
  }

  const retrievedMemories = mapHitsToMemoryStream(memoryHits, memory_stream);
  const yearSnippets = mapYearHits(yearHits, years);
  const eraCitations = await buildEraCitations({
    user_question,
    profile,
    at_year,
    last_fate_context,
    k
  });

  return {
    memory_stream: retrievedMemories,
    year_snippets: yearSnippets,
    era_citations: eraCitations,
    _rag: {
      memory_count: retrievedMemories.length,
      year_count: yearSnippets.length,
      era_count: eraCitations.length
    }
  };
}

async function hybridPick({ candidates, namespace, query, filters, limit, at_year, fallback }) {
  const k = await loadKit();
  if (!candidates.length) {
    const fb = fallback();
    return Array.isArray(fb) ? fb.map(normalizeFallbackMemory) : [];
  }

  if (await canHybridRetrieve(namespace) || (isRagLive(k.config) && isEmbedLive(k.config))) {
    try {
      const hits = await k.retrieve({
        namespace,
        query,
        filters,
        limit,
        at_year,
        strategy: 'hybrid',
        localCandidates: candidates
      });
      if (hits.length) return hits;
    } catch (err) {
      console.warn('[rag-service] hybrid pick fallback:', err.message);
    }
  }

  const { ruleScore } = await import(path.join(__dirname, '../../../packages/rag-kit/lib/score-rules.mjs'));
  return candidates
    .map(c => ({ ...c, score: ruleScore(c, { query, at_year }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function normalizeFallbackMemory(m) {
  if (m.source_id) return m;
  return {
    source_id: m.id,
    content: m.content,
    metadata: { year: m.year, type: m.type, weight: m.weight }
  };
}

function mapHitsToMemoryStream(hits, original) {
  return hits.map(h => {
    const id = h.source_id || h.id;
    const orig = original.find(m => m.id === id);
    if (orig) return orig;
    return {
      id: id || 'm?',
      year: h.metadata?.year || 1,
      type: h.metadata?.type || 'event',
      content: h.content || '',
      weight: h.metadata?.weight || 0.5
    };
  });
}

function mapYearHits(hits, years) {
  return hits.map(h => {
    const yearNum = h.metadata?.year || parseYearFromSourceId(h.source_id);
    const orig = years.find(y => y.year === yearNum);
    return {
      year: yearNum,
      title: orig?.title || h.metadata?.title || `第${yearNum}年`,
      excerpt: (h.content || orig?.narrative || orig?.event || '').slice(0, 280)
    };
  }).filter(s => s.excerpt);
}

function parseYearFromSourceId(sourceId) {
  const m = String(sourceId || '').match(/year:[^:]+:(\d+)/);
  return m ? Number(m[1]) : null;
}

function pickYearSnippetsByOverlap(years, query, limit) {
  const { overlapScore } = require('./memory-retrieval');
  return [...years]
    .map(y => ({
      source_id: `year:local:${y.year}`,
      content: y.narrative || y.event || '',
      metadata: { year: y.year, title: y.title },
      score: overlapScore(query, `${y.title} ${y.narrative || y.event || ''}`)
    }))
    .filter(x => x.content)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function buildEraCitations({ user_question, profile, at_year, last_fate_context, k }) {
  if (!user_question || !looksEraQuestion(user_question)) {
    return formatFateContextCitations(last_fate_context);
  }

  const calendarYear = calendarYearForNarrative(profile, at_year);
  const pool = loadWorldYearPool(calendarYear);
  if (!pool) return formatFateContextCitations(last_fate_context);

  const macroCandidates = (pool.macro_events || []).slice(0, 80).map((m, i) => ({
    namespace: 'world',
    source_type: 'macro_event',
    source_id: `world:${calendarYear}:macro:${i}`,
    content: `${m.title}\n${m.detail}`,
    metadata: {
      calendar_year: calendarYear,
      title: m.title,
      source_url: m.source_url,
      category: m.category
    }
  }));

  const hits = await hybridPick({
    candidates: macroCandidates,
    namespace: 'world',
    query: user_question,
    filters: { calendar_year: String(calendarYear) },
    limit: 2,
    at_year,
    fallback: () => macroCandidates.slice(0, 2)
  });

  return hits.map(h => ({
    title: h.metadata?.title || h.content?.split('\n')[0]?.slice(0, 40),
    source_url: h.metadata?.source_url || null,
    calendar_year: calendarYear
  })).filter(c => c.title);
}

function formatFateContextCitations(fateCtx) {
  if (!fateCtx?.macro_sample?.length) return [];
  return fateCtx.macro_sample.slice(0, 1).map(m => ({
    title: m.title,
    source_url: m.source_url || null,
    calendar_year: fateCtx.calendar_year
  }));
}

function looksEraQuestion(q) {
  return /时代|那年|社会|高考|改革|疫情|经济|政策|就业|房价|互联网|AI|DeepSeek|复读|考研/.test(q);
}

/**
 * Incremental session index after each year (memory + year narrative).
 */
function indexSessionAfterYear({ run_id, memory, year }) {
  if (!run_id) return;
  void (async () => {
    try {
      const k = await loadKit();
      const rows = k.sessionChunksForYear({
        memory,
        year,
        run_id,
        corpus_version: k.config.corpusVersion
      });
      if (!rows.length) return;

      if (isEmbedLive(k.config)) {
        let embedLive = true;
        for (const row of rows) {
          if (embedLive) {
            try {
              row.embedding = await k.embedOne(row.content, {
                instruction: '为影子人生跨时空对话检索记忆与叙事'
              });
            } catch {
              embedLive = false;
              row.embedding = null;
            }
          }
          await k.upsertChunks([row]);
        }
      } else {
        await k.upsertChunks(rows);
      }
    } catch (err) {
      console.warn('[rag-service] session index:', err.message);
    }
  })();
}

/**
 * M4: Index run trace summary after final.
 */
function indexTraceAfterFinal({ trace, session, storyEval }) {
  void (async () => {
    try {
      const k = await loadKit();
      const row = k.buildTraceSummary({ trace, session, storyEval });
      row.corpus_version = k.config.corpusVersion;
      if (isEmbedLive(k.config)) {
        try {
          row.embedding = await k.embedOne(row.content, {
            instruction: '为 Shadow 叙事 run 复盘检索'
          });
        } catch {
          row.embedding = null;
        }
      }
      await k.upsertChunks([row]);
    } catch (err) {
      console.warn('[rag-service] trace index:', err.message);
    }
  })();
}

/**
 * Harness / world query API backend.
 */
async function queryRag({ query, namespace = 'harness', filters = {}, limit = 6 }) {
  const k = await loadKit();
  if (!query) throw new Error('Missing query');

  if (await canHybridRetrieve(namespace) || (isRagLive(k.config) && isEmbedLive(k.config))) {
    const hits = await k.retrieve({ namespace, query, filters, limit, strategy: 'hybrid' });
    const { hasLocalIndex } = await import(path.join(__dirname, '../../../packages/rag-kit/lib/local-index.mjs'));
    const hasVector = hits.some(h => h.scores?.vector > 0);
    const mode = hasVector ? 'hybrid' : hasLocalIndex(namespace) ? 'rules-index' : 'rules';
    return { hits, mode, rag_enabled: true };
  }

  if (isRagLive(k.config)) {
    const hits = await k.retrieve({ namespace, query, filters, limit, strategy: 'rules' });
    if (hits.length) {
      return { hits, mode: 'rules-index', rag_enabled: true };
    }
  }

  if (namespace === 'harness') {
    const { walkRepoMarkdown } = await import(path.join(__dirname, '../../../packages/rag-kit/lib/chunk-repo.mjs'));
    const { ruleScore } = await import(path.join(__dirname, '../../../packages/rag-kit/lib/score-rules.mjs'));
    const chunks = walkRepoMarkdown();
    const hits = chunks
      .map(c => ({ ...c, score: ruleScore(c, { query }) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { hits, mode: 'rules-local', rag_enabled: false };
  }

  return { hits: [], mode: 'unavailable', rag_enabled: false };
}

async function getRagStatus() {
  const k = await loadKit();
  let local = null;
  try {
    const { getLocalIndexStats } = await import(path.join(__dirname, '../../../packages/rag-kit/lib/local-index.mjs'));
    local = getLocalIndexStats();
  } catch {
    local = null;
  }
  const supabase = isServiceRoleKey(k.config.supabaseServiceKey) && isConfiguredSecret(k.config.supabaseUrl);
  const embedOk = isEmbedLive(k.config);
  const localChunks = local?.total_chunks || 0;
  const vectorChunks = local?.namespaces
    ? Object.values(local.namespaces).reduce((n, s) => n + (s.with_embeddings || 0), 0)
    : 0;
  let mode = 'rules-local';
  if (embedOk && vectorChunks > 100) mode = 'hybrid';
  else if (localChunks) mode = 'rules-index';
  return {
    enabled: k.config.enabled,
    supabase,
    supabase_read: isConfiguredSecret(k.config.supabaseUrl) && isConfiguredSecret(k.config.supabaseAnonKey),
    local_index: local,
    embed_provider: k.config.embeddingProvider,
    embed_configured: embedOk,
    vector_chunks: vectorChunks,
    mode,
    local_chunks: localChunks,
    live: k.config.enabled && (supabase || localChunks > 0),
    corpus_version: k.config.corpusVersion
  };
}

module.exports = {
  loadKit,
  refineWorldPoolForFate,
  buildDialogueContext,
  indexSessionAfterYear,
  indexTraceAfterFinal,
  queryRag,
  getRagStatus,
  isRagLive,
  isEmbedLive
};
