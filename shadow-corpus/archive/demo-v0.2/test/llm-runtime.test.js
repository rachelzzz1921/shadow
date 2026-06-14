'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { pickProvider, stepfunApiKey } = require('../lib/llm-runtime');

test('pickProvider selects stepfun when STEPFUN_API_KEY set', () => {
  const env = {
    STEPFUN_API_KEY: 'test-key',
    SHADOW_PROVIDER: 'stepfun'
  };
  assert.equal(pickProvider(env), 'stepfun');
});

test('stepfunApiKey accepts STEP_API_KEY alias', () => {
  assert.equal(stepfunApiKey({ STEP_API_KEY: 'x' }), 'x');
  assert.equal(stepfunApiKey({ STEPFUN_API_KEY: 'y' }), 'y');
});
