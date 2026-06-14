#!/usr/bin/env node
'use strict';

import { loadEnv, ragConfig, isConfiguredSecret } from '../lib/config.mjs';
import { isLocalProvider } from '../lib/embed-local.mjs';
import { walkRepoMarkdown } from '../lib/chunk-repo.mjs';
import { embedTexts } from '../lib/embed.mjs';
import { upsertChunks } from '../lib/supabase-client.mjs';

loadEnv();
const cfg = ragConfig();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const chunks = walkRepoMarkdown();
  console.log(`repo .md chunks: ${chunks.length}`);

  if (dryRun) {
    const sample = chunks.slice(0, 5).map(c => c.metadata.file_path);
    console.log('sample paths:', sample.join('\n  '));
    return;
  }

  const noEmbed = process.argv.includes('--no-embed');
  const embedReady =
    isLocalProvider(cfg.embeddingProvider) ||
    isConfiguredSecret(cfg.dashscopeApiKey) ||
    isConfiguredSecret(cfg.zhipuApiKey);
  if (!noEmbed && !embedReady) {
    console.error('Set RAG_EMBEDDING_PROVIDER=local or configure a cloud embedding API key');
    process.exit(1);
  }

  const BATCH = 6;
  let upserted = 0;
  let failed = 0;
  const provider = noEmbed ? 'none' : cfg.embeddingProvider;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    let embeddings = null;
    if (!noEmbed) {
      embeddings = await embedTexts(
        batch.map(c => c.content),
        { instruction: '为 Shadow 平行人生 Harness 开发文档检索' }
      );
    }
    const rows = batch.map((c, j) => ({
      ...c,
      embedding: embeddings ? embeddings[j] : null,
      corpus_version: cfg.corpusVersion
    }));
    try {
      upserted += await upsertChunks(rows);
    } catch (err) {
      failed += batch.length;
      console.error(`\nupsert batch failed: ${err.message}`);
    }
    if (i % 60 === 0 || i + BATCH >= chunks.length) {
      process.stdout.write(`\rupserted ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
    }
  }

  console.log('\n--- embed-repo summary ---');
  console.log(JSON.stringify({
    namespace: 'harness',
    provider,
    chunk_total: chunks.length,
    embed_success: noEmbed ? 0 : chunks.length - failed,
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
