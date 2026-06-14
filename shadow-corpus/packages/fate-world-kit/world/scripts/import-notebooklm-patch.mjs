'use strict';

/**
 * Merge NotebookLM patch JSON into world/data/years/{year}.json
 * China-mainland base wins for summary/stats; patch adds macros/micros + fills null atmosphere only.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { dedupeByText, dedupeMacros } from '../lib/helpers.mjs';
import { inferScenario } from '../lib/scenario-domains.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMPORT_DIR = join(__dirname, '../data/notebooklm-import');
const YEARS_DIR = join(__dirname, '../data/years');
const dryRun = process.argv.includes('--dry-run');

function cleanSourceUrl(url) {
  if (!url || typeof url !== 'string') return 'https://www.stats.gov.cn/sj/tjgb/';
  const m = url.trim().match(/^(https?:\/\/[^\s]+)/);
  return m ? m[1] : 'https://www.stats.gov.cn/sj/tjgb/';
}

function normalizePatchItem(item) {
  if (item.source_url) item.source_url = cleanSourceUrl(item.source_url);
  if (item.detail && item.source_url === 'https://www.stats.gov.cn/sj/tjgb/') {
    const extra = item.detail.match(/(?:报告|来源)[：:]\s*(.+)$/)?.[1];
    if (extra && !item.detail.includes('stats.gov.cn')) {
      item.detail = `${item.detail}（出处：${extra}）`;
    }
  }
  return item;
}

function mergeAtmosphere(base, patch) {
  const out = { ...base };
  if (!patch || typeof patch !== 'object') return out;
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (out[k] === null || out[k] === undefined || out[k] === '') {
      out[k] = v;
    }
  }
  if (patch.meme_keywords?.length) {
    out.meme_keywords = [...new Set([...(out.meme_keywords || []), ...patch.meme_keywords])];
  }
  if (patch.dominant_anxiety && !out.international_anxiety) {
    out.international_anxiety = patch.dominant_anxiety;
  }
  return out;
}

function shouldKeepBaseNarrative(patch) {
  if (!Array.isArray(patch.notebooklm_gaps)) return false;
  const g = patch.notebooklm_gaps.join(' ');
  return /中国大陆|统计|GDP|CPI|高考|国内/.test(g);
}

function isUrl(s) {
  return typeof s === 'string' && /^https?:\/\//.test(s.trim());
}

function sanitizeSources(out) {
  const all = out.sources || [];
  const urls = all.filter(isUrl);
  const refs = all.filter((s) => !isUrl(s));
  out.sources = urls;
  if (refs.length) {
    out.notebooklm_sources = [...new Set([...(out.notebooklm_sources || []), ...refs])];
  }
  return out;
}

function mergeYear(base, patch) {
  const out = { ...base };
  const keepBase = shouldKeepBaseNarrative(patch);

  if (patch.summary?.length >= 20) {
    if (keepBase && base.summary?.length >= 20) {
      out.notebooklm_summary = patch.summary;
    } else {
      out.summary = patch.summary;
    }
  }
  if (patch.social_mood?.length >= 20) {
    if (keepBase && base.social_mood?.length >= 20) {
      out.notebooklm_social_mood = patch.social_mood;
    } else {
      out.social_mood = patch.social_mood;
    }
  }

  out.atmosphere = mergeAtmosphere(out.atmosphere || {}, patch.atmosphere);

  if (Array.isArray(patch.pop_culture) && patch.pop_culture.length) {
    out.pop_culture = [...new Set([...(out.pop_culture || []), ...patch.pop_culture])];
  }
  if (Array.isArray(patch.sources) && patch.sources.length) {
    const urls = patch.sources.filter(isUrl);
    const refs = patch.sources.filter((s) => !isUrl(s));
    out.sources = [...new Set([...(out.sources || []), ...urls])];
    if (refs.length) {
      out.notebooklm_sources = [...new Set([...(out.notebooklm_sources || []), ...refs])];
    }
  }

  const patchMacros = (patch.macro_events || []).map(normalizePatchItem);
  out.macro_events = dedupeMacros([...(out.macro_events || []), ...patchMacros]);

  const patchMicros = (patch.micro_events || []).map((m) => ({
    ...m,
    scenario: m.scenario || inferScenario(m)
  }));
  out.micro_events = dedupeByText([...(out.micro_events || []), ...patchMicros]);

  if (patch.notebooklm_gaps?.length) {
    out.notebooklm_gaps = patch.notebooklm_gaps;
  }
  out.notebooklm_imported_at = new Date().toISOString().slice(0, 10);

  return sanitizeSources(out);
}

function main() {
  if (!existsSync(IMPORT_DIR)) {
    mkdirSync(IMPORT_DIR, { recursive: true });
    console.log(`Created ${IMPORT_DIR}`);
    return;
  }

  const files = readdirSync(IMPORT_DIR).filter((f) => f.endsWith('.patch.json'));
  if (!files.length) {
    console.log('No *.patch.json in notebooklm-import/');
    return;
  }

  const byYear = new Map();
  for (const file of files) {
    const patch = JSON.parse(readFileSync(join(IMPORT_DIR, file), 'utf8'));
    const y = patch.calendar_year;
    if (!y) {
      console.warn(`Skip ${file}: missing calendar_year`);
      continue;
    }
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push({ file, patch });
  }

  for (const [year, patches] of byYear) {
    const yearPath = join(YEARS_DIR, `${year}.json`);
    if (!existsSync(yearPath)) {
      console.warn(`Skip year ${year}: no base ${yearPath}`);
      continue;
    }
    let merged = JSON.parse(readFileSync(yearPath, 'utf8'));
    for (const { file, patch } of patches) {
      merged = mergeYear(merged, patch);
      console.log(`  merged ${file} → ${year}${shouldKeepBaseNarrative(patch) ? ' (kept CN summary)' : ''}`);
    }
    if (!dryRun) {
      writeFileSync(yearPath, JSON.stringify(merged, null, 2), 'utf8');
    }
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${year}: macro=${merged.macro_events.length} micro=${merged.micro_events.length}`
    );
  }

  if (!dryRun) console.log('\nRun: npm run validate');
}

main();
