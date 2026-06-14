'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ragConfig } from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_INDEX_DIR = path.join(__dirname, '../data/local-index');

function indexPath(namespace) {
  return path.join(LOCAL_INDEX_DIR, `${namespace}.json`);
}

function rowKey(row) {
  return `${row.namespace}|${row.source_id}|${row.chunk_index ?? 0}|${row.corpus_version || ''}`;
}

/** @returns {object[]} */
export function loadNamespace(namespace) {
  const file = indexPath(namespace);
  if (!fs.existsSync(file)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Merge upsert into namespace JSON file.
 * @param {object[]} rows
 */
export function upsertLocalChunks(rows) {
  if (!rows?.length) return 0;
  fs.mkdirSync(LOCAL_INDEX_DIR, { recursive: true });

  const byNs = new Map();
  for (const row of rows) {
    const ns = row.namespace;
    if (!byNs.has(ns)) byNs.set(ns, new Map());
    byNs.get(ns).set(rowKey(row), row);
  }

  let written = 0;
  for (const [namespace, map] of byNs) {
    const existing = loadNamespace(namespace);
    const merged = new Map(existing.map(r => [rowKey(r), r]));
    for (const [k, v] of map) {
      merged.set(k, v);
      written += 1;
    }
    const out = [...merged.values()];
    fs.writeFileSync(indexPath(namespace), JSON.stringify(out), 'utf8');
  }
  return written;
}

/**
 * @param {{ namespace: string, filters?: Record<string, string>, limit?: number }} opts
 */
export function fetchLocalCandidates({ namespace, filters = {} }) {
  let rows = loadNamespace(namespace);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    const want = String(value);
    rows = rows.filter(r => String(r.metadata?.[key] ?? '') === want);
  }
  return rows;
}

export function hasLocalIndex(namespace) {
  const rows = loadNamespace(namespace);
  return rows.length > 0;
}

export function localIndexHasEmbeddings(namespace) {
  const rows = loadNamespace(namespace);
  return rows.some(r => Array.isArray(r.embedding) && r.embedding.length > 0);
}

export function getLocalIndexStats() {
  const cfg = ragConfig();
  const stats = { corpus_version: cfg.corpusVersion, namespaces: {} };
  if (!fs.existsSync(LOCAL_INDEX_DIR)) {
    stats.total_chunks = 0;
    return stats;
  }
  for (const file of fs.readdirSync(LOCAL_INDEX_DIR)) {
    if (!file.endsWith('.json')) continue;
    const ns = file.replace(/\.json$/, '');
    const rows = loadNamespace(ns);
    stats.namespaces[ns] = {
      chunks: rows.length,
      with_embeddings: rows.filter(r => r.embedding?.length).length
    };
  }
  stats.total_chunks = Object.values(stats.namespaces).reduce((s, n) => s + n.chunks, 0);
  return stats;
}

export function clearLocalIndex(namespace) {
  if (namespace) {
    const file = indexPath(namespace);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return;
  }
  if (fs.existsSync(LOCAL_INDEX_DIR)) {
    for (const f of fs.readdirSync(LOCAL_INDEX_DIR)) {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(LOCAL_INDEX_DIR, f));
    }
  }
}
