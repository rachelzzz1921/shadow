/**
 * Load visual asset registry from enriched CSV (offline-first).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const MASTER_CSV = path.join(ROOT, 'shadow-corpus/visual/registry/packs/shadow-visual-master-enriched.csv');
const EXT_CSV = path.join(ROOT, 'shadow-corpus/visual/registry/packs/extended-scenes-v1-enriched.csv');

const SCENARIO_TAGS = {
  family: ['亲情', '家庭', '父母', '老家'],
  love: ['爱情', '异地', '分手', '复合', '约会'],
  friendship: ['友情', '朋友', '圈子'],
  academic: ['学业', '复读', '考研', '课堂', '食堂', '校园'],
  career: ['事业', '通勤', '就业', '职场'],
  self_growth: ['自我成长', '迷茫', '内省', '失眠', '深夜']
};

const ENV_UNIVERSAL_BG = {
  classroom: 'PX-UNI-037',
  canteen: 'PX-UNI-041',
  dorm_night: 'PX-UNI-004',
  stage: 'PX-UNI-047',
  postoffice: 'PX-UNI-008',
  train_station: 'PX-UNI-014',
  home: 'PX-UNI-002',
  city: 'PX-UNI-013',
  office: 'PX-UNI-054'
};

const SEASON_BG = {
  spring: 'PX-EXT-005',
  summer: 'PX-EXT-004',
  autumn: 'PX-EXT-002',
  winter: 'PX-EXT-003',
  winter_extreme: 'PX-EXT-006'
};

const SEASON_FX = 'PX-EXT-001';
const PROTAGONIST = 'PX-EXT-021';
const TRANSITION_FX = 'PX-EXT-033';
const RAIN_FX = 'PX-UNI-023';

export function parseCsv(text) {
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

/** @param {string} [csvPath] */
export function loadRegistry(csvPath = MASTER_CSV) {
  const text = fs.readFileSync(csvPath, 'utf8');
  const assets = parseCsv(text);
  const byId = Object.fromEntries(assets.map(a => [a.asset_id, a]));
  return { assets, byId, path: csvPath };
}

export function isUsable(asset) {
  if (!asset) return false;
  return asset.ui_ready === 'prototype_ready' || asset.ui_ready === 'ready_after_purchase' || asset.ui_ready === 'approved';
}

function tagOverlap(asset, tags) {
  const st = (asset.story_tags || '').split(/[,，]/).map(t => t.trim());
  let score = 0;
  for (const t of tags) {
    if (st.some(s => s.includes(t) || t.includes(s))) score += 2;
  }
  return score;
}

function moodBlocked(asset, moodVisual) {
  const reject = (asset.reject_if_mood || '').split(/[,，]/).filter(Boolean);
  const mood = moodVisual || '';
  return reject.some(r => mood.includes(r));
}

/**
 * @param {object} yearInput narrative year payload
 * @param {{ assets: object[], byId: object }} registry
 */
