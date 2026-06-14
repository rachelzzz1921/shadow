'use strict';

const { generateObject } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');
const { openai } = require('@ai-sdk/openai');

function pickProvider(env = process.env) {
  const forced = env.SHADOW_PROVIDER;
  if (forced === 'anthropic' && env.ANTHROPIC_API_KEY) return 'anthropic';
  if (forced === 'openai' && env.OPENAI_API_KEY) return 'openai';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.OPENAI_API_KEY) return 'openai';
  throw new Error('No provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
}

function pickModel(provider, env = process.env) {
  const override = env.SHADOW_MODEL;
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
  pickModel
};
