'use strict';

/**
 * Seed visual_assets from extended-scenes-v1-enriched.csv (+ optional universal merge)
 * Usage: npm run seed:visual  OR  npm run seed:visual -- --all
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const EXT_CSV = join(ROOT, 'shadow-corpus/visual/registry/packs/extended-scenes-v1-enriched.csv');
const MASTER_CSV = join(ROOT, 'shadow-corpus/visual/registry/packs/shadow-visual-master-enriched.csv');

function loadEnv() {
  try {
    const text = readFileSync(join(__dirname, '../.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch { /* optional */ }
}

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

function splitTags(s) {
  if (!s) return [];
  return s.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}

function toRow(r) {
  return {
    asset_id: r.asset_id,
    pack_id: r.pack_id || 'extended-scenes-v1',
    category_id: r.category_id || 'extended',
    category_label: r.category_label,
    name: r.name,
    source_url: r.source_url,
    asset_type: r.type,
    size: r.size,
    frames: r.frames,
    style_tags: splitTags(r.style_tags),
    mood_tags: splitTags(r.mood_tags),
    story_tags: splitTags(r.story_tags),
    scene_use: r.scene_use || 'both',
    usage_case: r.usage_case,
    notes: r.notes,
    license_tier: r.license_tier,
    ui_ready: r.ui_ready,
    layout_role: r.layout_role,
    season_kit: r.season_kit || null,
    pairs_with: splitTags((r.pairs_with || '').replace(/~/g, ',').replace(/PX-EXT-001~006/, 'PX-EXT-001,PX-EXT-006')),
    visual_anchor_template: r.visual_anchor_template || null,
    default_layer_stack: r.default_layer_stack || null,
    parallax_suggest: r.parallax_suggest || null,
    animation_keys: r.animation_keys || null,
    domain_fit: r.domain_fit || null,
    year_phase_fit: r.year_phase_fit || null,
    combo_id: r.combo_id || null,
    reject_if_mood: r.reject_if_mood || null,
    version: process.env.VISUAL_CORPUS_VERSION || '2026.06.14-ext-v1',
    updated_at: new Date().toISOString()
  };
}

async function main() {
  loadEnv();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in shadow-corpus/world/.env');
    process.exit(1);
  }

  const seedAll = process.argv.includes('--all');
  const csvPath = seedAll ? MASTER_CSV : EXT_CSV;
  const rows = parseCsv(readFileSync(csvPath, 'utf8')).map(toRow);
  const version = process.env.VISUAL_CORPUS_VERSION || '2026.06.14-ext-v1';

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  if (!seedAll) {
    const { error: delErr } = await supabase
      .from('visual_assets')
      .delete()
      .eq('pack_id', 'extended-scenes-v1');
    if (delErr && delErr.code !== '42P01') throw delErr;
  }

  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from('visual_assets').upsert(chunk, { onConflict: 'asset_id' });
    if (error) throw error;
  }

  console.log(`Seeded ${rows.length} visual_assets from ${seedAll ? 'master' : 'extended'} (${version})`);
  console.log(`  → ${url}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
