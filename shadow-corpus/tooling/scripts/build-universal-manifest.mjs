#!/usr/bin/env node
/**
 * Classify universal-life-scenes-v1.csv → manifest JSON (draft, not assets.csv)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const CSV = path.join(ROOT, 'shadow-corpus/visual/registry/packs/universal-life-scenes-v1.csv');
const OUT = path.join(ROOT, 'shadow-corpus/visual/registry/packs/universal-life-scenes-v1-manifest.json');

/** asset_id → shared local preview (same raw as fuxduxian CC0) */
const CC0_READY = {
  'PX-UNI-023': { demo_path: 'visual-assets/rain_overlay_0.png', local_raw: 'visual/assets/raw/opengameart-rain/rain_overlay_0.png' },
  'PX-UNI-037': { demo_path: 'visual-assets/coolschool_tileset.png', local_raw: 'visual/assets/raw/opengameart-cool-school/coolschool_tileset.png' },
  'PX-UNI-044': { demo_path: 'visual-assets/coolschool_tileset.png', local_raw: 'visual/assets/raw/opengameart-cool-school/coolschool_tileset.png' },
  'PX-UNI-045': { demo_path: 'visual-assets/coolschool_tileset.png', local_raw: 'visual/assets/raw/opengameart-cool-school/coolschool_tileset.png' },
  'PX-UNI-060': { demo_path: 'visual-assets/coolschool_tileset.png', local_raw: 'visual/assets/raw/opengameart-cool-school/coolschool_tileset.png' },
  'PX-UNI-065': { demo_path: 'visual-assets/rain_overlay_0.png', local_raw: 'visual/assets/raw/opengameart-rain/rain_overlay_0.png' },
  'PX-UNI-084': { demo_path: 'visual-assets/coolschool_tileset.png', local_raw: 'visual/assets/raw/opengameart-cool-school/coolschool_tileset.png' },
  'PX-UNI-085': { demo_path: 'visual-assets/rain_overlay_0.png', local_raw: 'visual/assets/raw/opengameart-rain/rain_overlay_0.png' }
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
          if (text[i + 1] === '"') {
            val += '"';
            i += 2;
          } else {
            i += 1;
            break;
          }
        } else {
          val += text[i];
          i += 1;
        }
      }
      if (text[i] === ',') i += 1;
      return val;
    }
    let val = '';
    while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
      val += text[i];
      i += 1;
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

function classifyLicense(assetId, notes, styleTags) {
  const n = notes || '';
  const tags = styleTags || '';
  const combined = `${n} ${tags}`;
  if (/非商业|non.?commercial/i.test(n) && !/premium|商用需 premium/i.test(n)) {
    return 'license_pending';
  }
  if (/付费\s*\$|需付费|完整商用需付费|商用项目需付费/i.test(n)) {
    return 'license_pending';
  }
  if (/CC0/.test(combined)) {
    return CC0_READY[assetId] ? 'cc0_ready' : 'cc0_pending';
  }
  if (/royalty-free|免费商用|可商用可改|商用可用/i.test(n)) {
    return 'review_required';
  }
  if (/需署名|需复核|作者评论|上线前|确认.*授权|许可.*复核/i.test(n)) {
    return 'review_required';
  }
  if (/禁再分发|禁原样再分发/i.test(n)) {
    return 'review_required';
  }
  return 'license_pending';
}

function main() {
  const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
  const assets = {};

  for (const row of rows) {
    const id = row.asset_id;
    const license = classifyLicense(id, row.notes, row.style_tags);
    const entry = {
      license,
      type: row.type,
      story_tags: row.story_tags,
      source_url: row.source_url
    };
    if (CC0_READY[id]) {
      entry.local_raw = CC0_READY[id].local_raw;
      entry.demo_path = CC0_READY[id].demo_path;
    }
    assets[id] = entry;
  }

  const manifest = {
    pack_id: 'universal-life-scenes-v1',
    status: 'draft_candidate',
    source_csv: 'packs/universal-life-scenes-v1.csv',
    notes: '六域 Agent 通用底座；未合并 registry/assets.csv。付费/署名/禁再分发/需复核 → 仅占位候选。',
    license_tiers: {
      cc0_ready: '已下载 CC0，demo 可预览纹理',
      cc0_pending: 'CSV 标 CC0，待下载 raw/',
      review_required: '可商用但需人工复核许可截图',
      license_pending: '付费、非商业免费或授权不明 — 仅候选态'
    },
    assets
  };

  fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);
  const counts = {};
  for (const a of Object.values(assets)) counts[a.license] = (counts[a.license] || 0) + 1;
  console.log(`wrote ${OUT}`);
  console.log('license counts:', counts);
}

main();
