'use strict';

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** True when value looks like a real secret (not empty / .env.example placeholder). */
export function isConfiguredSecret(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (/YOUR_PROJECT|your_|sk-your|placeholder|changeme|^xxx$/i.test(v)) return false;
  if (v.startsWith('https://YOUR_') || v === 'your_service_role_key' || v === 'your_anon_key') {
    return false;
  }
  return true;
}

/** Load .env from rag-kit, world, demo, or repo root — merge all found files. */
export function loadEnv() {
  const candidates = [
    join(__dirname, '../.env'),
    join(__dirname, '../../../world/.env'),
    join(__dirname, '../../../archive/demo-v0.2/.env'),
    join(__dirname, '../../../../.env')
  ];
  let lastLoaded = null;
  for (const envPath of candidates) {
    try {
      const text = readFileSync(envPath, 'utf8');
      for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!m) continue;
        const val = m[2].replace(/^["']|["']$/g, '');
        const existing = process.env[m[1]];
        if (existing === undefined || !isConfiguredSecret(existing)) {
          process.env[m[1]] = val;
        }
      }
      lastLoaded = envPath;
    } catch {
      /* try next */
    }
  }
  return lastLoaded;
}

export function ragConfig() {
  loadEnv();
  return {
    enabled: process.env.RAG_ENABLED !== 'false',
    fallback: process.env.RAG_FALLBACK || 'rules',
    embeddingProvider: process.env.RAG_EMBEDDING_PROVIDER || 'dashscope',
    embeddingModel: process.env.RAG_EMBEDDING_MODEL || 'text-embedding-v3',
    embeddingDimensions: Number(process.env.RAG_EMBEDDING_DIMENSIONS || 1024),
    corpusVersion: process.env.RAG_CORPUS_VERSION || '2026.06.14-rag-v1',
    worldCorpusVersion: process.env.WORLD_CORPUS_VERSION || '2026.06.14-v1',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    dashscopeApiKey: process.env.DASHSCOPE_API_KEY || '',
    zhipuApiKey: process.env.ZHIPU_API_KEY || '',
    stepfunApiKey: process.env.STEPFUN_API_KEY || process.env.STEP_API_KEY || ''
  };
}

export function repoRoot() {
  return join(__dirname, '../../../..');
}

export function worldYearsDir() {
  return join(__dirname, '../../../world/data/years');
}
