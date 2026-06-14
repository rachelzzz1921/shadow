'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeFateResult,
  fateContextToUiResult,
  askFatePlaceholder,
  askFateOnIntervention,
  FateResultSchema
} = require('../lib/fate-hook');
const { resolveFateContext } = require('../lib/fate-bridge');

const snippets = {
  '2019': { era_line: '2019年 · 测试语料' },
  '2020': { era_line: '2020年 · 测试语料' }
};

test('normalizeFateResult requires hint', () => {
  assert.throws(() => normalizeFateResult({ overlay: 'x' }));
});

test('fateContextToUiResult maps resolveFateContext output', async () => {
  const ctx = await resolveFateContext({
    runId: 't',
    profile: { choice: '复读', age: 18 },
    narrativeYear: 1,
    beatType: 'pivotal'
  });
  const ui = fateContextToUiResult(ctx);
  FateResultSchema.parse(ui);
  assert.equal(ui.calendar_year, 2019);
  assert.ok(ui.hint.includes('2019'));
});

test('askFatePlaceholder uses snippets map when provided', async () => {
  const out = await askFatePlaceholder({
    narrativeYear: 1,
    profile: { age: 18 },
    snippets
  });
  assert.equal(out.overlay, snippets['2019'].era_line);
  assert.equal(out._placeholder, true);
});

test('askFateOnIntervention appends choice to overlay', async () => {
  const out = await askFateOnIntervention({
    narrativeYear: 2,
    profile: { age: 18 },
    snippets,
    choice: '告诉父母'
  });
  assert.match(out.overlay || '', /告诉父母/);
});
