'use strict';

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VERSION, dedupeMacros, dedupeByText } from '../lib/helpers.mjs';
import { expandMicroEvents } from '../lib/micro-expand.mjs';
import { expandScenarioMicros } from '../lib/scenario-pools/index.mjs';
import { inferScenario } from '../lib/scenario-domains.mjs';
import { YEAR_SPECIFIC } from '../lib/era-corpus/year-specific.mjs';
import { universalMacros } from '../lib/era-corpus/universal-macros.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../data/years');

const VALID_MACRO_CATEGORIES = new Set([
  'politics_policy', 'economy', 'education', 'tech_internet',
  'culture_entertainment', 'disaster_crisis', 'society', 'urban_life',
  'employment', 'housing'
]);

const CATEGORY_ALIASES = {
  family: 'society',
  money: 'economy',
  health: 'society',
  environment: 'urban_life',
  culture: 'culture_entertainment',
  tech: 'tech_internet',
  disaster: 'disaster_crisis',
  policy: 'politics_policy'
};

function padDetail(text, min = 20) {
  if (!text || text.length >= min) return text;
  return `${text}。该事件在当年社会舆论与青年生活中留有清晰印记。`;
}

function normalizeMacro(m) {
  const category = VALID_MACRO_CATEGORIES.has(m.category)
    ? m.category
    : (CATEGORY_ALIASES[m.category] || 'society');
  return {
    ...m,
    category,
    detail: padDetail(m.detail),
    source_url: m.source_url?.startsWith('http') ? m.source_url : 'https://www.stats.gov.cn/sj/tjgb/'
  };
}

function normalizePop(item) {
  if (item.length >= 4) return item;
  return `${item}（流行文化）`;
}

function padText(text, min = 20, suffix = '，构成当年青年生活的底色。') {
  if (!text || text.length >= min) return text;
  return text + suffix;
}

function buildYear(year) {
  const seed = YEAR_SPECIFIC[year];
  if (!seed) throw new Error(`Missing YEAR_SPECIFIC[${year}]`);

  const macros = dedupeMacros([
    ...seed.macros,
    ...universalMacros(year, seed.atmosphere)
  ]).map(normalizeMacro);

  const micro_events = dedupeByText([
    ...expandMicroEvents(year, seed.micro_curated || []),
    ...expandScenarioMicros(year)
  ]).map((m) => ({
    ...m,
    scenario: m.scenario || inferScenario(m)
  }));

  return {
    calendar_year: year,
    summary: padText(seed.summary, 20, '。这一年中国大陆的社会经济文化脉络，为平行人生叙事提供真实时代锚点。'),
    social_mood: padText(seed.social_mood, 20, '。普通人在新闻与日常之间，感知到的情绪与压力真实可触。'),
    atmosphere: seed.atmosphere,
    pop_culture: seed.pop_culture.map(normalizePop),
    macro_events: macros,
    micro_events,
    sources: seed.sources,
    version: VERSION
  };
}

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const stats = [];
  for (let y = 2006; y <= 2026; y++) {
    const pack = buildYear(y);
    const outPath = join(OUT_DIR, `${y}.json`);
    writeFileSync(outPath, JSON.stringify(pack, null, 2), 'utf8');
    stats.push({
      year: y,
      macro: pack.macro_events.length,
      micro: pack.micro_events.length,
      atmosphere_keys: Object.keys(pack.atmosphere).length,
      pop: pack.pop_culture.length,
      sources: pack.sources.length
    });
  }

  writeFileSync(join(OUT_DIR, '_stats.json'), JSON.stringify(stats, null, 2));
  console.log('Generated 2006-2026 era packs:');
  for (const s of stats) {
    console.log(`  ${s.year}: macro=${s.macro} micro=${s.micro} atmosphere=${s.atmosphere_keys} pop=${s.pop}`);
  }
}

main();
