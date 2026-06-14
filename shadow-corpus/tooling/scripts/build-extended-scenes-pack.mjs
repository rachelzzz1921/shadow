#!/usr/bin/env node
/**
 * extended-scenes-v1: enrich CSV → categorized sheets + manifest + master 135 + docs bundle
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTENDED_AGENT_FIELDS, AGENT_EXTRA_HEADERS } from '../../visual/registry/packs/extended-agent-metadata.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const PACK = path.join(ROOT, 'shadow-corpus/visual/registry/packs');
const SRC = path.join(PACK, 'extended-scenes-v1.csv');
const OUT_DIR = path.join(PACK, 'extended-scenes-v1-sheets');
const MANIFEST = path.join(PACK, 'extended-scenes-v1-manifest.json');
const DOCS_MANIFEST = path.join(ROOT, 'docs/extended-scenes-v1-manifest.json');
const DOCS_MAP = path.join(ROOT, 'docs/extended-agent-ui-map.json');

/** @type {Record<string, { id: string, label: string, order: number }>} */
const CATEGORIES = {
  season_fx: { id: 'season_fx', label: '01_四季气候FX', order: 1 },
  rural_hometown: { id: 'rural_hometown', label: '02_乡镇农村老家', order: 2 },
  park_night_sky: { id: 'park_night_sky', label: '03_公园星夜天空', order: 3 },
  transit_interior: { id: 'transit_interior', label: '04_地铁高铁车厢', order: 4 },
  festival_culture: { id: 'festival_culture', label: '05_节庆文化道具', order: 5 },
  bookstore_study: { id: 'bookstore_study', label: '06_书店学习空间', order: 6 },
  character_expression: { id: 'character_expression', label: '07_角色表情氛围', order: 7 },
  support_ui_transition: { id: 'support_ui_transition', label: '08_转场UI辅助', order: 8 }
};

/** @type {Record<string, string>} */
const ASSET_CATEGORY = {
  'PX-EXT-001': 'season_fx', 'PX-EXT-002': 'season_fx', 'PX-EXT-003': 'season_fx',
  'PX-EXT-004': 'season_fx', 'PX-EXT-005': 'season_fx', 'PX-EXT-006': 'season_fx',
  'PX-EXT-007': 'season_fx', 'PX-EXT-008': 'season_fx', 'PX-EXT-009': 'season_fx',
  'PX-EXT-010': 'rural_hometown', 'PX-EXT-011': 'rural_hometown', 'PX-EXT-012': 'rural_hometown',
  'PX-EXT-013': 'park_night_sky', 'PX-EXT-014': 'park_night_sky', 'PX-EXT-015': 'park_night_sky',
  'PX-EXT-016': 'park_night_sky', 'PX-EXT-030': 'park_night_sky',
  'PX-EXT-020': 'transit_interior', 'PX-EXT-034': 'transit_interior',
  'PX-EXT-017': 'festival_culture', 'PX-EXT-018': 'festival_culture', 'PX-EXT-035': 'festival_culture',
  'PX-EXT-019': 'bookstore_study', 'PX-EXT-036': 'bookstore_study', 'PX-EXT-037': 'bookstore_study',
  'PX-EXT-021': 'character_expression', 'PX-EXT-022': 'character_expression',
  'PX-EXT-023': 'character_expression', 'PX-EXT-024': 'character_expression',
  'PX-EXT-025': 'character_expression', 'PX-EXT-028': 'character_expression', 'PX-EXT-029': 'character_expression',
  'PX-EXT-031': 'support_ui_transition', 'PX-EXT-032': 'support_ui_transition',
  'PX-EXT-033': 'support_ui_transition', 'PX-EXT-026': 'support_ui_transition',
  'PX-EXT-027': 'support_ui_transition', 'PX-EXT-038': 'support_ui_transition',
  'PX-EXT-039': 'support_ui_transition'
};

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  function readField() {
    if (i >= len) return '';
    if (text[i] === '"') {
      i += 1;
      let val = '';
      while (i < len) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') { val += '"'; i += 2; }
          else { i += 1; break; }
        } else { val += text[i]; i += 1; }
      }
      if (text[i] === ',') i += 1;
      return val;
    }
    let val = '';
    while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
      val += text[i]; i += 1;
    }
    if (text[i] === ',') i += 1;
    return val;
  }

  const header = [];
  while (i < len && text[i] !== '\n') header.push(readField());
  if (text[i] === '\n') i += 1;

  while (i < len) {
    while (i < len && (text[i] === '\n' || text[i] === '\r')) i += 1;
    if (i >= len) break;
    const row = {};
    for (const key of header) row[key] = readField();
    if (row.asset_id) rows.push(row);
  }
  return rows;
}

