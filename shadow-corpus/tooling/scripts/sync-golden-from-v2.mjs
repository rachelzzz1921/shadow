#!/usr/bin/env node
/**
 * sync-golden-from-v2.mjs — 从 v2-fields.json 侧车 patch golden 视觉字段
 *
 * Usage:
 *   node sync-golden-from-v2.mjs --story fuxduxian [--dry-run|--apply]
 *   node sync-golden-from-v2.mjs --self-test
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS = path.resolve(__dirname, '../..');
const REPO = path.resolve(CORPUS, '..');

const STORY_MAP = {
  fuxduxian: {
    v2Fields: 'visual/stories/fuxduxian/v2-fields.json',
    golden: 'fixtures/golden-stories/复读线.json',
    goldenCopy: '04-dev-testing/golden-stories/复读线.json',
  },
};

const PATCH_KEYS = ['visual_anchor', 'key_props', 'mood_visual', 'daily_micro'];

function parseArgs(argv) {
  const args = { story: 'fuxduxian', dryRun: true, selfTest: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--story') args.story = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--apply') args.dryRun = false;
    else if (a === '--self-test') args.selfTest = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return args;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function patchGolden(golden, v2) {
  const changes = [];
  for (const yearRow of golden.years) {
    const n = String(yearRow.year);
    const patch = v2.years?.[n];
    if (!patch) continue;
    for (const key of PATCH_KEYS) {
      if (patch[key] === undefined) continue;
      const before = yearRow[key];
      const after = patch[key];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes.push({ year: yearRow.year, key, before, after });
        yearRow[key] = after;
      }
    }
  }
  return changes;
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function runSelfTest() {
  const sample = {
    years: [{ year: 1, title: 'x' }, { year: 2, title: 'y' }],
  };
  const v2 = { years: { '1': { visual_anchor: 'test anchor', key_props: ['a'] } } };
  const changes = patchGolden(sample, v2);
  if (changes.length !== 2) throw new Error(`expected 2 changes, got ${changes.length}`);
  if (sample.years[0].visual_anchor !== 'test anchor') throw new Error('patch failed');
  console.log('self-test ok');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.selfTest) {
    runSelfTest();
    return;
  }

  const cfg = STORY_MAP[args.story];
  if (!cfg) throw new Error(`Unknown story: ${args.story}`);

  const v2Path = path.join(CORPUS, cfg.v2Fields);
  const goldenPath = path.join(CORPUS, cfg.golden);
  const v2 = loadJson(v2Path);
  const golden = loadJson(goldenPath);
  const goldenClone = JSON.parse(JSON.stringify(golden));

  const changes = patchGolden(goldenClone, v2);

  if (changes.length === 0) {
    console.log('No changes — golden already matches v2-fields.');
    return;
  }

  console.log(JSON.stringify({ story: args.story, changes: changes.length, diff: changes }, null, 2));

  if (args.dryRun) {
    console.log('\n[dry-run] Pass --apply to write fixtures + 04-dev-testing copy.');
    return;
  }

  if (v2.gate === 'G-N1') {
    console.warn('[warn] v2-fields still marked G-N1 draft — apply only after P2 sign-off.');
  }

  writeJson(goldenPath, goldenClone);
  const copyPath = path.join(CORPUS, cfg.goldenCopy);
  if (fs.existsSync(path.dirname(copyPath))) {
    writeJson(copyPath, goldenClone);
  }

  console.log(`Applied → ${goldenPath}`);
  if (fs.existsSync(copyPath)) console.log(`Applied → ${copyPath}`);
}

main();
