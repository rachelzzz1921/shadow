'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Load archive/demo-v0.2/.env into process.env (no overwrite). */
function loadDemoEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* optional */
  }
}

module.exports = { loadDemoEnv };
