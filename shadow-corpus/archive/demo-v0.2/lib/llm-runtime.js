'use strict';

const { generateObject, generateText, streamObject } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');
const { openai, createOpenAI } = require('@ai-sdk/openai');

function stepfunApiKey(env = process.env) {
  return env.STEPFUN_API_KEY || env.STEP_API_KEY || '';
}

function dashscopeApiKey(env = process.env) {
  return env.DASHSCOPE_API_KEY || '';
}

function deepseekApiKey(env = process.env) {
  return env.DEEPSEEK_API_KEY || '';
}

function pickProvider(env = process.env) {
  const forced = env.SHADOW_PROVIDER;
  if (forced === 'anthropic' && env.ANTHROPIC_API_KEY) return 'anthropic';
  if (forced === 'openai' && env.OPENAI_API_KEY) return 'openai';
  if (forced === 'deepseek' && deepseekApiKey(env)) return 'deepseek';
  if (forced === 'stepfun' && stepfunApiKey(env)) return 'stepfun';
  if (forced === 'dashscope' && dashscopeApiKey(env)) return 'dashscope';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.OPENAI_API_KEY) return 'openai';
  if (deepseekApiKey(env)) return 'deepseek';
  if (dashscopeApiKey(env)) return 'dashscope';
  if (stepfunApiKey(env)) return 'stepfun';
  throw new Error(
    'No provider configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, DASHSCOPE_API_KEY, or STEPFUN_API_KEY.'
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
  if (provider === 'deepseek') {
    const deepseek = createOpenAI({
      apiKey: deepseekApiKey(env),
      baseURL: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      name: 'deepseek'
    });
    const modelId = override || env.DEEPSEEK_MODEL || 'deepseek-chat';
    return deepseek(modelId);
  }
  if (override) {
    return provider === 'anthropic' ? anthropic(override) : openai(override);
  }
  if (provider === 'anthropic') {
    return anthropic('claude-sonnet-4-5-20250929');
  }
  return openai('gpt-4o');
}

function extractJsonObject(text) {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const blob = fenced ? fenced[1].trim() : trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!blob) return null;
  try {
    return JSON.parse(blob);
  } catch {
    return null;
  }
}

function createLiveRuntime({ env = process.env } = {}) {
  const provider = pickProvider(env);
  const model = pickModel(provider, env);
  return {
    provider,
    model,
    async generateStructured({ schema, system, prompt, temperature = 0.85 }) {
      try {
        const result = await generateObject({
          model,
          schema,
          system,
          prompt,
          temperature
        });
        return result.object;
      } catch (primaryError) {
        const { text } = await generateText({
          model,
          system: `${system}\n\n你必须只输出一个 JSON 对象，不要 markdown 代码块。字符串内不要用英文双引号，用中文「」。`,
          prompt,
          temperature: Math.min(0.72, temperature)
        });
        const obj = extractJsonObject(text);
        if (!obj) throw primaryError;
        const parsed = schema.safeParse(obj);
        if (parsed.success) return parsed.data;
        throw primaryError;
      }
    },
    async streamStructured({ schema, system, prompt, temperature = 0.85, onPartial }) {
      try {
        const result = streamObject({
          model,
          schema,
          system,
          prompt,
          temperature
        });
        let last = null;
        for await (const partial of result.partialObjectStream) {
          last = partial;
          if (typeof onPartial === 'function') onPartial(partial);
        }
        return (await result.object) || last;
      } catch (primaryError) {
        return this.generateStructured({ schema, system, prompt, temperature });
      }
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
  dashscopeApiKey,
  deepseekApiKey
};
