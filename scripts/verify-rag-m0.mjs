#!/usr/bin/env node
'use strict';

/**
 * M0 RAG acceptance — env, schema, deps, optional embed/eval/query.
 * Never prints secret values. Exit 0 only when all required checks pass.
 *
 * Usage:
 *   node scripts/verify-rag-m0.mjs
 *   node scripts/verify-rag-m0.mjs --full   # also run embed + eval + query (needs real keys)
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const CORPUS = join(REPO_ROOT, 'shadow-corpus');
const RAG_KIT = join(CORPUS, 'packages/rag-kit');
const MIGRATION = join(CORPUS, 'world/schema/002_rag_embeddings.sql');

const REQUIRED_ENV = [
  'DASHSCOPE_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'RAG_ENABLED'
];

const DB_URL_KEYS = ['DATABASE_URL', 'POSTGRES_URL', 'SUPABASE_DB_URL'];

function isConfiguredSecret(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (/YOUR_PROJECT|your_|sk-your|placeholder|changeme|^xxx$/i.test(v)) return false;
  if (v.startsWith('https://YOUR_') || v === 'your_service_role_key' || v === 'your_anon_key') {
    return false;
  }
  return true;
}

function loadEnvFiles() {
  const paths = [
    join(CORPUS, 'world/.env'),
    join(CORPUS, 'archive/demo-v0.2/.env'),
    join(REPO_ROOT, '.env')
  ];
  for (const p of paths) {
    try {
      const text = readFileSync(p, 'utf8');
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
    } catch {
      /* skip */
    }
  }
}

function envReport() {
  const report = {};
  for (const key of REQUIRED_ENV) {
    const raw = process.env[key];
    if (key === 'RAG_ENABLED') {
      report[key] = raw !== undefined ? 'present' : 'missing';
      continue;
    }
    report[key] = isConfiguredSecret(raw) ? 'present' : 'missing';
  }
  for (const key of DB_URL_KEYS) {
    if (isConfiguredSecret(process.env[key])) report[key] = 'present';
  }
  return report;
}

function missingSecrets(report) {
  return Object.entries(report)
    .filter(([k, v]) => k !== 'RAG_ENABLED' && v === 'missing')
    .map(([k]) => k);
}

function jwtRole(key) {
  try {
    const payload = key.split('.')[1];
    return JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).role;
  } catch {
    return 'invalid';
  }
}

async function verifySupabaseSchema() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isConfiguredSecret(url) || !isConfiguredSecret(serviceKey)) {
    return {
      ok: false,
      blocked: true,
      reason: 'Supabase credentials not configured',
      vector: 'unknown',
      rag_chunks: 'unknown',
      rag_match: 'unknown'
    };
  }

  const { pathToFileURL } = await import('node:url');
  const { createRagClient } = await import(pathToFileURL(join(RAG_KIT, 'lib/supabase-client.mjs')).href);
  const client = createRagClient({ service: true });
  if (!client) {
    return {
      ok: false,
      blocked: true,
      reason: 'createRagClient returned null',
      vector: 'unknown',
      rag_chunks: 'unknown',
      rag_match: 'unknown'
    };
  }

  const serviceRole = jwtRole(serviceKey);
  const writeOk = serviceRole === 'service_role';

  let ragChunks = 'no';
  let ragMatch = 'no';
  let vector = 'unknown';
  let errMsg = '';
  if (!writeOk) {
    errMsg = `SUPABASE_SERVICE_ROLE_KEY JWT role is "${serviceRole}" (need service_role)`;
  }
  try {
    const { error } = await client.from('rag_chunks').select('id').limit(1);
    if (!error) ragChunks = 'yes';
    else errMsg = error.message;
  } catch (e) {
    errMsg = e.message;
  }

  try {
    const probe = new Array(1024).fill(0);
    const { error } = await client.rpc('rag_match', {
      query_embedding: probe,
      match_namespace: 'world',
      match_count: 1,
      filter: {}
    });
    if (!error || /no rows|empty/i.test(error.message)) ragMatch = 'yes';
    else if (/function.*does not exist|42883/i.test(error.message)) ragMatch = 'no';
    else if (!errMsg) errMsg = error.message;
    else ragMatch = 'yes';
  } catch (e) {
    if (/does not exist|42883/i.test(e.message)) ragMatch = 'no';
    else errMsg = errMsg || e.message;
  }

  if (/vector|extension|type.*vector/i.test(errMsg)) vector = 'no';
  else if (ragChunks === 'yes' && ragMatch === 'yes') vector = 'yes';

  return {
    ok: ragChunks === 'yes' && ragMatch === 'yes' && writeOk,
    blocked: ragChunks !== 'yes' || !writeOk,
    reason: errMsg || null,
    vector,
    rag_chunks: ragChunks,
    rag_match: ragMatch,
    service_role: writeOk ? 'yes' : 'no'
  };
}

