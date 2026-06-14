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

test('dashscopeApiKey reads DASHSCOPE_API_KEY', () => {
  const { dashscopeApiKey, pickProvider } = require('../lib/llm-runtime');
  assert.equal(dashscopeApiKey({ DASHSCOPE_API_KEY: 'sk-test' }), 'sk-test');
  assert.equal(pickProvider({ DASHSCOPE_API_KEY: 'sk-test', SHADOW_PROVIDER: 'dashscope' }), 'dashscope');
});
