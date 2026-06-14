/**
 * Shadow Visual Layout Agent — main entry
 * Input: year narrative JSON → Output: layout JSON (+ optional Supabase persist)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLayout } from '../engine/src/validate-layout.mjs';
import { loadRegistry, selectAssets } from './asset-selector.mjs';
import { composeLayout, stripMeta } from './layout-composer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

function loadWorldEnv() {
  try {
    const envPath = path.join(ROOT, 'shadow-corpus/world/.env');
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch { /* optional */ }
}

/**
 * @param {object} yearInput
 * @param {{ registry?: ReturnType<loadRegistry>, persist?: boolean, sessionId?: string }} [opts]
 */
export async function generateLayout(yearInput, opts = {}) {
  const registry = opts.registry || loadRegistry();
  const selection = selectAssets(yearInput, registry);
  const layout = composeLayout(yearInput, selection);

  const errors = validateLayout(stripMeta(layout));
  if (errors.length) {
    throw new Error(`Layout validation failed: ${errors.join('; ')}`);
  }

  let persisted = null;
  if (opts.persist) {
    persisted = await saveLayout(yearInput, layout, opts.sessionId);
  }

  return { layout, selection, persisted, errors: [] };
}

async function saveLayout(yearInput, layout, sessionId) {
  loadWorldEnv();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false, reason: 'missing_supabase_credentials' };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const clean = stripMeta(layout);
  const row = {
    story_id: clean.story_id,
    year: clean.year,
    session_id: sessionId || yearInput.session_id || 'local',
    narrative_input: yearInput,
    layout: clean,
    visual_anchor: clean.visual_anchor,
    asset_ids: layout._meta?.asset_ids || [],
    transition_fx_id: clean.transition_fx_id || null,
    status: 'draft',
    version: process.env.VISUAL_CORPUS_VERSION || '2026.06.14-ext-v1',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('visual_layouts')
    .upsert(row, { onConflict: 'story_id,year,session_id' })
    .select()
    .single();

  if (error) return { ok: false, reason: error.message };
  return { ok: true, id: data?.id };
}

/** CLI: node layout-generator.mjs [fixture.json] */
async function main() {
  const fixturePath = process.argv[2] || path.join(__dirname, 'fixtures/year-3-academic.json');
  const persist = process.argv.includes('--persist');
  const outPath = process.argv.find(a => a.startsWith('--out='))?.slice(6);

  const yearInput = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const result = await generateLayout(yearInput, { persist });

  const output = stripMeta(result.layout);
  const json = JSON.stringify(output, null, 2);

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json + '\n');
    console.log(`Wrote ${outPath}`);
  } else {
    console.log(json);
  }

  if (result.persisted) {
    console.error('Supabase:', JSON.stringify(result.persisted));
  }

  console.error(`OK year ${output.year} · assets: ${result.layout._meta?.asset_ids?.join(', ')}`);
}

if (process.argv[1] && process.argv[1].endsWith('layout-generator.mjs')) {
  main().catch(e => {
    console.error(e.message || e);
    process.exit(1);
  });
}

export { saveLayout };
