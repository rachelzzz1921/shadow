#!/usr/bin/env node
'use strict';

/**
 * Find near-duplicate macro titles / micro texts within and across years.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isNearDuplicate, textSimilarity } from '../lib/dedupe.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data/years');

const threshold = Number(process.argv.find((a, i) => process.argv[i - 1] === '--threshold') || 0.85);
const jsonOut = process.argv.includes('--json');
const yearArg = process.argv.find((a, i) => process.argv[i - 1] === '--year');

function loadPacks() {
  return readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8')))
    .filter((p) => !yearArg || p.calendar_year === Number(yearArg));
}

function findIntraYearDupes(pack, kind) {
  const items = kind === 'macro' ? pack.macro_events : pack.micro_events;
  const getText = (i) => (kind === 'macro' ? i.title : i.text);
  const dupes = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const sim = textSimilarity(getText(items[i]), getText(items[j]));
      if (sim >= threshold) {
        dupes.push({
          year: pack.calendar_year,
          kind,
          similarity: Number(sim.toFixed(3)),
          a: getText(items[i]).slice(0, 80),
          b: getText(items[j]).slice(0, 80)
        });
      }
    }
  }
  return dupes;
}

function main() {
  const packs = loadPacks();
  const allDupes = [];

  for (const pack of packs) {
    allDupes.push(...findIntraYearDupes(pack, 'macro'));
    allDupes.push(...findIntraYearDupes(pack, 'micro'));
  }

  const payload = {
    threshold,
    total: allDupes.length,
    by_year: Object.fromEntries(
      packs.map((p) => [
        p.calendar_year,
        allDupes.filter((d) => d.year === p.calendar_year).length
      ])
    ),
    duplicates: allDupes.slice(0, 200)
  };

  if (jsonOut) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`Near-duplicates (threshold=${threshold}): ${allDupes.length}`);
    for (const d of allDupes.slice(0, 30)) {
      console.log(`\n${d.year} ${d.kind} sim=${d.similarity}`);
      console.log(`  A: ${d.a}`);
      console.log(`  B: ${d.b}`);
    }
    if (allDupes.length > 30) console.log(`\n… and ${allDupes.length - 30} more (use --json)`);
  }

  process.exit(allDupes.length ? 1 : 0);
}

main();
