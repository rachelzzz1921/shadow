#!/usr/bin/env node
/**
 * Smoke test: generate layouts for fuxduxian years 1-7, validate, ensure no candidate assets.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLayout } from '../../visual/agent/layout-generator.mjs';
import { loadRegistry } from '../../visual/agent/asset-selector.mjs';
import { validateLayout } from '../../visual/engine/src/validate-layout.mjs';
import { stripMeta } from '../../visual/agent/layout-composer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.join(ROOT, 'shadow-corpus/visual/agent/fixtures/generated');

const YEARS = [
  { year: 1, scenario: 'academic', environment: 'classroom', season_hint: 'spring', is_pivotal: true, mood_visual: '灰冷·退缩', event_summary: '雨天最后一排复读', memory_id: 'm1', character_name: '阿岚' },
  { year: 2, scenario: 'academic', environment: 'dorm_night', season_hint: 'summer', is_pivotal: false, mood_visual: '低饱和·麻木', event_summary: '查分夜撕准考证', memory_id: 'm2', character_name: '阿岚' },
  { year: 3, scenario: 'academic', environment: 'canteen', season_hint: 'autumn', is_pivotal: false, mood_visual: '灰冷·孤独', event_summary: '一个人吃饭', memory_id: 'm3', character_name: '阿岚' },
  { year: 4, scenario: 'academic', environment: 'stage', season_hint: 'winter', is_pivotal: true, mood_visual: '略暖·暴露', event_summary: '推上主席', memory_id: 'm4', character_name: '阿岚' },
  { year: 5, scenario: 'academic', environment: 'dorm_night', season_hint: 'winter', is_pivotal: false, mood_visual: '凌晨4点·失眠', event_summary: '连续三个月失眠', memory_id: 'm5', character_name: '阿岚' },
  { year: 6, scenario: 'academic', environment: 'train_station', season_hint: 'spring', is_pivotal: true, mood_visual: '雨·崩而不煽', event_summary: '复试被刷', memory_id: 'm6', character_name: '阿岚' },
  { year: 7, scenario: 'career', environment: 'postoffice', season_hint: 'summer', is_pivotal: false, mood_visual: '留白·够了', event_summary: '邮局窗口字真好看', memory_id: 'm7', character_name: '阿岚' }
];

const CANDIDATE_ONLY = new Set(
  loadRegistry().assets
    .filter(a => a.ui_ready === 'candidate_only')
    .map(a => a.asset_id)
);

fs.mkdirSync(OUT, { recursive: true });
let failed = 0;

for (const y of YEARS) {
  const input = { story_id: 'fuxduxian', session_id: 'smoke-7y', ...y };
  try {
    const { layout } = await generateLayout(input);
    const clean = stripMeta(layout);
    const errs = validateLayout(clean);
    const badAssets = (layout._meta?.asset_ids || []).filter(id => CANDIDATE_ONLY.has(id));

    if (errs.length || badAssets.length) {
      failed += 1;
      console.error(`FAIL year ${y.year}:`, errs.join('; ') || `candidate assets: ${badAssets.join(', ')}`);
      continue;
    }

    if (y.year > 1 && clean.transition_fx_id !== 'PX-EXT-033') {
      failed += 1;
      console.error(`FAIL year ${y.year}: missing PX-EXT-033 transition`);
      continue;
    }

    const outFile = path.join(OUT, `fuxduxian-year-${y.year}.layout.json`);
    fs.writeFileSync(outFile, JSON.stringify(clean, null, 2) + '\n');
    console.log(`OK year ${y.year} · ${clean.visual_anchor.slice(0, 36)}… · ${layout._meta.asset_ids.length} assets`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL year ${y.year}:`, e.message);
  }
}

process.exit(failed ? 1 : 0);