function localIndexStats() {
  const dir = join(RAG_KIT, 'data/local-index');
  const stats = {};
  for (const ns of ['world', 'harness', 'session', 'trace']) {
    const file = join(dir, `${ns}.json`);
    if (!existsSync(file)) {
      stats[ns] = 0;
      continue;
    }
    try {
      const data = JSON.parse(readFileSync(file, 'utf8'));
      stats[ns] = Array.isArray(data) ? data.length : (data.chunks?.length || 0);
    } catch {
      stats[ns] = 0;
    }
  }
  return stats;
}

function runNpm(script, extraArgs = []) {
  const r = spawnSync('npm', ['run', script, '--', ...extraArgs], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: process.env,
    timeout: 600_000
  });
  return { code: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function tryMigrationAuto() {
  const attempts = [];

  const supabaseVer = spawnSync('supabase', ['--version'], { encoding: 'utf8' });
  attempts.push(`supabase CLI: ${supabaseVer.status === 0 ? 'installed' : 'missing'}`);

  if (supabaseVer.status === 0) {
    const login = spawnSync('supabase', ['projects', 'list'], { encoding: 'utf8' });
    if (login.status !== 0) {
      attempts.push('supabase login: not authenticated');
    } else {
      attempts.push('supabase login: ok');
      const push = spawnSync('supabase', ['db', 'push'], {
        cwd: join(CORPUS, 'world'),
        encoding: 'utf8'
      });
      attempts.push(`supabase db push: exit ${push.status}`);
    }
  }

  for (const key of DB_URL_KEYS) {
    const url = process.env[key];
    if (!isConfiguredSecret(url)) continue;
    const psql = spawnSync('psql', [url, '-f', MIGRATION], { encoding: 'utf8' });
    attempts.push(`psql via ${key}: exit ${psql.status}`);
    if (psql.status === 0) return { applied: true, attempts };
  }

  return { applied: false, attempts };
}

async function main() {
  loadEnvFiles();
  const full = process.argv.includes('--full');
  const report = envReport();
  const missing = missingSecrets(report);
  const blockers = [];

  console.log('=== M0 RAG verify ===\n');
  console.log('Env (present/missing only):');
  for (const [k, v] of Object.entries(report)) console.log(`  ${k}: ${v}`);

  if (!existsSync(MIGRATION)) {
    blockers.push({ stage: 'migration file', detail: '002_rag_embeddings.sql missing' });
  } else {
    console.log(`\nMigration file: present (${MIGRATION})`);
  }

  const ragNodeModules = join(RAG_KIT, 'node_modules/@supabase/supabase-js');
  console.log(`rag-kit deps: ${existsSync(ragNodeModules) ? 'installed' : 'missing'}`);
  if (!existsSync(ragNodeModules)) {
    const inst = runNpm('rag:install');
    console.log(`rag:install exit ${inst.code}`);
    if (inst.code !== 0) blockers.push({ stage: 'rag:install', detail: inst.stderr.slice(0, 500) });
  }

  const mig = tryMigrationAuto();
  console.log('\nMigration auto-attempt:');
  for (const a of mig.attempts) console.log(`  ${a}`);
  if (!mig.applied && missing.length) {
    console.log('\n[BLOCKED hint] Supabase DDL cannot run without CLI auth or DATABASE_URL.');
    console.log(`  Manual: Supabase SQL Editor → ${MIGRATION}`);
  }

  let schema = await verifySupabaseSchema();
  console.log('\nSupabase schema probe:');
  console.log(`  vector: ${schema.vector}`);
  console.log(`  rag_chunks: ${schema.rag_chunks}`);
  console.log(`  rag_match: ${schema.rag_match}`);
  if (schema.reason) console.log(`  note: ${schema.reason.slice(0, 200)}`);

  if (missing.length) {
    blockers.push({
      stage: 'M0 env',
      detail: `missing: ${missing.join(', ')}`
    });
  }
  if (!schema.ok && missing.length === 0) {
    blockers.push({
      stage: 'M0 Supabase schema',
      detail: schema.reason || 'rag_chunks or rag_match unavailable'
    });
  } else if (!schema.ok && missing.some(k => k.startsWith('SUPABASE'))) {
    blockers.push({
      stage: 'M0 Supabase schema',
      detail: 'cannot verify without real Supabase credentials'
    });
  }

  const local = localIndexStats();
  console.log('\nLocal index chunks:', local);

  let evalRecall = null;
  let queryOk = false;

  if (full && !missing.includes('DASHSCOPE_API_KEY')) {
    console.log('\n--full: embed world');
    const w = runNpm('rag:embed:world');
    console.log(w.stdout.slice(-800));
    if (w.code !== 0) blockers.push({ stage: 'rag:embed:world', detail: w.stderr.slice(0, 400) });

    console.log('\n--full: embed repo');
    const r = runNpm('rag:embed:repo');
    console.log(r.stdout.slice(-800));
    if (r.code !== 0) blockers.push({ stage: 'rag:embed:repo', detail: r.stderr.slice(0, 400) });

    console.log('\n--full: eval embedding');
    const e = runNpm('rag:eval:embedding');
    console.log(e.stdout);
    const m = e.stdout.match(/Recall@5[:\s]+(\d+(?:\.\d+)?%?)/i);
    if (m) evalRecall = m[1];
    if (e.code !== 0) blockers.push({ stage: 'rag:eval:embedding', detail: 'Recall@5 below 80% or script failed' });
  } else if (full) {
    console.log('\n--full skipped: missing API keys');
  }

  const queries = [
    '七年叙事里主角的关键转折是什么？',
    'Final 规则是什么？',
    'Fate 抽样为什么需要可复现？'
  ];
  let queryHits = 0;
  for (const q of queries) {
    const qrun = spawnSync('node', [join(RAG_KIT, 'scripts/query.mjs'), '--json', q], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: process.env
    });
    try {
      const parsed = JSON.parse(qrun.stdout);
      if (parsed.results?.length) queryHits += 1;
    } catch {
      /* no hit */
    }
  }
  queryOk = queryHits >= 1;
  console.log(`\nQuery smoke: ${queryHits}/${queries.length} returned hits (rules/local ok)`);

  const test = runNpm('test');
  const golden = runNpm('test:golden');
  const testPass = test.code === 0;
  const goldenOk = golden.code === 0;

  console.log(`\nDemo tests: exit ${test.code}`);
  console.log(`Golden eval: exit ${golden.code}`);

  const canM1 = blockers.length === 0 && testPass && goldenOk && schema.ok && evalRecall !== null;

  console.log('\n=== Summary ===');
  if (blockers.length) {
    console.log('[BLOCKED]');
    for (const b of blockers) console.log(`  stage: ${b.stage} — ${b.detail}`);
    console.log('\n需要人工操作:');
    if (missing.length) {
      console.log('  1. 编辑 shadow-corpus/world/.env 填入真实 DASHSCOPE + SUPABASE 密钥');
    }
    if (!schema.ok) {
      console.log(`  2. 在 Supabase SQL Editor 执行: ${MIGRATION}`);
      console.log('  3. 验证: select extname from pg_extension where extname=\'vector\';');
    }
    console.log('  4. 重新运行: npm run rag:verify:m0 -- --full');
    process.exit(1);
  }

  if (!canM1) {
    console.log('[BLOCKED]');
    console.log('  M0 vector pipeline incomplete — run with real keys: npm run rag:verify:m0 -- --full');
    process.exit(1);
  }

  console.log('[DONE] M0 RAG 验收通过');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