function classifyLicense(assetId, notes) {
  const n = notes || '';
  const manaSeedIds = new Set([
    'PX-EXT-001', 'PX-EXT-002', 'PX-EXT-003', 'PX-EXT-004', 'PX-EXT-005', 'PX-EXT-006',
    'PX-EXT-021', 'PX-EXT-022', 'PX-EXT-038'
  ]);
  if (assetId === 'PX-EXT-012') return 'cc0_ready';
  if (/CC0/i.test(n) && !/需核实/.test(n)) return 'cc0_ready';
  if (manaSeedIds.has(assetId) || /Mana Seed User License|Seliel.*免费.*商用|Mana Seed 系列/i.test(n)) {
    if (/\$\d|付费 \$|^\s*付费/.test(n) && !/免费/.test(n)) return 'paid_commercial';
    if (/免费.*商用|免费可/i.test(n)) return 'mana_seed_license';
    return 'paid_commercial';
  }
  if (/\$\d|付费/.test(n) && !/需核实授权/.test(n)) return 'paid_commercial';
  if (/需核实|需人工选定|入库前须核实/.test(n)) return 'review_required';
  if (/CC-BY|署名/.test(n)) return 'attribution_required';
  return 'review_required';
}

function uiReady(tier, assetId) {
  if (tier === 'cc0_ready' || tier === 'mana_seed_license') return 'prototype_ready';
  if (tier === 'paid_commercial') return 'ready_after_purchase';
  return 'candidate_only';
}

function seasonKit(assetId) {
  const map = {
    'PX-EXT-002': 'autumn', 'PX-EXT-003': 'winter', 'PX-EXT-004': 'summer',
    'PX-EXT-005': 'spring', 'PX-EXT-006': 'winter_extreme', 'PX-EXT-001': 'all_seasons',
    'PX-EXT-009': 'winter', 'PX-EXT-017': 'spring', 'PX-EXT-035': 'spring'
  };
  return map[assetId] || '';
}

function pairsWith(assetId) {
  const map = {
    'PX-EXT-001': 'PX-EXT-002,PX-EXT-003,PX-EXT-004,PX-EXT-005,PX-EXT-021',
    'PX-EXT-010': 'PX-EXT-012,PX-UNI-007',
    'PX-EXT-012': 'PX-EXT-010,PX-EXT-022,PX-UNI-007',
    'PX-EXT-014': 'PX-EXT-029,PX-EXT-030',
    'PX-EXT-015': 'PX-EXT-029',
    'PX-EXT-018': 'PX-EXT-017,PX-UNI-002',
    'PX-EXT-020': 'PX-UNI-014,PX-EXT-034',
    'PX-EXT-021': 'PX-EXT-001~006,PX-EXT-038',
    'PX-EXT-033': 'all_year_transitions'
  };
  return map[assetId] || '';
}

function layoutRole(type, assetId) {
  if (assetId === 'PX-EXT-033') return 'transition';
  if (type === 'character') return 'protagonist_or_npc';
  return type;
}

function enrichRow(row) {
  const cat = ASSET_CATEGORY[row.asset_id] || 'support_ui_transition';
  const license = classifyLicense(row.asset_id, row.notes);
  const agent = EXTENDED_AGENT_FIELDS[row.asset_id] || {};
  return {
    ...row,
    ...agent,
    category_id: cat,
    category_label: CATEGORIES[cat].label,
    license_tier: license,
    ui_ready: uiReady(license, row.asset_id),
    layout_role: layoutRole(row.type, row.asset_id),
    season_kit: seasonKit(row.asset_id),
    pairs_with: pairsWith(row.asset_id),
    pack_id: 'extended-scenes-v1',
    supabase_table: 'visual_assets'
  };
}

function toCsv(rows, headers) {
  const esc = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n') + '\n';
}

const ENRICH_HEADERS = [
  'category_id', 'category_label', 'asset_id', 'name', 'source_url', 'type', 'size', 'frames',
  'style_tags', 'mood_tags', 'story_tags', 'scene_use', 'usage_case', 'notes',
  'license_tier', 'ui_ready', 'layout_role', 'season_kit', 'pairs_with', 'pack_id', 'supabase_table',
  ...AGENT_EXTRA_HEADERS
];

const src = fs.readFileSync(SRC, 'utf8');
const rows = parseCsv(src).map(enrichRow);

fs.mkdirSync(OUT_DIR, { recursive: true });

// Master enriched CSV (Excel 主表)
const masterPath = path.join(PACK, 'extended-scenes-v1-enriched.csv');
fs.writeFileSync(masterPath, toCsv(rows, ENRICH_HEADERS));

// Per-category sheets
for (const cat of Object.values(CATEGORIES)) {
  const subset = rows.filter(r => r.category_id === cat.id);
  if (!subset.length) continue;
  fs.writeFileSync(path.join(OUT_DIR, `${cat.label}.csv`), toCsv(subset, ENRICH_HEADERS));
}

