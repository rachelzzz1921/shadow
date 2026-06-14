'use strict';

const fs = require('node:fs');
const path = require('node:path');

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

/** Merge world + demo + repo .env (later files override placeholder secrets). */
function loadDemoEnv() {
  const candidates = [
    path.join(__dirname, '../../../world/.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '../../../.env'),
    path.join(__dirname, '../../../../.env')
  ];

  for (const envPath of candidates) {
    try {
      const text = fs.readFileSync(envPath, 'utf8');
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
      /* optional */
    }
  }
}

module.exports = { loadDemoEnv, isConfiguredSecret };
