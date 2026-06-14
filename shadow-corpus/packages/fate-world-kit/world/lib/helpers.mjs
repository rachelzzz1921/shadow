'use strict';

export const VERSION = process.env.WORLD_CORPUS_VERSION || '2026.06.14-v1';

export function macro(category, title, detail, source_url, weight = 1, sensitivity = 'low', tags = []) {
  return { category, title, detail, source_url, weight, sensitivity, tags };
}

export function micro(category, text, weight = 1, can_pivot = false, sensitivity = 'low', tags = []) {
  return { category, text, weight, can_pivot, sensitivity, tags };
}

/** 六域专属 micro，显式标注 scenario */
export function scenarioMicro(scenario, category, text, weight = 1, can_pivot = false, sensitivity = 'low', tags = []) {
  return { category, text, weight, can_pivot, sensitivity, tags, scenario };
}

export function dedupeByText(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.text || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function dedupeMacros(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  });
}
