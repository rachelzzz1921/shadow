#!/usr/bin/env node
'use strict';

/**
 * Chinese narrative embedding eval — compare domestic providers on Shadow-domain queries.
 * Runs offline against local world chunks (no Supabase required).
 *
 * Usage:
 *   node scripts/eval-embedding-cn.mjs
 *   node scripts/eval-embedding-cn.mjs --provider zhipu
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, ragConfig, worldYearsDir } from '../lib/config.mjs';
import { chunkWorldYear } from '../lib/chunk-world.mjs';
import { embedTexts, cosineSimilarity } from '../lib/embed.mjs';
import { walkRepoMarkdown } from '../lib/chunk-repo.mjs';

loadEnv();

/** @type {Array<{ id: string, category: string, query: string, expect: (c: object) => boolean }>} */
const GOLDEN_QUERIES = [
  {
    id: 'world-gaokao',
    category: 'world',
    query: '那年高考改革有什么社会背景',
    expect: c => c.metadata?.category === 'education' || /高考/.test(c.content)
  },
  {
    id: 'world-ai',
    category: 'world',
    query: 'DeepSeek 发布对年轻人就业有什么影响',
    expect: c => /DeepSeek|AI|研发/.test(c.content)
  },
  {
    id: 'harness-intervention',
    category: 'harness',
    query: 'pivotal 年用户 intervention 后下一年如何承接',
    expect: c => /intervention|介入|re-plan/i.test(c.content) || /介入/.test(c.metadata?.heading || '')
  },
  {
    id: 'harness-memory',
    category: 'harness',
    query: 'memory_stream Final Dialogue 检索规则',
    expect: c => /memory/i.test(c.content) && /检索|retriev/i.test(c.content)
  },
  {
    id: 'harness-golden',
    category: 'harness',
    query: '复读线 golden story eval 验收标准',
    expect: c => /复读线|golden/i.test(c.content) || /复读线/.test(c.metadata?.file_path || '')
  },
  {
    id: 'harness-fate',
    category: 'harness',
    query: '命运 Agent 时代语料抽样算法',
    expect: c => /fate|命运|sampleFate/i.test(c.content)
  }
];

async function buildCorpus() {
  const world = [];
  const dir = worldYearsDir();
  for (const file of readdirSync(dir).filter(f => /^\d{4}\.json$/.test(f))) {
    const pack = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    world.push(...chunkWorldYear(pack));
  }
  const harness = walkRepoMarkdown();
  return { world, harness };
}

async function evalNamespace(queries, chunks, provider, model, instruction) {
  const texts = chunks.map(c => c.content);
  const embeddings = await embedTexts(texts, { provider, model, instruction });
  const enriched = chunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));

  const results = [];
  for (const q of queries) {
    const [qVec] = await embedTexts([q.query], { provider, model, instruction });
    const ranked = enriched
      .map(c => ({ c, sim: cosineSimilarity(qVec, c.embedding) }))
      .sort((a, b) => b.sim - a.sim);

    const top5 = ranked.slice(0, 5);
    const hit = top5.some(({ c }) => q.expect(c));
    results.push({ ...q, hit, top1: top5[0]?.c?.content?.slice(0, 80) });
  }

  const recall = results.filter(r => r.hit).length / results.length;
  return { recall, results };
}

async function main() {
  const providerArg = process.argv.find((a, i) => process.argv[i - 1] === '--provider');
  const cfg = ragConfig();
  const provider = providerArg || cfg.embeddingProvider;
  const model = cfg.embeddingModel;

  console.log(`Eval provider=${provider} model=${model}`);
  console.log('Building local corpus (world + harness)...');
  const { world, harness } = await buildCorpus();
  console.log(`  world chunks: ${world.length}, harness chunks: ${harness.length}`);

  if (!cfg.dashscopeApiKey && provider === 'dashscope') {
    console.error('\nMissing DASHSCOPE_API_KEY — eval requires live embedding API.');
    console.error('Set key in world/.env, or run with --dry-skeleton to print query set only.');
    if (process.argv.includes('--dry-skeleton')) {
      console.log('\nGolden queries:', GOLDEN_QUERIES.map(q => q.id).join(', '));
      process.exit(0);
    }
    process.exit(1);
  }

  const worldQueries = GOLDEN_QUERIES.filter(q => q.category === 'world');
  const harnessQueries = GOLDEN_QUERIES.filter(q => q.category === 'harness');

  console.log('\n--- world ---');
  const worldEval = await evalNamespace(
    worldQueries,
    world.slice(0, 400),
    provider,
    model,
    '为平行人生叙事检索时代背景'
  );
  printResults(worldEval);

  console.log('\n--- harness ---');
  const harnessEval = await evalNamespace(
    harnessQueries,
    harness,
    provider,
    model,
    '为 Shadow Harness 开发文档检索'
  );
  printResults(harnessEval);

  const overall = (worldEval.recall * worldQueries.length + harnessEval.recall * harnessQueries.length)
    / GOLDEN_QUERIES.length;

  console.log(`\n=== Overall Recall@5: ${(overall * 100).toFixed(1)}% (pass line: 80%) ===`);
  console.log(overall >= 0.8 ? 'PASS' : 'NEEDS TUNING — try zhipu or adjust queries');
}

function printResults({ recall, results }) {
  console.log(`Recall@5: ${(recall * 100).toFixed(1)}%`);
  for (const r of results) {
    console.log(`  ${r.hit ? '✓' : '✗'} ${r.id}: ${r.query}`);
    if (!r.hit) console.log(`      top1: ${r.top1}...`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
