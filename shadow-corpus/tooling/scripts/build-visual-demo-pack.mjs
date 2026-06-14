#!/usr/bin/env node
/**
 * Bundle fuxduxian-v1 draft layouts + manifest into docs/ for static preview.
 * Does NOT touch registry/assets.csv or scenes/fuxduxian/year-*.layout.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const DRAFT_DIR = path.join(ROOT, 'shadow-corpus/visual/scenes/fuxduxian/draft');
const MANIFEST_SRC = path.join(
  ROOT,
  'shadow-corpus/visual/registry/packs/fuxduxian-v1-manifest.json'
);
const DOCS = path.join(ROOT, 'docs');
const ASSETS_OUT = path.join(DOCS, 'visual-assets');

const RAW_COPIES = [
  {
    from: 'shadow-corpus/visual/assets/raw/opengameart-cool-school/coolschool_tileset.png',
    to: 'coolschool_tileset.png'
  },
  {
    from: 'shadow-corpus/visual/assets/raw/opengameart-rain/rain_overlay_0.png',
    to: 'rain_overlay_0.png'
  }
];

function readYearLayouts() {
  const years = {};
  for (let y = 1; y <= 7; y += 1) {
    const file = path.join(DRAFT_DIR, `year-${y}.layout.json`);
    years[String(y)] = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return years;
}

function copyAssets() {
  fs.mkdirSync(ASSETS_OUT, { recursive: true });
  for (const { from, to } of RAW_COPIES) {
    const src = path.join(ROOT, from);
    const dest = path.join(ASSETS_OUT, to);
    if (!fs.existsSync(src)) {
      console.warn(`skip missing raw: ${from}`);
      continue;
    }
    fs.copyFileSync(src, dest);
    console.log(`copied ${to}`);
  }
}

function main() {
  const years = readYearLayouts();
  const bundle = {
    story_id: 'fuxduxian',
    pack: 'fuxduxian-v1',
    pack_status: 'draft_review',
    years
  };

  fs.writeFileSync(
    path.join(DOCS, 'demo-layouts-v1.json'),
    `${JSON.stringify(bundle, null, 2)}\n`
  );
  console.log('wrote docs/demo-layouts-v1.json');

  fs.copyFileSync(MANIFEST_SRC, path.join(DOCS, 'fuxduxian-v1-manifest.json'));
  console.log('wrote docs/fuxduxian-v1-manifest.json');

  copyAssets();
}

main();
