'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyUserQuestion, classifyProfile } = require('../lib/scenario-classify');

test('classifyUserQuestion: 复读 → academic', async () => {
  const r = await classifyUserQuestion('如果当年我去复读了');
  assert.equal(r.domain, 'academic');
  assert.equal(r.label, '学业');
  assert.equal(r.agent, '学业 Agent');
  assert.ok(r.confidence >= 0);
});

test('classifyUserQuestion: 考公 → career', async () => {
  const r = await classifyUserQuestion('如果当年我留在老家考公');
  assert.equal(r.domain, 'career');
});

test('classifyUserQuestion: 分手复合 → love', async () => {
  const r = await classifyUserQuestion('如果当年我没有和前任复合');
  assert.equal(r.domain, 'love');
});

test('classifyUserQuestion: 父母期待 → family', async () => {
  const r = await classifyUserQuestion('如果当年我拒绝了父母的期待');
  assert.equal(r.domain, 'family');
});

test('classifyProfile merges keywords', async () => {
  const r = await classifyProfile({
    choice: '如果当年做了另一个选择',
    keywords: ['考研', '要强'],
    description: '我想知道另一条路'
  });
  assert.equal(r.domain, 'academic');
});

test('classifyUserQuestion returns six-domain weights', async () => {
  const r = await classifyUserQuestion('创业失败转行');
  assert.equal(r.scenario_primary, r.domain);
  assert.ok(r.scenario_weights.career > r.scenario_weights.love);
});
