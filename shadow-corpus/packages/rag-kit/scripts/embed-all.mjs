#!/usr/bin/env node
'use strict';

/**
 * Embed world + full repo into local index (and Supabase when configured).
 * Usage:
 *   node scripts/embed-all.mjs --world
 *   node scripts/embed-all.mjs --repo
 *   node scripts/embed-all.mjs --world --repo
 *   node scripts/embed-all.mjs --world --dry-run
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const flags = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const runWorld = flags.has('--world') || flags.size === 0;
const runRepo = flags.has('--repo') || flags.size === 0;

function run(script, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, script), ...extraArgs], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`))));
  });
}

async function main() {
  const passthrough = process.argv.slice(2).filter(a => !['--world', '--repo'].includes(a));
  if (runWorld) {
    console.log('\n=== embed world ===');
    await run('embed-world.mjs', passthrough);
  }
  if (runRepo) {
    console.log('\n=== embed repo ===');
    await run('embed-repo.mjs', passthrough);
  }
  console.log('\nDone. Local index: packages/rag-kit/data/local-index/');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
