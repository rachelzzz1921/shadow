'use strict';

/** Strip noise for near-duplicate comparison (CN + Latin). */
export function normalizeForDedupe(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\[cite:[^\]]*\]/gi, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** Bigram overlap ratio — same heuristic as rag-kit score-rules. */
export function textSimilarity(a, b) {
  const na = normalizeForDedupe(a);
  const nb = normalizeForDedupe(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.95;

  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  let hits = 0;
  for (let i = 0; i < shorter.length - 1; i++) {
    if (longer.includes(shorter.slice(i, i + 2))) hits += 1;
  }
  const grams = Math.max(1, shorter.length - 1);
  return hits / grams;
}

export function isNearDuplicate(a, b, threshold = 0.85) {
  return textSimilarity(a, b) >= threshold;
}

/**
 * Dedupe items by fuzzy text match (default: item.text || item.title).
 * First occurrence wins (earlier items preserved — base corpus before patch).
 */
export function dedupeByTextFuzzy(items, opts = {}) {
  const {
    getText = (item) => item.text || item.title || '',
    threshold = 0.85
  } = opts;
  const kept = [];
  for (const item of items) {
    const text = getText(item);
    if (!text) {
      kept.push(item);
      continue;
    }
    const dup = kept.some((k) => isNearDuplicate(getText(k), text, threshold));
    if (!dup) kept.push(item);
  }
  return kept;
}

export function dedupeMacrosFuzzy(items, threshold = 0.85) {
  return dedupeByTextFuzzy(items, {
    getText: (item) => item.title || '',
    threshold
  });
}