// Manifest
const manifest = {
  pack_id: 'extended-scenes-v1',
  status: 'draft_candidate',
  source_csv: 'packs/extended-scenes-v1.csv',
  enriched_csv: 'packs/extended-scenes-v1-enriched.csv',
  sheets_dir: 'packs/extended-scenes-v1-sheets/',
  parent_pack: 'universal-life-scenes-v1',
  asset_count: rows.length,
  categories: Object.values(CATEGORIES).map(c => ({
    ...c,
    count: rows.filter(r => r.category_id === c.id).length
  })),
  license_summary: {
    cc0_ready: rows.filter(r => r.license_tier === 'cc0_ready').length,
    mana_seed_license: rows.filter(r => r.license_tier === 'mana_seed_license').length,
    paid_commercial: rows.filter(r => r.license_tier === 'paid_commercial').length,
    review_required: rows.filter(r => r.license_tier === 'review_required').length,
    attribution_required: rows.filter(r => r.license_tier === 'attribution_required').length
  },
  ui_rules: {
    season_suite: ['PX-EXT-001', 'PX-EXT-002', 'PX-EXT-003', 'PX-EXT-004', 'PX-EXT-005'],
    protagonist: 'PX-EXT-021',
    rural_contrast: { rural: ['PX-EXT-010', 'PX-EXT-012'], urban: 'PX-UNI-007' },
    introspection_overlay: ['PX-EXT-014', 'PX-EXT-015', 'PX-EXT-029'],
    festival_cc0: ['PX-EXT-017', 'PX-EXT-018'],
    year_transition_fx: 'PX-EXT-033',
    transit_interior: 'PX-EXT-020'
  },
  assets: Object.fromEntries(rows.map(r => [r.asset_id, {
    license: r.license_tier,
    ui_ready: r.ui_ready,
    category_id: r.category_id,
    layout_role: r.layout_role,
    season_kit: r.season_kit || undefined,
    pairs_with: r.pairs_with || undefined
  }]))
};

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
fs.mkdirSync(path.dirname(DOCS_MANIFEST), { recursive: true });
fs.writeFileSync(DOCS_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

// Agent layout map (for layout generator agent)
const layoutMap = {
  pack_id: 'extended-scenes-v1',
  agent: 'visual-layout-generator',
  input_from: 'year-narrative-agent',
  output_schema: 'shadow-corpus/visual/03-layout-schema.json',
  selection_rules: [
    'Filter assets by story_tags overlap with year scenario + mood',
    'Prefer ui_ready=prototype_ready; never use candidate_only in production UI',
    'Season transitions: use PX-EXT-001~005 + PX-EXT-021 as unified Mana Seed kit',
    'Year-to-year: always attach PX-EXT-033 transition fx between chapters',
    'Introspection/insomnia: stack PX-EXT-014|015 + PX-EXT-029 over existing interior',
    'Festival scenes: PX-EXT-017|018 without human review gate',
    'Rural hometown: PX-EXT-010~012 vs PX-UNI-007 urban contrast'
  ],
  categories: manifest.categories,
  assets_by_category: Object.fromEntries(
    Object.keys(CATEGORIES).map(k => [k, rows.filter(r => r.category_id === k).map(r => r.asset_id)])
  )
};
fs.writeFileSync(path.join(PACK, 'extended-layout-agent-map.json'), JSON.stringify(layoutMap, null, 2) + '\n');
fs.writeFileSync(DOCS_MAP, JSON.stringify(layoutMap, null, 2) + '\n');

// shadow-visual-master-enriched.csv (universal 96 + extended 39)
const UNI_CSV = path.join(PACK, 'universal-life-scenes-v1.csv');
const uniRows = parseCsv(fs.readFileSync(UNI_CSV, 'utf8')).map(r => ({
  category_id: 'universal',
  category_label: '00_六域通用',
  ...r,
  license_tier: /CC0/i.test(r.notes || '') ? 'cc0_ready' : 'review_required',
  ui_ready: /CC0/i.test(r.notes || '') ? 'prototype_ready' : 'candidate_only',
  layout_role: r.type,
  season_kit: '',
  pairs_with: '',
  pack_id: 'universal-life-scenes-v1',
  supabase_table: 'visual_assets',
  visual_anchor_template: `{character}在{location}，${(r.usage_case || '').slice(0, 40)}`,
  default_layer_stack: `${r.asset_id}>character`,
  parallax_suggest: '0.12',
  animation_keys: 'idle',
  domain_fit: (r.story_tags || '').split(/[,，]/).slice(0, 3).join(','),
  year_phase_fit: r.scene_use === 'special' ? 'pivotal,special' : 'quiet,daily',
  combo_id: 'universal_v1',
  reject_if_mood: ''
}));
const MASTER_HEADERS = ENRICH_HEADERS;
const masterAll = [...uniRows, ...rows];
fs.writeFileSync(path.join(PACK, 'shadow-visual-master-enriched.csv'), toCsv(masterAll, MASTER_HEADERS));

console.log(`extended-scenes-v1: ${rows.length} assets`);
console.log(`  master: ${masterPath}`);
console.log(`  master-all: ${path.join(PACK, 'shadow-visual-master-enriched.csv')} (${masterAll.length} rows)`);
console.log(`  sheets: ${OUT_DIR}/ (${manifest.categories.filter(c => c.count).length} files)`);
console.log(`  manifest: ${MANIFEST}`);
