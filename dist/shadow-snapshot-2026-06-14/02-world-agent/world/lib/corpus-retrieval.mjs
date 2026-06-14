'use strict';

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { textSimilarity } from './dedupe.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data/years');

/** @typedef {'none'|'local'|'rules'|'hybrid'} RetrievalStrategy */

/**
 * Load a single year pack from frozen JSON.
 * @param {number} calendarYear
 */
export function loadYearPack(calendarYear) {
  const path = join(DATA_DIR, `${calendarYear}.json`);
  if (!existsSync(path)) {
    throw new Error(`Missing year pack: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * L1 offline keyword search over macro/micro/summary.
 * Same contract surface as rag-kit retrieve (subset of fields).
 */
export function searchCorpus({
  query = '',
  years = null,
  type = 'all',
  scenario = null,
  category = null,
  sensitivity = null,
  limit = 20
} = {}) {
  const q = String(query).trim();
  const files = readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .sort();
  const hits = [];

  for (const file of files) {
    const year = Number(file.slice(0, 4));
    if (years && !years.includes(year)) continue;
    const pack = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));

    const push = (hit) => {
      if (scenario && hit.scenario !== scenario) return;
      if (category && hit.category !== category) return;
      if (sensitivity && hit.sensitivity !== sensitivity) return;
      hit.score = q ? textSimilarity(q, hit.text) : hit.weight ?? 1;
      if (q && hit.score <= 0) return;
      hits.push(hit);
    };

    if (type === 'all' || type === 'summary') {
      const text = [pack.summary, pack.social_mood, pack.notebooklm_summary, pack.notebooklm_social_mood]
        .filter(Boolean)
        .join('\n');
      if (text) {
        push({ kind: 'summary', year, text, title: `${year} 年度摘要` });
      }
    }

    if (type === 'all' || type === 'macro') {
      for (const ev of pack.macro_events || []) {
        push({
          kind: 'macro',
          year,
          text: `${ev.title}\n${ev.detail || ''}`,
          title: ev.title,
          category: ev.category,
          scenario: ev.scenario,
          sensitivity: ev.sensitivity,
          source_url: ev.source_url,
          weight: ev.weight
        });
      }
    }

    if (type === 'all' || type === 'micro') {
      for (const ev of pack.micro_events || []) {
        push({
          kind: 'micro',
          year,
          text: ev.text,
          title: ev.text?.slice(0, 40),
          category: ev.category,
          scenario: ev.scenario,
          sensitivity: ev.sensitivity,
          can_pivot: ev.can_pivot,
          weight: ev.weight
        });
      }
    }
  }

  hits.sort((a, b) => b.score - a.score || a.year - b.year);
  return hits.slice(0, limit);
}

let _ragPool = null;

async function loadRagPool() {
  if (_ragPool) return _ragPool;
  try {
    _ragPool = await import('../../packages/rag-kit/lib/world-pool.mjs');
    return _ragPool;
  } catch {
    return null;
  }
}

/**
 * Optional L2 rules pre-filter (profile/persona weighted overlap).
 * Falls back to input pool when rag-kit unavailable.
 */
export async function refinePoolForFate(pool, opts = {}) {
  const rag = await loadRagPool();
  if (rag?.refineWorldPool) {
    return rag.refineWorldPool(pool, opts);
  }
  return pool;
}

/**
 * Unified retrieval entry — strategy selects adapter.
 * @param {object} opts
 * @param {RetrievalStrategy} opts.strategy
 * @param {object} [opts.pool] — required for rules/hybrid pool prep
 */
export async function retrieveCorpus(opts = {}) {
  const { strategy = 'none', pool, ...rest } = opts;

  if (strategy === 'local') {
    return { mode: 'local', hits: searchCorpus(rest) };
  }

  if (strategy === 'rules' && pool) {
    const refined = await refinePoolForFate(pool, rest);
    return { mode: 'rules', pool: refined, refine: refined._rag_refine ?? null };
  }

  if (strategy === 'hybrid') {
    const localHits = rest.query ? searchCorpus(rest) : [];
    const refined = pool ? await refinePoolForFate(pool, rest) : pool;
    return {
      mode: 'hybrid',
      hits: localHits,
      pool: refined,
      refine: refined?._rag_refine ?? null
    };
  }

  return { mode: 'none', pool };
}

/**
 * Prepare year pool before weighted sampling in sampleFateContext.
 * @param {RetrievalStrategy} strategy
 */
export async function preparePoolForSampling(pool, strategy, opts = {}) {
  if (strategy === 'none' || !pool) return pool;
  if (strategy === 'local') return pool;
  const result = await retrieveCorpus({ strategy: strategy === 'hybrid' ? 'hybrid' : 'rules', pool, ...opts });
  return result.pool ?? pool;
}
