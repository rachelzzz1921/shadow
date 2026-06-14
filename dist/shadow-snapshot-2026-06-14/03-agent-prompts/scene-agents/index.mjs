'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIO_DOMAINS } from '../../../world/lib/scenario-domains.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, string>} */
const SCENE_FILE_MAP = {
  family: 'family.md',
  love: 'love.md',
  friendship: 'friendship.md',
  academic: 'academic.md',
  career: 'career.md',
  self_growth: 'self-growth.md'
};

const cache = new Map();

function readPromptFile(name) {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(__dirname, name);
  const text = fs.readFileSync(file, 'utf8').trim();
  cache.set(name, text);
  return text;
}

/** Base prompt — 平行人生推演总原则 */
export function loadBasePrompt() {
  return readPromptFile('base-prompt.md');
}

/** Scene Router system prompt */
export function loadSceneRouterPrompt() {
  return readPromptFile('scene-router.md');
}

/** Output JSON schema instructions */
export function loadOutputSchemaPrompt() {
  return readPromptFile('output-schema.md');
}

/**
 * @param {string} scene — one of SCENARIO_DOMAINS
 */
export function loadScenePrompt(scene) {
  const file = SCENE_FILE_MAP[scene];
  if (!file) {
    throw new Error(`Unknown scene: ${scene}. Expected one of ${SCENARIO_DOMAINS.join(', ')}`);
  }
  return readPromptFile(file);
}

/**
 * Compose Year-agent-style system string: base + scene lens.
 * @param {string} scene
 * @param {{ includeOutputSchema?: boolean }} [opts]
 */
export function buildSceneAgentSystem(scene, opts = {}) {
  const parts = [loadBasePrompt(), '', '---', '', loadScenePrompt(scene)];
  if (opts.includeOutputSchema) {
    parts.push('', '---', '', loadOutputSchemaPrompt());
  }
  return parts.join('\n');
}

/**
 * @param {object} profile
 * @param {string} scene
 */
export function buildSceneRouterUserPrompt(profile, scene) {
  const keywords = Array.isArray(profile?.keywords)
    ? profile.keywords.join('、')
    : profile?.keywords || '';
  return [
    '# 用户输入',
    `岔路口：${profile?.choice || '（未提供）'}`,
    profile?.mbti ? `MBTI：${profile.mbti}` : null,
    keywords ? `情绪关键词：${keywords}` : null,
    profile?.quote ? `核心语句：${profile.quote}` : null,
    profile?.description ? `自我描述：${profile.description}` : null,
    '',
    '# 规则路由参考（关键词分类，可与 LLM 路由交叉验证）',
    `classifyUserInput 建议域：${scene}`,
    '',
    '# 任务',
    '判断 primaryScene、secondaryTags、reason。只输出 JSON。'
  ]
    .filter(Boolean)
    .join('\n');
}

export { SCENARIO_DOMAINS, SCENE_FILE_MAP };
