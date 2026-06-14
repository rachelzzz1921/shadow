'use strict';

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data/years');

function loadEnv() {
  try {
    const envPath = join(__dirname, '../.env');
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* optional .env */
  }
}

async function main() {
  loadEnv();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in world/.env');
    console.error('Copy .env.example and fill credentials, then re-run npm run seed');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const version = process.env.WORLD_CORPUS_VERSION || '2026.06.14-v1';
  const files = readdirSync(DATA_DIR).filter((f) => /^\d{4}\.json$/.test(f));

  for (const file of files) {
    const pack = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
    const year = pack.calendar_year;

    const { error: delMicro } = await supabase
      .from('world_micro_events')
      .delete()
      .eq('calendar_year', year);
    if (delMicro) throw delMicro;

    const { error: delMacro } = await supabase
      .from('world_macro_events')
      .delete()
      .eq('calendar_year', year);
    if (delMacro) throw delMacro;

    const { error: yearErr } = await supabase.from('world_years').upsert({
      calendar_year: year,
      summary: pack.summary,
      social_mood: pack.social_mood,
      atmosphere: pack.atmosphere,
      pop_culture: pack.pop_culture,
      sources: pack.sources,
      version,
      updated_at: new Date().toISOString()
    });
    if (yearErr) throw yearErr;

    const macroRows = pack.macro_events.map((m) => ({
      calendar_year: year,
      category: m.category,
      title: m.title,
      detail: m.detail,
      source_url: m.source_url,
      weight: m.weight,
      sensitivity: m.sensitivity,
      tags: m.tags
    }));
    const { error: macroErr } = await supabase.from('world_macro_events').insert(macroRows);
    if (macroErr) throw macroErr;

    const microRows = pack.micro_events.map((m) => ({
      calendar_year: year,
      category: m.category,
      text: m.text,
      weight: m.weight,
      can_pivot: m.can_pivot,
      sensitivity: m.sensitivity,
      tags: m.tags,
      scenario: m.scenario || null
    }));
    const { error: microErr } = await supabase.from('world_micro_events').insert(microRows);
    if (microErr) throw microErr;

    console.log(`Seeded ${year}: macro=${macroRows.length} micro=${microRows.length}`);
  }

  console.log(`Done. version=${version}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
