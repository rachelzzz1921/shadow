#!/usr/bin/env node
/**
 * pack-pixel-assets.mjs — 像素风素材：总览文档 + 完整 inventory + zip
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const CORPUS = path.join(REPO, 'shadow-corpus');
const OUT_DIR = path.join(REPO, 'shadow-pixel-assets-pack');
const ZIP_PATH = path.join(REPO, 'shadow-pixel-assets-pack.zip');

const IMAGE_EXT = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg', '.bmp']);

const SOURCE_ARCHIVES = [
  'GuttyKreum_CleanCityv3.zip',
  'Modern_Interiors_Free_v2.2.zip',
  'RPG像素现代城市地图游戏场景素材.zip',
  'free-city-backgrounds-pixel-art.zip',
  '人物行走图素材(XP)(2937个).rar',
  '农场生活.zip',
  '场景+道具+道具+技能+头像+装备+像素小人-999张.zip',
  '室内像素风格地图场景图块元素游戏素材.zip',
  '小型室内场景16×16 Tileset像素游戏贴图素材.zip',
];

const SPREADSHEETS = ['像素素材包解析.xlsx', '副本RFONE-归类整理.xlsx'];

function fmtBytes(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GB';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' MB';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' KB';
  return n + ' B';
}

function walkFiles(root, { prefix = '' } = {}) {
  const rows = [];
  if (!fs.existsSync(root)) return rows;
  const stack = [{ dir: root, rel: prefix }];
  while (stack.length) {
    const { dir, rel } = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === '__MACOSX') continue;
      const abs = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        stack.push({ dir: abs, rel: r });
      } else if (e.isFile()) {
        const st = fs.statSync(abs);
        const ext = path.extname(e.name).toLowerCase();
        rows.push({
          path: r,
          abs,
          ext,
          bytes: st.size,
          is_image: IMAGE_EXT.has(ext),
        });
      }
    }
  }
  return rows;
}

function summarizePkg(pkgDir) {
  const files = walkFiles(pkgDir, { prefix: path.basename(pkgDir) });
  const images = files.filter((f) => f.is_image);
  const bytes = files.reduce((s, f) => s + f.bytes, 0);
  const topDirs = new Set();
  for (const f of files) {
    const parts = f.path.split('/');
    if (parts.length > 1) topDirs.add(parts[1]);
  }
  return { files: files.length, images: images.length, bytes, topDirs: [...topDirs].slice(0, 8) };
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyTree(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  execSync(`cp -R "${src}" "${dest}"`, { stdio: 'pipe' });
}

function buildCatalog(data) {
  const lines = [];
  lines.push('# Shadow 像素风素材总览');
  lines.push('');
  lines.push(`> 生成：${data.generated_at.slice(0, 10)} · 本文件为**唯一总览文档**`);
  lines.push('> Visual 模块寻源规范见 `docs/02-asset-registry-spec.md`');
  lines.push('');
  lines.push('## 统计');
  lines.push('');
  lines.push('| 类别 | 文件数 | 图片数 | 体积 |');
  lines.push('|------|--------|--------|------|');
  for (const s of data.sections) {
    lines.push(`| ${s.label} | ${s.files} | ${s.images} | ${fmtBytes(s.bytes)} |`);
  }
  lines.push(`| **合计** | **${data.totals.files}** | **${data.totals.images}** | **${fmtBytes(data.totals.bytes)}** |`);
  lines.push('');

  lines.push('## 1. 原始压缩包（source-archives/）');
  lines.push('');
  lines.push('| 文件 | 体积 | 说明 |');
  lines.push('|------|------|------|');
  for (const a of data.archives) {
    lines.push(`| \`${a.name}\` | ${fmtBytes(a.bytes)} | ${a.note || '—'} |`);
  }
  lines.push('');

  lines.push('## 2. 解压索引（extracted/assets_extract/）');
  lines.push('');
  lines.push('| 包 | 文件 | 图片 | 体积 | 主要子目录 |');
  lines.push('|----|------|------|------|------------|');
  for (const p of data.pkgs) {
    lines.push(`| ${p.id} | ${p.files} | ${p.images} | ${fmtBytes(p.bytes)} | ${p.topDirs.join(' · ') || '—'} |`);
  }
  lines.push('');

  lines.push('## 3. Demo 在用的素材（demo-assets/）');
  lines.push('');
  lines.push('路径：`shadow-corpus/archive/demo-v0.2/public/assets/`');
  lines.push('');
  lines.push('| 目录 | 用途 | 文件数 |');
  lines.push('|------|------|--------|');
  for (const d of data.demoDirs) {
    lines.push(`| \`${d.name}/\` | ${d.note} | ${d.files} |`);
  }
  lines.push('');

  lines.push('## 4. 归类表格（spreadsheets/）');
  lines.push('');
  for (const x of data.spreadsheets) {
    lines.push(`- \`${x.name}\`（${fmtBytes(x.bytes)}）`);
  }
  lines.push('');

  lines.push('## 5. Visual 正式素材库（待填）');
  lines.push('');
  lines.push('- 规范：`visual/registry/assets.csv`（本包内 `registry/assets.csv`）');
  lines.push('- 复读线场景 brief：`visual-fuxduxian/scene-briefs.md`');
  lines.push('- **注意**：Visual CHG-V001 要求优先**新寻源**优质免费库，旧 zip 作参考对照，不直接当主库');
  lines.push('');

  lines.push('## 6. 完整文件清单');
  lines.push('');
  lines.push(`机器可读：\`inventory-full.csv\`（${data.totals.files} 行）`);
  lines.push('');
  lines.push('列：`category, relative_path, ext, bytes, is_image`');
  lines.push('');

  lines.push('## 包内目录');
  lines.push('');
  lines.push('```');
  lines.push('shadow-pixel-assets-pack/');
  lines.push('├── PIXEL-ASSETS-CATALOG.md    ← 本文件');
  lines.push('├── MANIFEST.json');
  lines.push('├── inventory-full.csv');
  lines.push('├── source-archives/           ← 原始 zip/rar');
  lines.push('├── extracted/assets_extract/  ← 已解压素材');
  lines.push('├── demo-assets/               ← demo 引用素材');
  lines.push('├── spreadsheets/              ← xlsx 归类表');
  lines.push('├── thumbs/                    ← 预览缩略图');
  lines.push('├── registry/                  ← Visual CSV 规范');
  lines.push('└── docs/                      ← 素材规范文档');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const generated_at = new Date().toISOString();
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const inventory = [];
  const sections = [];

  // archives
  const archDir = path.join(OUT_DIR, 'source-archives');
  fs.mkdirSync(archDir);
  const archives = [];
  for (const name of SOURCE_ARCHIVES) {
    const src = path.join(REPO, name);
    if (!fs.existsSync(src)) continue;
    copyFile(src, path.join(archDir, name));
    const st = fs.statSync(src);
    archives.push({ name, bytes: st.size });
    inventory.push({ category: 'source-archives', relative_path: name, ext: path.extname(name), bytes: st.size, is_image: false });
  }
  sections.push({
    label: '原始压缩包',
    files: archives.length,
    images: 0,
    bytes: archives.reduce((s, a) => s + a.bytes, 0),
  });

  // spreadsheets
  const xDir = path.join(OUT_DIR, 'spreadsheets');
  fs.mkdirSync(xDir);
  const spreadsheets = [];
  for (const name of SPREADSHEETS) {
    const src = path.join(REPO, name);
    if (!fs.existsSync(src)) continue;
    copyFile(src, path.join(xDir, name));
    const st = fs.statSync(src);
    spreadsheets.push({ name, bytes: st.size });
    inventory.push({ category: 'spreadsheets', relative_path: name, ext: path.extname(name), bytes: st.size, is_image: false });
  }

  // assets_extract
  const extractSrc = path.join(REPO, 'assets_extract');
  const extractDest = path.join(OUT_DIR, 'extracted/assets_extract');
  const pkgs = [];
  if (fs.existsSync(extractSrc)) {
    copyTree(extractSrc, path.join(OUT_DIR, 'extracted/assets_extract'));
    const pkgNames = fs.readdirSync(extractSrc).filter((n) => n.startsWith('pkg'));
    let secFiles = 0;
    let secImages = 0;
    let secBytes = 0;
    for (const id of pkgNames.sort()) {
      const pkgPath = path.join(extractSrc, id);
      const sum = summarizePkg(pkgPath);
      pkgs.push({ id, ...sum, topDirs: sum.topDirs });
      secFiles += sum.files;
      secImages += sum.images;
      secBytes += sum.bytes;
      const rows = walkFiles(pkgPath, { prefix: `extracted/assets_extract/${id}` });
      for (const r of rows) {
        inventory.push({
          category: 'extracted',
          relative_path: r.path,
          ext: r.ext,
          bytes: r.bytes,
          is_image: r.is_image,
        });
      }
    }
    sections.push({ label: '解压素材 assets_extract', files: secFiles, images: secImages, bytes: secBytes });
  }

  // demo assets
  const demoSrc = path.join(CORPUS, 'archive/demo-v0.2/public/assets');
  const demoDest = path.join(OUT_DIR, 'demo-assets');
  const demoDirs = [];
  if (fs.existsSync(demoSrc)) {
    copyTree(demoSrc, demoDest);
    const dirs = fs.readdirSync(demoSrc, { withFileTypes: true }).filter((d) => d.isDirectory());
    let secFiles = 0;
    let secImages = 0;
    let secBytes = 0;
    const notes = {
      sunny: 'Sunnyside 角色 strip（idle/walk/wait…）',
      modern: 'Modern 室内 tile + 角色',
      tiles: '地图 tile',
      cities: '城市背景',
    };
    for (const d of dirs) {
      const rows = walkFiles(path.join(demoSrc, d.name), { prefix: `demo-assets/${d.name}` });
      const imgs = rows.filter((r) => r.is_image);
      const bytes = rows.reduce((s, r) => s + r.bytes, 0);
      demoDirs.push({ name: d.name, note: notes[d.name] || '—', files: rows.length });
      secFiles += rows.length;
      secImages += imgs.length;
      secBytes += bytes;
      for (const r of rows) {
        inventory.push({
          category: 'demo-assets',
          relative_path: r.path,
          ext: r.ext,
          bytes: r.bytes,
          is_image: r.is_image,
        });
      }
    }
    sections.push({ label: 'Demo 引用素材', files: secFiles, images: secImages, bytes: secBytes });
  }

  // thumbs
  const thumbsSrc = path.join(REPO, 'thumbs');
  if (fs.existsSync(thumbsSrc)) {
    copyTree(thumbsSrc, path.join(OUT_DIR, 'thumbs'));
    const rows = walkFiles(thumbsSrc, { prefix: 'thumbs' });
    let bytes = 0;
    for (const r of rows) {
      bytes += r.bytes;
      inventory.push({
        category: 'thumbs',
        relative_path: r.path,
        ext: r.ext,
        bytes: r.bytes,
        is_image: r.is_image,
      });
    }
    sections.push({
      label: '预览缩略图',
      files: rows.length,
      images: rows.filter((r) => r.is_image).length,
      bytes,
    });
  }

  // registry + docs
  const regDir = path.join(OUT_DIR, 'registry');
  fs.mkdirSync(regDir);
  copyFile(path.join(CORPUS, 'visual/registry/assets.csv'), path.join(regDir, 'assets.csv'));
  const docsDir = path.join(OUT_DIR, 'docs');
  fs.mkdirSync(docsDir);
  copyFile(path.join(CORPUS, 'visual/02-asset-registry-spec.md'), path.join(docsDir, '02-asset-registry-spec.md'));
  fs.mkdirSync(path.join(OUT_DIR, 'visual-fuxduxian'), { recursive: true });
  copyFile(path.join(CORPUS, 'visual/stories/fuxduxian/scene-briefs.md'), path.join(OUT_DIR, 'visual-fuxduxian/scene-briefs.md'));

  // spreadsheets section stats
  sections.push({
    label: '归类 xlsx',
    files: spreadsheets.length,
    images: 0,
    bytes: spreadsheets.reduce((s, x) => s + x.bytes, 0),
  });

  const totals = {
    files: inventory.length,
    images: inventory.filter((i) => i.is_image).length,
    bytes: inventory.reduce((s, i) => s + i.bytes, 0),
  };

  const catalogData = {
    generated_at,
    archives,
    pkgs,
    demoDirs,
    spreadsheets,
    sections,
    totals,
  };

  const catalog = buildCatalog(catalogData);
  fs.writeFileSync(path.join(OUT_DIR, 'PIXEL-ASSETS-CATALOG.md'), catalog + '\n');

  // CSV inventory
  const csvLines = ['category,relative_path,ext,bytes,is_image'];
  for (const row of inventory.sort((a, b) => a.category.localeCompare(b.category) || a.relative_path.localeCompare(b.relative_path))) {
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    csvLines.push([row.category, esc(row.relative_path), row.ext, row.bytes, row.is_image ? 1 : 0].join(','));
  }
  fs.writeFileSync(path.join(OUT_DIR, 'inventory-full.csv'), csvLines.join('\n') + '\n');

  fs.writeFileSync(
    path.join(OUT_DIR, 'MANIFEST.json'),
    JSON.stringify({ version: 1, ...catalogData, catalog_file: 'PIXEL-ASSETS-CATALOG.md' }, null, 2) + '\n'
  );

  if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);
  console.log('Creating zip (may take 1–3 min for ~700MB+)…');
  execSync(`cd "${REPO}" && zip -r -q "shadow-pixel-assets-pack.zip" "shadow-pixel-assets-pack" -x "*.DS_Store"`);
  const zipSize = fs.statSync(ZIP_PATH).size;
  console.log(`\n✓ Pack → ${OUT_DIR}/`);
  console.log(`✓ Doc  → ${OUT_DIR}/PIXEL-ASSETS-CATALOG.md`);
  console.log(`✓ CSV  → ${OUT_DIR}/inventory-full.csv (${totals.files} files, ${totals.images} images)`);
  console.log(`✓ Zip  → ${ZIP_PATH} (${fmtBytes(zipSize)})`);
}

main();
