'use strict';

const { generateObject } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');
const { openai, createOpenAI } = require('@ai-sdk/openai');

function stepfunApiKey(env = process.env) {
  return env.STEPFUN_API_KEY || env.STEP_API_KEY || '';
}

function dashscopeApiKey(env = process.env) {
  return env.DASHSCOPE_API_KEY || '';
}

function pickProvider(env = process.env) {
  const forced = env.SHADOW_PROVIDER;
  if (forced === 'anthropic' && env.ANTHROPIC_API_KEY) return 'anthropic';
  if (forced === 'openai' && env.OPENAI_API_KEY) return 'openai';
  if (forced === 'stepfun' && stepfunApiKey(env)) return 'stepfun';
  if (forced === 'dashscope' && dashscopeApiKey(env)) return 'dashscope';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.OPENAI_API_KEY) return 'openai';
  if (dashscopeApiKey(env)) return 'dashscope';
  if (stepfunApiKey(env)) return 'stepfun';
  throw new Error(
    'No provider configured. Set ANTHROPIC_API_KEY, OPENAI_API_KEY, DASHSCOPE_API_KEY, or STEPFUN_API_KEY.'
  );
}

function pickModel(provider, env = process.env) {
  const override = env.SHADOW_MODEL;
  if (provider === 'stepfun') {
    const stepfun = createOpenAI({
      apiKey: stepfunApiKey(env),
      baseURL: env.STEPFUN_BASE_URL || 'https://api.stepfun.com/v1',
      name: 'stepfun'
    });
    const modelId = override || env.STEPFUN_MODEL || 'step-2-16k';
    return stepfun(modelId);
  }
  if (provider === 'dashscope') {
    const dashscope = createOpenAI({
      apiKey: dashscopeApiKey(env),
      baseURL: env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      name: 'dashscope'
    });
    const modelId = override || env.DASHSCOPE_MODEL || 'qwen-plus';
    return dashscope(modelId);
  }
  if (override) {
    return provider === 'anthropic' ? anthropic(override) : openai(override);
  }
  if (provider === 'anthropic') {
    return anthropic('claude-sonnet-4-5-20250929');
  }
  return openai('gpt-4o');
}

function createLiveRuntime({ env = process.env } = {}) {
  const provider = pickProvider(env);
  const model = pickModel(provider, env);
  return {
    provider,
    model,
    async generateStructured({ schema, system, prompt, temperature = 0.85 }) {
      const result = await generateObject({
        model,
        schema,
        system,
        prompt,
        temperature
      });
      return result.object;
    }
  };
}

function createQueueRuntime(outputs) {
  const queue = outputs.slice();
  return {
    provider: 'fake',
    model: 'fake',
    async generateStructured() {
      if (!queue.length) throw new Error('Fake runtime queue exhausted');
      return queue.shift();
    }
  };
}

module.exports = {
  createLiveRuntime,
  createQueueRuntime,
  pickProvider,
  pickModel,
  stepfunApiKey,
  dashscopeApiKey
};