export function selectAssets(yearInput, registry) {
  const { byId } = registry;
  const selected = [];
  const add = (id, reason) => {
    const a = byId[id];
    if (!a || !isUsable(a)) return;
    if (moodBlocked(a, yearInput.mood_visual)) return;
    if (!selected.find(s => s.asset_id === id)) {
      selected.push({ asset_id: id, asset: a, reason });
    }
  };

  const scenario = yearInput.scenario || 'academic';
  const tags = [...(SCENARIO_TAGS[scenario] || []), ...(yearInput.scenario_secondary || [])];
  const env = yearInput.environment || '';
  const mood = yearInput.mood_visual || '';
  const event = yearInput.event_summary || '';
  const season = yearInput.season_hint || inferSeason(yearInput.year, event);

  // Year transition FX (year > 1)
  if (yearInput.year > 1) add(TRANSITION_FX, 'year_transition');

  // Festival
  if (/春节|中秋|节庆|过年/.test(event + mood)) {
    add('PX-EXT-018', 'festival_lantern');
    add('PX-EXT-017', 'festival_flower');
  }

  // Rural hometown
  if (/老家|农村|回乡|田野|村镇/.test(event + tags.join(''))) {
    add('PX-EXT-012', 'rural_terrain');
    add('PX-EXT-010', 'rural_village');
    add('PX-EXT-022', 'rural_npc');
    add('PX-UNI-007', 'urban_contrast');
  }

  // Metro / commute
  if (/地铁|高铁|车厢|通勤|站台/.test(event + env)) {
    add('PX-EXT-020', 'transit_interior');
    add('PX-EXT-034', 'transit_prop');
    add('PX-UNI-014', 'station_exterior');
  }

  // Introspection / insomnia — CC0 production path
  if (/失眠|内省|迷茫|深夜|独处|4点|凌晨/.test(event + mood + (yearInput.inner_voice || ''))) {
    add('PX-EXT-030', 'night_sky_cc0');
    add('PX-EXT-029', 'fog_overlay');
    const interior = ENV_UNIVERSAL_BG[env] || ENV_UNIVERSAL_BG.home;
    add(interior, 'interior_base_introspection');
  }

  // Season + Mana Seed kit
  if (season && SEASON_BG[season]) {
    add(SEASON_BG[season], `season_${season}`);
    add(SEASON_FX, 'season_weather_fx');
    add(PROTAGONIST, 'mana_seed_protagonist');
  } else if (!selected.find(s => s.asset_id.startsWith('PX-EXT-01') || s.asset_id.startsWith('PX-UNI-'))) {
    // Environment fallback from universal
    const bg = ENV_UNIVERSAL_BG[env] || pickUniversalBg(scenario, byId, tags);
    add(bg, 'environment_fallback');
    add(PROTAGONIST, 'protagonist_default');
  }

  // Rain mood
  if (/雨|rain/.test(mood + event + (yearInput.scene || ''))) {
    add(RAIN_FX, 'rain_fx');
  }

  // Pivotal emphasis — skip candidate PX-EXT-028, use weather/lightning via PX-EXT-001
  if (yearInput.is_pivotal) {
    add(SEASON_FX, 'pivotal_fx');
  }

  // Protagonist: intake-matched shadow character > Mana Seed default
  const protagonistId = yearInput.visual_character?.asset_id
    || yearInput.protagonist_asset_id;
  if (protagonistId && protagonistId.startsWith('PX-SHC-')) {
    add(protagonistId, 'intake_protagonist');
  } else {
    add(PROTAGONIST, 'protagonist_default');
  }

  // Score-sort extended candidates for extras
  const extras = registry.assets
    .filter(a => a.pack_id === 'extended-scenes-v1' && isUsable(a))
    .map(a => ({ asset: a, score: tagOverlap(a, tags) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  for (const { asset } of extras) {
    add(asset.asset_id, 'tag_match');
  }

  return { selected, season, scenario, tags };
}

function inferSeason(year, event) {
  if (/春|樱花|萌芽/.test(event)) return 'spring';
  if (/夏|暑|暑期/.test(event)) return 'summer';
  if (/秋|落叶|凋零/.test(event)) return 'autumn';
  if (/冬|雪|年末|极寒/.test(event)) return 'winter';
  const cycle = ['spring', 'summer', 'autumn', 'winter'];
  return cycle[(year - 1) % 4];
}

function pickUniversalBg(scenario, byId, tags) {
  for (const id of Object.values(ENV_UNIVERSAL_BG)) {
    if (isUsable(byId[id])) return id;
  }
  const hit = Object.values(byId).find(a =>
    a.pack_id === 'universal-life-scenes-v1' &&
    isUsable(a) &&
    a.type === 'background' &&
    tagOverlap(a, tags) > 0
  );
  return hit?.asset_id || 'PX-UNI-037';
}

export { SCENARIO_TAGS, ENV_UNIVERSAL_BG, SEASON_BG, PROTAGONIST, TRANSITION_FX };
