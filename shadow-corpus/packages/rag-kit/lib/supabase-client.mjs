'use strict';

import { createClient } from '@supabase/supabase-js';
import { ragConfig, isConfiguredSecret } from './config.mjs';
import { isLocalProvider } from './embed-local.mjs';
import {
  upsertLocalChunks,
  fetchLocalCandidates,
  hasLocalIndex
} from './local-index.mjs';

/** @returns {import('@supabase/supabase-js').SupabaseClient | null} */
export function createRagClient({ service = false } = {}) {
  const cfg = ragConfig();
  const url = cfg.supabaseUrl;
  const key = service ? cfg.supabaseServiceKey : cfg.supabaseAnonKey;
  if (!isConfiguredSecret(url) || !isConfiguredSecret(key)) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function canUseSupabase() {
  const cfg = ragConfig();
  return isConfiguredSecret(cfg.supabaseUrl) && isConfiguredSecret(cfg.supabaseServiceKey);
}

/**
 * Upsert rag chunks — Supabase when configured, always mirror to local index when RAG_LOCAL_INDEX≠false.
 */
export async function upsertChunks(rows) {
  const cfg = ragConfig();
  const payload = rows.map(r => ({
    namespace: r.namespace,
    source_type: r.source_type,
    source_id: r.source_id,
    chunk_index: r.chunk_index ?? 0,
    content: r.content,
    metadata: r.metadata || {},
    embedding: supabaseEmbedding(r.embedding, cfg),
    corpus_version: r.corpus_version || cfg.corpusVersion,
    updated_at: new Date().toISOString()
  }));

  const mirrorLocal = process.env.RAG_LOCAL_INDEX !== 'false';
  let localCount = 0;
  if (mirrorLocal) {
    localCount = upsertLocalChunks(payload);
  }

  const client = isLocalProvider(cfg.embeddingProvider) ? null : createRagClient({ service: true });
  if (!client) {
    if (!mirrorLocal || !localCount) {
      throw new Error('Missing SUPABASE credentials; enable RAG_LOCAL_INDEX or configure Supabase');
    }
    return localCount;
  }

  const { error } = await client
    .from('rag_chunks')
    .upsert(payload, { onConflict: 'namespace,source_id,chunk_index,corpus_version' });

  if (error) {
    if (mirrorLocal && localCount) {
      console.warn(`[rag-kit] Supabase upsert failed (local mirror kept): ${error.message}`);
      return localCount;
    }
    throw error;
  }
  return payload.length;
}

/** Supabase schema is vector(1024); local ONNX uses 384 — mirror local only. */
function supabaseEmbedding(embedding, cfg) {
  if (embedding == null) return null;
  if (isLocalProvider(cfg.embeddingProvider)) return null;
  if (Array.isArray(embedding) && embedding.length !== 1024) return null;
  return embedding;
}

/**
 * Fetch candidates: Supabase first, else local JSON index.
 */
export async function fetchCandidates({ namespace, filters = {}, limit = 200 }) {
  const client = createRagClient({ service: false });
  if (client) {
    try {
      let q = client
        .from('rag_chunks')
        .select('id, namespace, source_type, source_id, chunk_index, content, metadata, embedding')
        .eq('namespace', namespace)
        .limit(limit);

      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        q = q.eq(`metadata->>${key}`, String(value));
      }

      const { data, error } = await q;
      if (!error && data?.length) return data;
    } catch {
      /* fall through */
    }
  }

  if (hasLocalIndex(namespace)) {
    return fetchLocalCandidates({ namespace, filters });
  }
  return [];
}
