'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');

const golden = require('../../../fixtures/golden-stories/复读线.json');
const {
  refineWorldPoolForFate,
  buildDialogueContext,
  queryRag,
  getRagStatus
} = require('../lib/rag-service');
const { loadWorldYearPool, resolveFateContext } = require('../lib/fate-bridge');

test('refineWorldPoolForFate narrows pool without Supabase', async () => {
  const pool = loadWorldYearPool(2019);
  assert.ok(pool);
  const before = pool.macro_events.length;
  const narrowed = await refineWorldPoolForFate(pool, {
    profile: { choice: '复读', keywords: ['高考', '准考证'] },
    persona_card: golden.persona_card,
    narrativeYear: 1,
    beatType: 'pivotal',
    priorInterventions: [],
    calendarYear: 2019,
    runId: 'test-run'
  });
  assert.ok(narrowed.macro_events.length < before);
  assert.ok(narrowed._rag_refine?.macro_after <= narrowed.macro_events.length);
});

test('resolveFateContext stays reproducible with same runId after refine', async () => {
  const profile = golden.profile;
  const opts = {
    runId: 'repro-run-1',
    profile,
    persona_card: golden.persona_card,
    narrativeYear: 2,
    beatType: 'quiet',
    priorInterventions: []
  };
  const a = await resolveFateContext(opts);
  const b = await resolveFateContext(opts);
  assert.equal(a.era_line, b.era_line);
  assert.deepEqual(
    a.macro_sample.map(m => m.title),
    b.macro_sample.map(m => m.title)
  );
});

test('buildDialogueContext returns memory and optional era citations', async () => {
  const ctx = await buildDialogueContext({
    memory_stream: golden.memory_stream,
    years: golden.years,
    user_question: '那年高考改革社会上怎么了',
    at_year: 4,
    run_id: 'dlg-test',
    profile: golden.profile,
    persona_card: golden.persona_card
  });
  assert.ok(ctx.memory_stream.length >= 1);
  assert.ok(golden.memory_stream.some(m => ctx.memory_stream.find(r => r.id === m.id)));
  assert.ok(Array.isArray(ctx.year_snippets));
  assert.ok(Array.isArray(ctx.era_citations));
});

test('buildDialogueContext picks tear-related memory for 撕准考证', async () => {
  const ctx = await buildDialogueContext({
    memory_stream: golden.memory_stream,
    years: golden.years,
    user_question: '撕准考证',
    at_year: 2,
    profile: golden.profile
  });
  const ids = ctx.memory_stream.map(m => m.id);
  assert.ok(ids.includes('m2') || ids.includes('m1'));
});

test('queryRag harness works offline with rules-local', async () => {
  const result = await queryRag({
    query: 'memory_stream Final Dialogue 检索',
    namespace: 'harness',
    limit: 3
  });
  assert.ok(
    ['rules-local', 'rules-index', 'hybrid'].includes(result.mode),
    `expected offline or hybrid rules mode, got ${result.mode}`
  );
  assert.ok(result.hits.length >= 1, `expected hits, got mode=${result.mode}`);
  if (['rules-local', 'rules-index', 'rules'].includes(result.mode)) {
    assert.ok(
      result.hits.some(h =>
        /memory|retriev|检索/i.test(h.content) || /memory/i.test(h.metadata?.file_path || '')
      )
    );
  }
});

test('getRagStatus returns config shape', async () => {
  const status = await getRagStatus();
  assert.equal(typeof status.enabled, 'boolean');
  assert.equal(typeof status.supabase, 'boolean');
  assert.equal(typeof status.embed_provider, 'string');
});
