'use strict';

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { repoRoot } from './config.mjs';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.cursor',
  'dist',
  'build',
  '.next',
  'coverage'
]);

const MAX_FILE_BYTES = 512 * 1024;

/**
 * Walk entire repo for .md files and chunk by headings.
 * @param {string} [root]
 */
export function walkRepoMarkdown(root = repoRoot()) {
  const files = [];
  collectMarkdown(root, root, files);
  const allChunks = [];
  for (const filePath of files) {
    allChunks.push(...chunkMarkdownFile(filePath, root));
  }
  return allChunks;
}

function collectMarkdown(dir, root, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      collectMarkdown(full, root, out);
      continue;
    }
    if (!ent.name.endsWith('.md')) continue;
    try {
      if (statSync(full).size > MAX_FILE_BYTES) continue;
    } catch {
      continue;
    }
    out.push(full);
  }
}

/**
 * @param {string} filePath
 * @param {string} root
 */
export function chunkMarkdownFile(filePath, root = repoRoot()) {
  const rel = relative(root, filePath);
  const text = readFileSync(filePath, 'utf8');
  const stage = inferHarnessStage(rel);
  const sections = splitByHeadings(text);
  if (!sections.length) {
    return [{
      namespace: 'harness',
      source_type: 'harness_doc',
      source_id: `md:${rel}:0`,
      chunk_index: 0,
      content: text.slice(0, 4000),
      metadata: { file_path: rel, harness_stage: stage, heading: '(root)' }
    }];
  }

  return sections.map((sec, i) => ({
    namespace: 'harness',
    source_type: 'harness_doc',
    source_id: `md:${rel}:${slug(sec.heading)}`,
    chunk_index: i,
    content: sec.body.slice(0, 4000),
    metadata: {
      file_path: rel,
      harness_stage: stage,
      heading: sec.heading,
      char_len: sec.body.length
    }
  }));
}

function splitByHeadings(text) {
  const lines = text.split('\n');
  const sections = [];
  let current = { heading: '(intro)', body: '' };

  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      if (current.body.trim()) sections.push({ ...current, body: current.body.trim() });
      current = { heading: m[2].trim(), body: '' };
      continue;
    }
    current.body += line + '\n';
  }
  if (current.body.trim()) sections.push({ ...current, body: current.body.trim() });
  return sections;
}

function inferHarnessStage(relPath) {
  const m = relPath.match(/shadow-corpus\/(0[1-7]-[^/]+)/);
  if (m) return m[1];
  if (relPath.includes('archive/demo')) return 'archive-demo';
  if (relPath.includes('skills/')) return 'skills';
  if (relPath.startsWith('docs/')) return 'docs';
  return 'repo';
}

function slug(s) {
  return String(s)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'section';
}
