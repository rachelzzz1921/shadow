#!/usr/bin/env node
'use strict';

/**
 * Offline corpus search over data/years/*.json — no Supabase / embedding required.
 * For hybrid vector search see packages/rag-kit (npm run rag:query).
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SCENARIO_DOMAINS, SCENARIO_LABELS } from '../lib/scenario-domains.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data/years');
const STATS_PATH = join(DATA_DIR, '_stats.json');

function usage() {
  console.log(`Usage: node scripts/query-corpus.mjs [options]

Options:
  --q <text>           Keyword search (title/detail/text/summary)
  --year <Y>           Single year or range 2006-2010
  --type macro|micro|summary|atmosphere|pop
  --scenario <domain>  family|love|friendship|academic|career|self_growth
  --category <cat>     macro/micro category filter
  --sensitivity low|medium|high
  --notebooklm         Only years with notebooklm_imported_at
  --can-pivot          Micro with can_pivot=true
  --limit <n>          Max results (default 20)
  --json               JSON output
  --status             Refresh data/years/_stats.json and exit
  --help

Examples:
  npm run query -- --q 疫情 --year 2020
  npm run query -- --scenario academic --year 2018 --limit 10
  npm run query -- --type macro --q 奥运
  npm run query -- --status
`);
}

function parseArgs(argv) {
  const opts = {
    q: '',
    years: null,
    type: 'all',
    scenario: null,
    category: null,
    sensitivity: null,
    notebooklmOnly: false,
    canPivot: false,
    limit: 20,
    json: false,
    status: false,
    help: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--status') opts.status = true;
    else if (a === '--notebooklm') opts.notebooklmOnly = true;
    else if (a === '--can-pivot') opts.canPivot = true;
    else if (a === '--q') opts.q = argv[++i] ?? '';
    else if (a === '--year') opts.years = parseYears(argv[++i]);
    else if (a === '--type') opts.type = argv[++i] ?? 'all';
    else if (a === '--scenario') opts.scenario = argv[++i];
    else if (a === '--category') opts.category = argv[++i];
    else if (a === '--sensitivity') opts.sensitivity = argv[++i];
    else if (a === '--limit') opts.limit = Number(argv[++i]) || 20;
    else if (!a.startsWith('--')) opts.q = [opts.q, a].filter(Boolean).join(' ');
  }
  return opts;
}

function parseYears(spec) {
  if (!spec) return null;
  if (/^\d{4}-\d{4}$/.test(spec)) {
    const [a, b] = spec.split('-').map(Number);
    const out = [];
    for (let y = a; y <= b; y++) out.push(y);
    return out;
  }
  if (/^\d{4}$/.test(spec)) return [Number(spec)];
  return null;
}

function overlapScore(query, content) {
  const q = String(query || '');
  const c = String(content || '');
  if (!q || !c) return 0;
  if (c.includes(q)) return 1;
  let hits = 0;
  const grams = Math.max(1, q.length - 1);
  for (let i = 0; i < q.length - 1; i++) {
    if (c.includes(q.slice(i, i + 2))) hits += 1;
  }
  if (hits > 0) return hits / grams;
  const tokenize = (t) =>
    String(t)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const sa = new Set(tokenize(q));
  const sb = new Set(tokenize(c));
  if (!sa.size || !sb.size) return 0;
  let latin = 0;
  for (const t of sa) if (sb.has(t)) latin += 1;
  return latin / Math.max(sa.size, sb.size);
}

function loadYears(yearFilter) {
  const files = readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .sort();
  const packs = [];
  for (const file of files) {
    const year = Number(file.slice(0, 4));
    if (yearFilter && !yearFilter.includes(year)) continue;
    const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
    packs.push(data);
  }
  return packs;
}

function countScenarios(micros) {
  const c = Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, 0]));
  for (const m of micros) {
    if (c[m.scenario] !== undefined) c[m.scenario]++;
  }
  return c;
}

function refreshStats() {
  const packs = loadYears(null);
  const stats = packs.map((p) => ({
    year: p.calendar_year,
    macro: p.macro_events?.length ?? 0,
    micro: p.micro_events?.length ?? 0,
    atmosphere_keys: p.atmosphere ? Object.keys(p.atmosphere).length : 0,
    pop: p.pop_culture?.length ?? 0,
    sources: p.sources?.length ?? 0,
    notebooklm: Boolean(p.notebooklm_imported_at),
    notebooklm_gaps: p.notebooklm_gaps?.length ?? 0,
    scenarios: countScenarios(p.micro_events || [])
  }));
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2) + '\n', 'utf8');
  return stats;
}

function collectHits(packs, opts) {
  const hits = [];
  const q = opts.q.trim();

  for (const pack of packs) {
    if (opts.notebooklmOnly && !pack.notebooklm_imported_at) continue;
    const year = pack.calendar_year;

    const push = (hit) => {
      if (opts.scenario && hit.scenario !== opts.scenario) return;
      if (opts.category && hit.category !== opts.category) return;
      if (opts.sensitivity && hit.sensitivity !== opts.sensitivity) return;
      if (opts.canPivot && hit.kind === 'micro' && !hit.can_pivot) return;
      if (q) hit.score = overlapScore(q, hit.text);
      else hit.score = hit.weight ?? 1;
      if (q && hit.score <= 0) return;
      hits.push(hit);
    };

    if (opts.type === 'all' || opts.type === 'summary') {
      const text = [pack.summary, pack.social_mood, pack.notebooklm_summary, pack.notebooklm_social_mood]
        .filter(Boolean)
        .join('\n');
      if (text) {
        push({
          kind: 'summary',
          year,
          text,
          category: null,
          scenario: null,
          sensitivity: null,
          can_pivot: null,
          source_url: null,
          title: `${year} 年度摘要`
        });
      }
    }

    if (opts.type === 'all' || opts.type === 'atmosphere') {
      const atmo = pack.atmosphere;
      if (atmo) {
        push({
          kind: 'atmosphere',
          year,
          text: Object.entries(atmo)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n'),
          category: 'atmosphere',
          scenario: null,
          sensitivity: null,
          can_pivot: null,
          source_url: null,
          title: `${year} atmosphere`
        });
      }
    }

    if (opts.type === 'all' || opts.type === 'pop') {
      for (const item of pack.pop_culture || []) {
        push({
          kind: 'pop',
          year,
          text: item,
          category: 'pop_culture',
          scenario: null,
          sensitivity: null,
          can_pivot: null,
          source_url: null,
          title: item.slice(0, 40)
        });
      }
    }

    if (opts.type === 'all' || opts.type === 'macro') {
      for (const ev of pack.macro_events || []) {
        push({
          kind: 'macro',
          year,
          text: `${ev.title}\n${ev.detail || ''}`,
          title: ev.title,
          category: ev.category,
          scenario: ev.scenario,
          sensitivity: ev.sensitivity,
          can_pivot: null,
          source_url: ev.source_url,
          weight: ev.weight
        });
      }
    }

    if (opts.type === 'all' || opts.type === 'micro') {
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
          source_url: null,
          weight: ev.weight
        });
      }
    }
  }

  hits.sort((a, b) => b.score - a.score || a.year - b.year);
  return hits.slice(0, opts.limit);
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help) {
  usage();
  process.exit(0);
}

if (opts.status) {
  const stats = refreshStats();
  const totalMacro = stats.reduce((s, r) => s + r.macro, 0);
  const totalMicro = stats.reduce((s, r) => s + r.micro, 0);
  const nlm = stats.filter((r) => r.notebooklm).length;
  console.log(`Updated ${STATS_PATH}`);
  console.log(`${stats.length} years | macro=${totalMacro} micro=${totalMicro} | notebooklm=${nlm}/${stats.length}`);
  process.exit(0);
}

const packs = loadYears(opts.years);
const hits = collectHits(packs, opts);

const payload = {
  query: opts.q || null,
  filters: {
    years: opts.years,
    type: opts.type,
    scenario: opts.scenario,
    category: opts.category,
    sensitivity: opts.sensitivity,
    notebooklm_only: opts.notebooklmOnly,
    can_pivot: opts.canPivot || null
  },
  total: hits.length,
  results: hits.map((h) => ({
    score: Number(h.score?.toFixed(4) ?? 0),
    year: h.year,
    kind: h.kind,
    title: h.title,
    category: h.category,
    scenario: h.scenario,
    scenario_label: h.scenario ? SCENARIO_LABELS[h.scenario] : null,
    sensitivity: h.sensitivity,
    can_pivot: h.can_pivot,
    source_url: h.source_url,
    text: h.text?.slice(0, 200)
  }))
};

if (opts.json) {
  console.log(JSON.stringify(payload, null, 2));
} else if (!hits.length) {
  console.log('No matches.');
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`Found ${hits.length} hit(s) across ${packs.length} year(s)\n`);
  for (const [i, h] of hits.entries()) {
    const label = h.scenario ? SCENARIO_LABELS[h.scenario] : '';
    console.log(`--- #${i + 1} score=${h.score?.toFixed(3)} ${h.year} ${h.kind} ---`);
    if (h.title) console.log(h.title);
    if (label) console.log(`scenario: ${label} (${h.scenario})`);
    if (h.category) console.log(`category: ${h.category}`);
    if (h.sensitivity) console.log(`sensitivity: ${h.sensitivity}`);
    if (h.can_pivot) console.log('can_pivot: true');
    if (h.source_url) console.log(`source: ${h.source_url}`);
    console.log((h.text || '').slice(0, 300) + ((h.text?.length ?? 0) > 300 ? '…' : ''));
  }
}

process.exit(hits.length ? 0 : 1);
