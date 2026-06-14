#!/usr/bin/env node
'use strict';

import { loadEnv } from '../lib/config.mjs';
import { retrieve } from '../lib/retrieve.mjs';

loadEnv();

const argv = process.argv.slice(2);
const jsonOut = argv.includes('--json');
const filtered = argv.filter(a => a !== '--json');
const namespace = filtered.includes('--world')
  ? 'world'
  : filtered.includes('--trace')
    ? 'trace'
    : 'harness';
const query = filtered.filter(a => !a.startsWith('--')).join(' ').trim();

if (!query) {
  console.error('Usage: npm run rag:query -- "your question" [--world] [--json]');
  process.exit(1);
}

const filters = {};
const yearIdx = filtered.indexOf('--year');
if (yearIdx >= 0 && filtered[yearIdx + 1]) {
  filters.calendar_year = filtered[yearIdx + 1];
}

const results = await retrieve({
  namespace,
  query,
  filters,
  limit: 6,
  strategy: 'hybrid'
});

const payload = {
  query,
  namespace,
  results: results.map(r => {
    const meta = r.metadata || {};
    return {
      score: r.score ?? 0,
      source_url: meta.source_url || null,
      source_path: meta.file_path || meta.source_id || null,
      chunk_id: r.id || `${r.source_id}:${r.chunk_index ?? 0}`,
      text_preview: (r.content || '').slice(0, 280)
    };
  })
};

if (jsonOut || process.env.RAG_QUERY_JSON === '1') {
  console.log(JSON.stringify(payload, null, 2));
} else if (!results.length) {
  console.log('No results — check RAG_ENABLED, Supabase, and run embed scripts first.');
  console.log(JSON.stringify(payload, null, 2));
} else {
  for (const [i, r] of results.entries()) {
    const meta = r.metadata || {};
    console.log(`\n--- #${i + 1} score=${r.score?.toFixed(3)} ---`);
    if (meta.file_path) console.log(`file: ${meta.file_path}`);
    if (meta.heading) console.log(`heading: ${meta.heading}`);
    if (meta.calendar_year) console.log(`year: ${meta.calendar_year}`);
    if (meta.source_url) console.log(`source: ${meta.source_url}`);
    console.log(r.content.slice(0, 500) + (r.content.length > 500 ? '…' : ''));
  }
  console.log('\n--- json ---');
  console.log(JSON.stringify(payload, null, 2));
}

process.exit(results.length ? 0 : 1);
