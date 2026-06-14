#!/usr/bin/env node
/**
 * Import pictures-transparent zip → shc-01..20 PNG (alpha) + refresh catalog
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

const DEFAULT_ZIP = path.join(
  process.env.HOME,
  'Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_w2m3prtetwsk22_f3a2/temp/drag/pictures-transparent(1).zip'
);

const zipPath = process.argv[2] || DEFAULT_ZIP;
const OUT_RAW = path.join(ROOT, 'shadow-corpus/visual/assets/raw/shadow-characters-v1-transparent');
const OUT_IMG = path.join(ROOT, 'docs/visual-characters');
const OUT_PUB = path.join(ROOT, 'shadow-corpus/archive/demo-v0.2/public/assets/characters');
const CATALOG_PATH = path.join(ROOT, 'docs/data/shadow-characters-v1.json');

if (!fs.existsSync(zipPath)) {
  console.error('Zip not found:', zipPath);
  process.exit(1);
}

fs.mkdirSync(OUT_RAW, { recursive: true });
execSync(`unzip -o -q "${zipPath}" -d "${OUT_RAW}"`, { stdio: 'inherit' });

function listPngs(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name.startsWith('._') || name.startsWith('.')) continue;
    if (fs.statSync(p).isDirectory()) out.push(...listPngs(p));
    else if (name.endsWith('.png')) out.push(p);
  }
  return out.sort((a, b) => path.basename(a).localeCompare(path.basename(b), 'zh'));
}

const pngs = listPngs(OUT_RAW);
if (pngs.length < 20) {
  console.warn(`Warning: expected 20 PNGs, got ${pngs.length}`);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
catalog.source = 'pictures-transparent(1).zip';
catalog.transparent = true;

fs.mkdirSync(OUT_IMG, { recursive: true });
fs.mkdirSync(OUT_PUB, { recursive: true });

for (let i = 0; i < catalog.characters.length; i++) {
  const entry = catalog.characters[i];
  const src = pngs[i];
  if (!src) break;
  const dest = path.join(OUT_IMG, entry.file);
  fs.copyFileSync(src, dest);
  fs.copyFileSync(src, path.join(OUT_PUB, entry.file));
  entry.local_raw = path.relative(ROOT, src);
  entry.transparent = true;
}

const json = JSON.stringify(catalog, null, 2) + '\n';
const pubData = path.join(ROOT, 'shadow-corpus/archive/demo-v0.2/public/data/shadow-characters-v1.json');
fs.writeFileSync(CATALOG_PATH, json);
fs.writeFileSync(pubData, json);

console.log(`Imported ${Math.min(pngs.length, catalog.characters.length)} transparent characters`);
console.log(`  → ${OUT_IMG}`);
