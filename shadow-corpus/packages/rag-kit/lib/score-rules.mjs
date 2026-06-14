'use strict';

/**
 * Rule scoring ported from archive/demo-v0.2/lib/memory-retrieval.js concepts.
 */

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function overlapScore(query, content) {
  const q = String(query || '');
  const c = String(content || '');
  if (!q || !c) return 0;
  if (c.includes(q)) return 1;

  let hits = 0;
  const grams = Math.max(1, q.length - 1);
  for (let i = 0; i < q.length - 1; i++) {
    if (c.includes(q.slice(i, i + 2))) hits += 1;
  }
  const cjk = hits / grams;
  if (cjk > 0) return cjk;

  const sa = new Set(tokenize(q));
  const sb = new Set(tokenize(c));
  if (!sa.size || !sb.size) return 0;
  let latin = 0;
  for (const t of sa) {
    if (sb.has(t)) latin += 1;
  }
  return latin / Math.max(sa.size, sb.size);
}

/**
 * @param {object} chunk — rag_chunks row
 * @param {{ query?: string, at_year?: number, scenario?: string, beat_type?: string }} ctx
 */
export function ruleScore(chunk, ctx = {}) {
  const meta = chunk.metadata || {};
  const content = chunk.content || '';
  const query = ctx.query || '';

  let score = Number(meta.weight) || 0.5;

  if (query) {
    score = overlapScore(query, content) * 0.55 + score * 0.25;
  }

  if (ctx.at_year != null && meta.year != null) {
    const recency = 1 / (1 + Math.max(0, ctx.at_year - Number(meta.year)));
    score += recency * 0.15;
  }

  if (ctx.scenario && meta.scenario === ctx.scenario) {
    score += 0.12;
  }

  if (ctx.beat_type === 'pivotal' && meta.can_pivot === true) {
    score += 0.1;
  }

  if (meta.sensitivity === 'high') {
    score *= 0.85;
  }

  return Math.min(1, score);
}
