#!/usr/bin/env node
'use strict';

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, ragConfig, worldYearsDir, isConfiguredSecret } from '../lib/config.mjs';
import { chunkWorldYear } from '../lib/chunk-world.mjs';
import { embedTexts } from '../lib/embed.mjs';
import { upsertChunks } from '../lib/supabase-client.mjs';

loadEnv();
const cfg = ragConfig();

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
  const embedReady =
    isConfiguredSecret(cfg.dashscopeApiKey) || isConfiguredSecret(cfg.zhipuApiKey);
  if (!noEmbed && !embedReady) {
    console.error('Missing DASHSCOPE_API_KEY — set in world/.env, or pass --no-embed for rules-only local index');
    process.exit(1);
  }

  const BATCH = 8;
  let upserted = 0;
  let failed = 0;
  const provider = noEmbed ? 'none' : cfg.embeddingProvider;
  const namespace = 'world';
  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);
    let embeddings = null;
    if (!noEmbed) {
      const texts = batch.map(c => c.content);
      embeddings = await embedTexts(texts, {
        instruction: '为平行人生叙事检索中国大陆时代背景与真实际遇'
      });
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
    process.stdout.write(`\rupserted ${Math.min(i + BATCH, allChunks.length)}/${allChunks.length}`);
  }

  console.log('\n--- embed-world summary ---');
  console.log(JSON.stringify({
    namespace,
    provider,
    chunk_total: allChunks.length,
    embed_success: noEmbed ? 0 : allChunks.length - failed,
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
