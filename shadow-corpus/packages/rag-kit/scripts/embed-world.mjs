#!/usr/bin/env node
'use strict';

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, ragConfig, worldYearsDir, isConfiguredSecret } from '../lib/config.mjs';
import { isLocalProvider } from '../lib/embed-local.mjs';
import { chunkWorldYear } from '../lib/chunk-world.mjs';
import { embedTexts } from '../lib/embed.mjs';
import { upsertChunks } from '../lib/supabase-client.mjs';
import { loadNamespace } from '../lib/local-index.mjs';

loadEnv();
const cfg = ragConfig();

function chunkKey(c) {
  return `${c.source_id}|${c.chunk_index ?? 0}|${cfg.corpusVersion}`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const dir = worldYearsDir();
  const files = readdirSync(dir).filter(f => /^\d{4}\.json$/.test(f));

  let allChunks = [];
  for (const file of files) {
    const pack = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    allChunks.push(...chunkWorldYear(pack));
  }

  console.log(`world chunks: ${allChunks.length} from ${files.length} years`);

  if (dryRun) {
    console.log('dry-run — skip embed/upsert');
    return;
  }

  const noEmbed = process.argv.includes('--no-embed');
  const resume = !process.argv.includes('--no-resume');
  const embedReady =
    isLocalProvider(cfg.embeddingProvider) ||
    isConfiguredSecret(cfg.dashscopeApiKey) ||
    isConfiguredSecret(cfg.zhipuApiKey);
  if (!noEmbed && !embedReady) {
    console.error('Missing embedding provider — set RAG_EMBEDDING_PROVIDER=local or DASHSCOPE_API_KEY');
    process.exit(1);
  }

  const expectedDims = cfg.embeddingDimensions;

  const cachedEmb = new Map();
  if (resume && !noEmbed) {
    for (const row of loadNamespace('world')) {
      if (Array.isArray(row.embedding) && row.embedding.length === expectedDims) {
        cachedEmb.set(chunkKey(row), row.embedding);
      }
    }
    if (cachedEmb.size) console.log(`resume: ${cachedEmb.size} chunks already embedded locally`);
  }

  const BATCH = 8;
  let upserted = 0;
  let failed = 0;
  let skipped = 0;
  let embedded = 0;
  const provider = noEmbed ? 'none' : cfg.embeddingProvider;
  const namespace = 'world';
  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);
    const needTexts = [];
    const needIdx = [];
    if (!noEmbed) {
      batch.forEach((c, j) => {
        const key = chunkKey(c);
        if (cachedEmb.has(key)) {
          skipped += 1;
        } else {
          needIdx.push(j);
          needTexts.push(c.content);
        }
      });
    }
    let newEmb = [];
    if (needTexts.length) {
      newEmb = await embedTexts(needTexts, {
        instruction: '为平行人生叙事检索中国大陆时代背景与真实际遇'
      });
      embedded += newEmb.length;
    }
    let newEmbPtr = 0;
    const rows = batch.map(c => {
      const key = chunkKey(c);
      let emb = null;
      if (!noEmbed) {
        emb = cachedEmb.has(key) ? cachedEmb.get(key) : newEmb[newEmbPtr++];
      }
      return { ...c, embedding: emb, corpus_version: cfg.corpusVersion };
    });
    try {
      upserted += await upsertChunks(rows);
    } catch (err) {
      failed += batch.length;
      console.error(`\nupsert batch failed: ${err.message}`);
    }
    process.stdout.write(`\rupserted ${Math.min(i + BATCH, allChunks.length)}/${allChunks.length}`);
  }

  console.log('\n--- embed-world summary ---');
  console.log(JSON.stringify({
    namespace,
    provider,
    chunk_total: allChunks.length,
    embed_new: embedded,
    embed_skipped: skipped,
    upsert_success: upserted,
    failed,
    corpus_version: cfg.corpusVersion,
    supabase: isConfiguredSecret(cfg.supabaseUrl) && isConfiguredSecret(cfg.supabaseServiceKey)
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
