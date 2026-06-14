'use strict';

import { ragConfig, isConfiguredSecret } from './config.mjs';
import { embedLocalTexts, isLocalProvider, resolveLocalModelId } from './embed-local.mjs';

const BATCH_SIZE = 10;

/**
 * Embed texts via domestic providers (DashScope default).
 * @param {string[]} texts
 * @param {{ provider?: string, model?: string, instruction?: string }} [opts]
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts, opts = {}) {
  const cfg = ragConfig();
  const provider = opts.provider || cfg.embeddingProvider;
  const model = opts.model || cfg.embeddingModel;
  const cleaned = texts.map(t => String(t || '').slice(0, 6000));

  if (!cleaned.length) return [];

  try {
    return await embedWithProvider(provider, cleaned, { model, cfg, instruction: opts.instruction });
  } catch (err) {
    const fallback = process.env.RAG_EMBEDDING_FALLBACK || 'local';
    if (provider !== fallback && isLocalProvider(fallback)) {
      console.warn(`[rag-kit] ${provider} embed failed → local (${err.message.slice(0, 80)})`);
      return embedLocalTexts(cleaned, {
        model: process.env.RAG_LOCAL_EMBED_MODEL,
        instruction: opts.instruction
      });
    }
    throw err;
  }
}

async function embedWithProvider(provider, cleaned, { model, cfg, instruction }) {
  switch (provider) {
    case 'local':
    case 'xenova':
      return embedLocalTexts(cleaned, {
        model: resolveLocalModelId(model || process.env.RAG_LOCAL_EMBED_MODEL),
        instruction
      });
    case 'dashscope':
      return embedDashScope(cleaned, { model, apiKey: cfg.dashscopeApiKey, instruction });
    case 'zhipu':
      return embedZhipu(cleaned, { model: model || 'embedding-3', apiKey: cfg.zhipuApiKey });
    case 'stepfun':
      return embedStepFun(cleaned, { model, apiKey: cfg.stepfunApiKey, instruction });
    default:
      throw new Error(`Unknown RAG_EMBEDDING_PROVIDER: ${provider}`);
  }
}

/** @param {string} text */
export async function embedOne(text, opts = {}) {
  const [vec] = await embedTexts([text], opts);
  return vec;
}

async function embedDashScope(texts, { model, apiKey, instruction }) {
  if (!apiKey) {
    throw new Error('Missing DASHSCOPE_API_KEY for embedding');
  }

  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const input = instruction
      ? batch.map(t => `${instruction}\n${t}`)
      : batch;

    const res = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: { texts: input },
        parameters: {
          dimension: Number(process.env.RAG_EMBEDDING_DIMENSIONS || 1024)
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DashScope embed failed (${res.status}): ${errText.slice(0, 400)}`);
    }

    const data = await res.json();
    const embeddings = data?.output?.embeddings;
    if (!Array.isArray(embeddings)) {
      throw new Error(`DashScope unexpected response: ${JSON.stringify(data).slice(0, 300)}`);
    }
    for (const item of embeddings.sort((a, b) => a.text_index - b.text_index)) {
      results.push(item.embedding);
    }
  }
  return results;
}

async function embedZhipu(texts, { model, apiKey }) {
  if (!apiKey) {
    throw new Error('Missing ZHIPU_API_KEY for embedding');
  }

  const results = [];
  for (const text of texts) {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, input: text })
    });
    if (!res.ok) {
      throw new Error(`Zhipu embed failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    }
    const data = await res.json();
    results.push(data?.data?.[0]?.embedding);
  }
  return results;
}

/**
 * 阶跃星辰 OpenAI 兼容 /v1/embeddings（当前账号模型列表无 embedding 型号时会失败）。
 * 叙事 LLM 请用 archive demo 的 SHADOW_PROVIDER=stepfun。
 */
async function embedStepFun(texts, { model, apiKey, instruction }) {
  if (!apiKey) {
    throw new Error('Missing STEPFUN_API_KEY (or STEP_API_KEY) for embedding');
  }
  const modelId = model || process.env.RAG_EMBEDDING_MODEL || 'step-embed-v1';
  const baseUrl = process.env.STEPFUN_BASE_URL || 'https://api.stepfun.com/v1';

  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const input = instruction
      ? batch.map(t => `${instruction}\n${t}`)
      : batch;

    const res = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: modelId, input })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `StepFun embed failed (${res.status}): ${errText.slice(0, 400)}. `
        + '阶跃开放平台暂无公开 embedding 模型时，请用 RAG_EMBEDDING_PROVIDER=dashscope；叙事 LLM 用 SHADOW_PROVIDER=stepfun。'
      );
    }

    const data = await res.json();
    const rows = data?.data;
    if (!Array.isArray(rows)) {
      throw new Error(`StepFun unexpected embed response: ${JSON.stringify(data).slice(0, 300)}`);
    }
    for (const item of rows.sort((a, b) => a.index - b.index)) {
      results.push(item.embedding);
    }
  }
  return results;
}

/** Cosine similarity for unit vectors or raw vectors. */
export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}
