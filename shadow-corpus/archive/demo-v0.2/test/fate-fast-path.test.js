'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const fateBridge = require('../lib/fate-bridge');
const ragService = require('../lib/rag-service');

test('resolveFateContext fast mode skips RAG refineWorldPoolForFate', async () => {
  let ragCalled = false;
  const original = ragService.refineWorldPoolForFate;
  ragService.refineWorldPoolForFate = async (...args) => {
    ragCalled = true;
    return original(...args);
  };

  try {
    await fateBridge.resolveFateContext({
      runId: 'fast-path-test',
      profile: { choice: '测试', age: 18, story_start_year: 2019 },
      narrativeYear: 1,
      beatType: 'pivotal',
      generation_mode: 'fast'
    });
    assert.equal(ragCalled, false);
  } finally {
    ragService.refineWorldPoolForFate = original;
  }
});

test('resolveFateContext full mode may call RAG refine', async () => {
  let ragCalled = false;
  const original = ragService.refineWorldPoolForFate;
  ragService.refineWorldPoolForFate = async (pool, opts) => {
    ragCalled = true;
    return original(pool, opts);
  };

  try {
    await fateBridge.resolveFateContext({
      runId: 'full-path-test',
      profile: { choice: '测试', age: 18, story_start_year: 2019 },
      narrativeYear: 1,
      beatType: 'pivotal',
      generation_mode: 'full'
    });
    assert.equal(ragCalled, true);
  } finally {
    ragService.refineWorldPoolForFate = original;
  }
});
