'use strict';

/**
 * Offline embeddings via @xenova/transformers (ONNX, CPU).
 * Default: multilingual MiniLM — 384 dims, supports Chinese narrative text.
 */

import { pipeline, env } from '@xenova/transformers';

export const LOCAL_EMBED_DEFAULT_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
export const LOCAL_EMBED_DIMENSIONS = 384;

// 国内默认走 HF 镜像；首次运行需联网下载 ONNX 模型（约 100MB），之后离线可用
env.remoteHost = (process.env.HF_ENDPOINT || 'https://hf-mirror.com').replace(/\/$/, '');
env.allowLocalModels = false;

let cachedPipe = null;
let cachedModelId = null;

export async function getLocalEmbedPipeline(modelId = LOCAL_EMBED_DEFAULT_MODEL) {
  if (cachedPipe && cachedModelId === modelId) return cachedPipe;
  cachedPipe = await pipeline('feature-extraction', modelId, { quantized: true });
  cachedModelId = modelId;
  return cachedPipe;
}

/**
 * @param {string[]} texts
 * @param {{ model?: string, instruction?: string }} [opts]
 * @returns {Promise<number[][]>}
 */
export async function embedLocalTexts(texts, opts = {}) {
  const modelId = resolveLocalModelId(opts.model);
  const pipe = await getLocalEmbedPipeline(modelId);
  const results = [];

  for (const raw of texts) {
    const text = String(raw || '').slice(0, 6000);
    const input = opts.instruction ? `${opts.instruction}\n${text}` : text;
    const out = await pipe(input, { pooling: 'mean', normalize: true });
    results.push(Array.from(out.data));
  }

  return results;
}

export function isLocalProvider(provider) {
  return provider === 'local' || provider === 'xenova';
}

/** Cloud embedding model ids must never be passed to @xenova/transformers. */
export function resolveLocalModelId(explicit) {
  const candidate =
    explicit || process.env.RAG_LOCAL_EMBED_MODEL || LOCAL_EMBED_DEFAULT_MODEL;
  if (/text-embedding|embedding-3|step-embed/i.test(candidate)) {
    return LOCAL_EMBED_DEFAULT_MODEL;
  }
  return candidate;
}
