'use strict';

/**
 * Deterministic memory_stream retrieval for Final / Dialogue prompts.
 * See 02-technical-design/02-p0-memory-reflection-replan.md
 */

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function overlapScore(query, content) {
  const q = String(query || '');
  const c = String(content || '');
  if (!q || !c) return 0;
  if (c.includes(q)) return 1;

  // CJK bigram overlap
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

function scoreMemory(entry, { at_year = 7, query = '' }) {
  const weight = Number(entry.weight) || 0.5;
  const year = Number(entry.year) || 1;
  const recency = 1 / (1 + Math.max(0, at_year - year));
  const relevance = query ? overlapScore(query, entry.content) : 0;

  if (query) {
    return relevance * 0.6 + weight * 0.25 + recency * 0.15;
  }
  return weight * 0.55 + recency * 0.35 + relevance * 0.10;
}

/**
 * @param {Array<{id:string,year:number,type:string,content:string,weight:number}>} memory_stream
 * @param {{ limit?: number, at_year?: number, query?: string }} opts
 */
function selectMemories(memory_stream, opts = {}) {
  const { limit = 5, at_year = 7, query = '' } = opts;
  if (!Array.isArray(memory_stream) || !memory_stream.length) return [];

  const ranked = memory_stream
    .map(entry => ({ entry, score: scoreMemory(entry, { at_year, query }) }))
    .sort((a, b) => b.score - a.score || b.entry.year - a.entry.year);

  const picked = [];
  const seen = new Set();
  for (const { entry } of ranked) {
    if (picked.length >= limit) break;
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    picked.push(entry);
  }
  return picked.sort((a, b) => a.year - b.year);
}

module.exports = {
  selectMemories,
  scoreMemory,
  overlapScore
};
