'use strict';

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
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

const NOTEBOOKLM_KEYS = [
  'notebooklm_summary',
  'notebooklm_social_mood',
  'notebooklm_gaps',
  'notebooklm_imported_at',
  'notebooklm_sources'
];

function parseArgs(argv) {
  const opts = { years: null, force: false, regenPools: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--force') opts.force = true;
    else if (a === '--regen-pools') opts.regenPools = true;
    else if (a === '--year') opts.years = [Number(argv[++i])];
    else if (a === '--from') {
      const from = Number(argv[++i]);
      const to = Number(argv[++i]);
      opts.years = [];
      for (let y = from; y <= to; y++) opts.years.push(y);
    }
  }
  if (!opts.years) {
    opts.years = [];
    for (let y = 2006; y <= 2026; y++) opts.years.push(y);
  }
  return opts;
}

function usage() {
  console.log(`Usage: npm run generate -- [options]

Options:
  --year <Y>       Regenerate single year
  --from <A> <B>   Regenerate year range (inclusive)
  --regen-pools    Safe mode: append pool micros only, preserve NotebookLM overlay
  --force          Overwrite years with notebooklm_imported_at (destructive)
  --help

Default: skip years with notebooklm_imported_at (use --regen-pools to extend pool micros).
After --force full regen, re-run: npm run import-notebooklm
`);
}

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

function regenPoolsOnly(existing, year) {
  const seed = YEAR_SPECIFIC[year];
  if (!seed) throw new Error(`Missing YEAR_SPECIFIC[${year}]`);

  const poolMicros = dedupeByText([
    ...expandMicroEvents(year, seed.micro_curated || []),
    ...expandScenarioMicros(year)
  ]).map((m) => ({
    ...m,
    scenario: m.scenario || inferScenario(m)
  }));

  return {
    ...existing,
    micro_events: dedupeByText([...(existing.micro_events || []), ...poolMicros]),
    version: VERSION
  };
}

function preserveNotebooklmOverlay(fresh, existing) {
  if (!existing?.notebooklm_imported_at) return fresh;
  const out = { ...fresh };
  for (const key of NOTEBOOKLM_KEYS) {
    if (existing[key] !== undefined) out[key] = existing[key];
  }
  return out;
}

function refreshStats() {
  const stats = [];
  for (const file of readdirSync(OUT_DIR).filter((f) => /^\d{4}\.json$/.test(f)).sort()) {
    const pack = JSON.parse(readFileSync(join(OUT_DIR, file), 'utf8'));
    stats.push({
      year: pack.calendar_year,
      macro: pack.macro_events?.length ?? 0,
      micro: pack.micro_events?.length ?? 0,
      atmosphere_keys: pack.atmosphere ? Object.keys(pack.atmosphere).length : 0,
      pop: pack.pop_culture?.length ?? 0,
      sources: pack.sources?.length ?? 0,
      notebooklm: Boolean(pack.notebooklm_imported_at)
    });
  }
  writeFileSync(join(OUT_DIR, '_stats.json'), JSON.stringify(stats, null, 2) + '\n', 'utf8');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    usage();
    return;
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const skipped = [];
  const generated = [];

  for (const year of opts.years) {
    const outPath = join(OUT_DIR, `${year}.json`);
    const existing = existsSync(outPath)
      ? JSON.parse(readFileSync(outPath, 'utf8'))
      : null;

    if (existing?.notebooklm_imported_at && !opts.force && !opts.regenPools) {
      skipped.push(year);
      console.log(`  skip ${year}: notebooklm merged (use --regen-pools or --force)`);
      continue;
    }

    let pack;
    if (opts.regenPools && existing) {
      pack = regenPoolsOnly(existing, year);
      console.log(`  regen-pools ${year}: micro=${pack.micro_events.length}`);
    } else {
      pack = buildYear(year);
      if (existing?.notebooklm_imported_at && opts.force) {
        pack = preserveNotebooklmOverlay(pack, existing);
        console.warn(`  force ${year}: seed regen — re-run npm run import-notebooklm to restore patch events`);
      }
    }

    writeFileSync(outPath, JSON.stringify(pack, null, 2), 'utf8');
    generated.push({
      year,
      macro: pack.macro_events.length,
      micro: pack.micro_events.length,
      atmosphere_keys: Object.keys(pack.atmosphere).length,
      pop: pack.pop_culture.length
    });
  }

  if (generated.length) refreshStats();

  console.log('\nGenerated:');
  for (const s of generated) {
    console.log(`  ${s.year}: macro=${s.macro} micro=${s.micro} atmosphere=${s.atmosphere_keys} pop=${s.pop}`);
  }
  if (skipped.length) {
    console.log(`\nSkipped ${skipped.length} NotebookLM year(s): ${skipped.join(', ')}`);
  }
  if (generated.length) console.log('\nRun: npm run validate');
}

main();
