#!/usr/bin/env node
'use strict';

/**
 * Index archive/demo-v0.2/runs/*.json into rag trace namespace.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, ragConfig } from '../lib/config.mjs';
import { buildTraceSummary } from '../lib/trace-index.mjs';
import { embedTexts } from '../lib/embed.mjs';
import { upsertChunks } from '../lib/supabase-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = path.join(__dirname, '../../../archive/demo-v0.2/runs');

loadEnv();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const cfg = ragConfig();
  if (!fs.existsSync(RUNS_DIR)) {
    console.log('No runs directory:', RUNS_DIR);
    return;
  }

  const files = fs.readdirSync(RUNS_DIR).filter(f => f.endsWith('.json'));
  console.log(`runs to index: ${files.length}`);

  const rows = [];
  for (const file of files) {
    const trace = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, file), 'utf8'));
    const session = {
      run_id: trace.run_id,
      profile: trace.profile,
      pivotal_years: trace.summary?.pivotal_years,
      years: Array.from({ length: trace.summary?.years_completed || 0 }, (_, i) => ({ year: i + 1 })),
      final: trace.summary?.final_title ? { title: trace.summary.final_title } : null,
      persona_card: trace.summary?.shadow_name ? { name: trace.summary.shadow_name } : null
    };
    const row = buildTraceSummary({ trace, session, storyEval: trace.eval });
    row.corpus_version = cfg.corpusVersion;
    rows.push(row);
  }

  if (dryRun) {
    console.log('sample:', rows[0]?.content?.slice(0, 120));
    return;
  }

  if (!cfg.dashscopeApiKey && cfg.embeddingProvider === 'dashscope') {
    console.warn('No DASHSCOPE_API_KEY — storing trace chunks without embeddings');
    await upsertChunks(rows);
    console.log(`indexed ${rows.length} trace rows (rules-only)`);
    return;
  }

  const BATCH = 4;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const embeddings = await embedTexts(
      batch.map(r => r.content),
      { instruction: '为 Shadow 叙事 run 复盘检索' }
    );
    for (let j = 0; j < batch.length; j++) {
      batch[j].embedding = embeddings[j];
    }
    await upsertChunks(batch);
    process.stdout.write(`\rindexed ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log(`\nindexed ${rows.length} trace runs`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
