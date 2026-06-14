'use strict';

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  upsertLocalChunks,
  fetchLocalCandidates,
  getLocalIndexStats,
  clearLocalIndex
} from '../lib/local-index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_NS = 'test_ns';

test('local-index upsert and fetch with filters', () => {
  clearLocalIndex(FIXTURE_NS);
  upsertLocalChunks([
    {
      namespace: FIXTURE_NS,
      source_type: 'harness_doc',
      source_id: 'a',
      chunk_index: 0,
      content: 'memory_stream retrieval rules',
      metadata: { harness_stage: '03-coding', file_path: 'a.md' },
      corpus_version: 'test-v1'
    },
    {
      namespace: FIXTURE_NS,
      source_type: 'harness_doc',
      source_id: 'b',
      chunk_index: 0,
      content: 'fate agent sampling',
      metadata: { harness_stage: '02-technical-design', file_path: 'b.md' },
      corpus_version: 'test-v1'
    }
  ]);

  const hits = fetchLocalCandidates({
    namespace: FIXTURE_NS,
    filters: { harness_stage: '03-coding' },
    limit: 5
  });
  assert.equal(hits.length, 1);
  assert.match(hits[0].content, /memory_stream/);

  const stats = getLocalIndexStats();
  assert.ok(stats.namespaces[FIXTURE_NS].chunks >= 2);
  clearLocalIndex(FIXTURE_NS);
});
