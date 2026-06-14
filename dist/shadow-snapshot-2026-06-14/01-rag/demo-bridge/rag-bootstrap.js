'use strict';

const path = require('node:path');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

const REPO_ROOT = path.join(__dirname, '../../../..');
const LOCAL_INDEX_DIR = path.join(__dirname, '../../../packages/rag-kit/data/local-index');

let started = false;

function hasNamespaceIndex(namespace) {
  try {
    const file = path.join(LOCAL_INDEX_DIR, `${namespace}.json`);
    return fs.existsSync(file) && fs.statSync(file).size > 4;
  } catch {
    return false;
  }
}

/**
 * On demo server start: log RAG status; build local index in background if missing.
 */
function bootstrapRag() {
  if (started) return;
  started = true;
  if (process.env.RAG_ENABLED === 'false') {
    console.log('[rag] disabled (RAG_ENABLED=false)');
    return;
  }

  void (async () => {
    try {
      const { getRagStatus } = require('./rag-service');
      const status = await getRagStatus();
      const chunks = status.local_index?.total_chunks ?? 0;
      console.log(
        `[rag] enabled · mode=${status.embed_configured ? 'embed-capable' : 'rules-index'} · local_chunks=${chunks}`
      );

      const missing = ['world', 'harness'].filter(ns => !hasNamespaceIndex(ns));
      if (missing.length) {
        console.log(`[rag] missing index: ${missing.join(', ')} — building in background (npm run rag:embed:local)`);
        const child = spawn('npm', ['run', 'rag:embed:local'], {
          cwd: REPO_ROOT,
          stdio: 'ignore',
          detached: true,
          env: process.env
        });
        child.unref();
      }
    } catch (err) {
      console.warn('[rag] bootstrap:', err.message);
    }
  })();
}

module.exports = { bootstrapRag, hasNamespaceIndex };
