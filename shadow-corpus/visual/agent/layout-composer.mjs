/**
 * Compose 03-layout-schema.json compliant layout from selected assets + year input.
 */
import { PROTAGONIST, TRANSITION_FX } from './asset-selector.mjs';

const SEASON_LABEL = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
  winter_extreme: '严冬'
};

const ENV_LOCATION = {
  classroom: '教室最后一排',
  canteen: '食堂最里角',
  dorm_night: '宿舍床上',
  stage: '舞台侧幕',
  postoffice: '邮局小窗',
  train_station: '出站雨棚',
  metro: '地铁车厢',
  home: '客厅',
  city: '城市街道',
  office: '办公室'
};

/**
 * @param {object} yearInput
 * @param {{ selected: Array, season: string, scenario: string }} selection
 */
export function composeLayout(yearInput, selection) {
  const { selected, season, scenario } = selection;
  const ids = selected.map(s => s.asset_id);

  const bgEntry = selected.find(s => s.asset?.type === 'background' && s.asset?.layout_role !== 'transition')
    || selected.find(s => s.asset?.type === 'background');
  const bgId = bgEntry?.asset_id || 'PX-UNI-037';
  const bgAsset = bgEntry?.asset;

  const character = selected.find(s => s.asset_id === PROTAGONIST) || { asset_id: PROTAGONIST };
  const fxLayers = selected.filter(s => s.asset?.type === 'fx' && s.asset_id !== TRANSITION_FX);
  const props = selected.filter(s => s.asset?.type === 'prop');

  const location = ENV_LOCATION[yearInput.environment] || yearInput.environment || '场景中央';
  const seasonLabel = SEASON_LABEL[season] || '';
  const characterName = yearInput.character_name || '主角';

  const anchorTemplate = bgAsset?.visual_anchor_template
    || `{season}{character}在{location}`;
  const visual_anchor = fillTemplate(anchorTemplate, {
    season: seasonLabel ? `${seasonLabel}天，` : '',
    character: characterName,
    location,
    year: yearInput.year,
    next_year: yearInput.year + 1,
    domain: scenario,
    emotion: yearInput.mood_visual || '',
    prop: props[0]?.asset?.name || '关键物件'
  }).replace(/，{2,}/g, '，').replace(/^，/, '');

  const parallax = parseFloat(bgAsset?.parallax_suggest || '0.12');

  /** @type {object} */
  const layout = {
    story_id: yearInput.story_id || 'fuxduxian',
    year: yearInput.year,
    pack: 'extended-scenes-v1',
    pack_status: 'draft_agent',
    scene_type: yearInput.is_pivotal ? 'pivotal_sequence' : 'special',
    visual_anchor,
    mood: yearInput.mood_visual || '',
    status: 'draft',
    narrative_ref: {
      memory_id: yearInput.memory_id || `m${yearInput.year}`,
      event_summary: yearInput.event_summary || ''
    },
    background: {
      asset_id: bgId,
      parallax,
      tint: moodTint(yearInput.mood_visual)
    },
    layers: buildLayers(character, props, fxLayers, yearInput),
    transition_fx_id: yearInput.year > 1 ? TRANSITION_FX : undefined
  };

  if (!yearInput.is_pivotal) {
    layout.daily_loops = [{
      id: pickIdleAnim(yearInput),
      asset_id: character.asset_id,
      animation: pickIdleAnim(yearInput),
      trigger: 'year_idle'
    }];
  }

  if (yearInput.is_pivotal) {
    layout.sequence = buildPivotalSequence(yearInput, selected);
  }

  layout._meta = {
    asset_ids: ids,
    selection_reasons: selected.map(s => ({ id: s.asset_id, reason: s.reason }))
  };

  return layout;
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function moodTint(mood) {
  if (!mood) return undefined;
  if (/灰|冷|雨/.test(mood)) return '#7a8494';
  if (/暖|春/.test(mood)) return '#c8a878';
  if (/夜|失眠/.test(mood)) return '#4a5060';
  return undefined;
}

function buildLayers(character, props, fxLayers, yearInput) {
  const layers = [];
  let depth = 1;

  for (const p of props.slice(0, 2)) {
    layers.push({
      asset_id: p.asset_id,
      role: 'prop',
      x: 480 + depth * 20,
      y: 240,
      depth: depth++,
      note: p.asset?.usage_case?.slice(0, 60)
    });
  }

  layers.push({
    asset_id: character.asset_id,
    role: 'protagonist',
    x: 460,
    y: 252,
    depth: depth++,
    animation: pickIdleAnim(yearInput),
    note: yearInput.visual_character?.label_zh || undefined
  });

  for (const fx of fxLayers) {
    layers.push({
      asset_id: fx.asset_id,
      role: 'fx',
      x: 320,
      y: 100,
      depth: 10 + depth,
      alpha: fx.asset_id === 'PX-EXT-029' ? 0.35 : 0.28,
      note: fx.reason
    });
  }

  return layers;
}

function pickIdleAnim(yearInput) {
  const e = yearInput.event_summary || '';
  if (/撕/.test(e)) return 'tear_paper';
  if (/吃|食堂/.test(e)) return 'eat_slow';
  if (/睡|失眠|4点/.test(e)) return 'eyes_open';
  if (/写|字/.test(e)) return 'write_idle';
  if (/书|读/.test(e)) return 'read_idle';
  return 'idle';
}

function buildPivotalSequence(yearInput, selected) {
  const steps = [
    { duration_ms: 800, camera: 'fade_in', note: '介入前' },
    { duration_ms: 1200, camera: 'hold', note: yearInput.event_summary },
    { duration_ms: 600, camera: 'fade_out', note: '介入弹窗' }
  ];
  if (selected.some(s => s.asset_id === TRANSITION_FX)) {
    steps.push({ duration_ms: 400, camera: 'fade_out', note: 'year_transition_wipe', layers_delta: { fx: TRANSITION_FX } });
  }
  return steps;
}

/** Strip internal _meta before persistence */
export function stripMeta(layout) {
  const { _meta, ...rest } = layout;
  return rest;
}
