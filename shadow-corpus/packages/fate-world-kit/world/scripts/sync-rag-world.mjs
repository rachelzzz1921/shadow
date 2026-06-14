#!/usr/bin/env node
'use strict';

/**
 * Post-merge RAG sync: validate corpus → embed-world → optional query smoke test.
 * Passes through embed-world flags: --dry-run, --no-embed
 */

import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORLD_ROOT = join(__dirname, '..');
const RAG_KIT = join(WORLD_ROOT, '../packages/rag-kit');

function run(cmd, args, cwd) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const passthrough = process.argv.slice(2).filter((a) => a !== '--skip-validate');

run('npm', ['run', 'validate'], WORLD_ROOT);

if (!passthrough.includes('--dry-run')) {
  run('npm', ['run', 'query', '--', '--status'], WORLD_ROOT);
}

run('node', ['scripts/embed-world.mjs', ...passthrough], RAG_KIT);

if (!passthrough.includes('--dry-run') && !passthrough.includes('--no-embed')) {
  console.log('\nRAG sync complete. Smoke test:');
  run('node', ['scripts/query.mjs', '新冠疫情', '--world', '--year', '2020', '--json'], RAG_KIT);
}

console.log('\nDone.');
