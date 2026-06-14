'use strict';

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { SCENARIO_DOMAINS, SCENARIO_LABELS } from '../lib/scenario-domains.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data/years');
const SCHEMA = JSON.parse(
  readFileSync(join(__dirname, '../schema/era-year.schema.json'), 'utf8')
);

const MIN_PER_SCENARIO = 30;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(SCHEMA);

function countScenarios(micros) {
  const c = Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, 0]));
  for (const m of micros) {
    if (c[m.scenario] !== undefined) c[m.scenario]++;
  }
  return c;
}

let failed = 0;
const files = readdirSync(DATA_DIR).filter((f) => /^\d{4}\.json$/.test(f)).sort();

for (const file of files) {
  const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
  const ok = validate(data);
  if (!ok) {
    console.error(`FAIL ${file}:`, validate.errors);
    failed++;
    continue;
  }
  const m = data.macro_events.length;
  const mi = data.micro_events.length;
  const a = Object.keys(data.atmosphere).length;
  const p = data.pop_culture.length;
  const s = data.sources.length;
  const sc = countScenarios(data.micro_events);
  const scenarioOk = SCENARIO_DOMAINS.every((d) => sc[d] >= MIN_PER_SCENARIO);
  const minOk = m >= 30 && mi >= 80 && a >= 15 && p >= 10 && s >= 5 && scenarioOk;

  const scBrief = SCENARIO_DOMAINS.map((d) => `${SCENARIO_LABELS[d]}:${sc[d]}`).join(' ');
  console.log(
    `${file}: macro=${m} micro=${mi} [${scBrief}] ${minOk ? 'OK' : 'BELOW_MIN'}`
  );

  if (!scenarioOk) {
    for (const d of SCENARIO_DOMAINS) {
      if (sc[d] < MIN_PER_SCENARIO) {
        console.error(`  ↳ ${SCENARIO_LABELS[d]} only ${sc[d]} (need ${MIN_PER_SCENARIO})`);
      }
    }
  }
  if (!minOk) failed++;
}

if (failed) {
  console.error(`\n${failed} file(s) failed validation`);
  process.exit(1);
}
console.log('\nAll years passed.');
