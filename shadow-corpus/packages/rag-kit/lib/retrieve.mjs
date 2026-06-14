'use strict';

import { ragConfig } from './config.mjs';
import { embedOne, cosineSimilarity } from './embed.mjs';
import { fetchCandidates } from './supabase-client.mjs';
import { ruleScore } from './score-rules.mjs';

/**
 * Hybrid retrieval: metadata filter → rule pre-rank → optional vector rerank.
 *
 * @param {{
 *   namespace: string,
 *   query?: string,
 *   filters?: Record<string, string|number|boolean>,
 *   limit?: number,
 *   strategy?: 'rules' | 'vector' | 'hybrid',
 *   at_year?: number,
 *   scenario?: string,
 *   beat_type?: string,
 *   localCandidates?: object[],
 * }} opts
 */
export async function retrieve(opts) {
  const cfg = ragConfig();
  const {
    namespace,
    query = '',
    filters = {},
    limit = 8,
    strategy = 'hybrid',
    at_year,
    scenario,
    beat_type,
    localCandidates
  } = opts;

  const effectiveStrategy = !cfg.enabled ? 'rules' : strategy;

  let candidates = localCandidates;
  if (!candidates?.length) {
    candidates = await fetchCandidates({ namespace, filters, limit: 200 });
  }
  if (!candidates?.length) return [];

  const ctx = { query, at_year, scenario, beat_type };
  const ruleRanked = candidates
    .map(c => ({ chunk: c, rule: ruleScore(c, ctx) }))
    .sort((a, b) => b.rule - a.rule);

  const pool = ruleRanked.slice(0, Math.max(limit * 3, 24));

  if (effectiveStrategy === 'rules' || !query) {
    return pool.slice(0, limit).map(({ chunk, rule }) => ({
      ...chunk,
      score: rule,
      scores: { rule, vector: 0, final: rule }
    }));
  }

  let queryVec = null;
  try {
    queryVec = await embedOne(query, {
      instruction: namespace === 'world'
        ? '为平行人生叙事检索时代背景与际遇'
        : namespace === 'harness'
          ? '为 Shadow Harness 开发文档检索'
          : '为影子人生跨时空对话检索记忆与叙事'
    });
  } catch {
    return pool.slice(0, limit).map(({ chunk, rule }) => ({
      ...chunk,
      score: rule,
      scores: { rule, vector: 0, final: rule }
    }));
  }

  const hybrid = pool.map(({ chunk, rule }) => {
    const vector = queryVec && chunk.embedding
      ? cosineSimilarity(queryVec, parseEmbedding(chunk.embedding))
      : 0;
    const business = businessScore(chunk, ctx);
    const final = effectiveStrategy === 'vector'
      ? vector * 0.7 + business * 0.3
      : vector * 0.45 + rule * 0.30 + business * 0.25;
    return { chunk, rule, vector, business, final };
  });

  hybrid.sort((a, b) => b.final - a.final);

  return hybrid.slice(0, limit).map(({ chunk, rule, vector, business, final }) => ({
    ...chunk,
    score: final,
    scores: { rule, vector, business, final }
  }));
}

function businessScore(chunk, ctx) {
  const meta = chunk.metadata || {};
  let s = 0.5;
  if (meta.source_url) s += 0.05;
  if (ctx.scenario && meta.scenario === ctx.scenario) s += 0.2;
  if (meta.type === 'decision') s += 0.15;
  return Math.min(1, s);
}

/** Supabase may return embedding as string "[...]" or array. */
function parseEmbedding(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}
