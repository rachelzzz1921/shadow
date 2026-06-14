'use strict';

/**
 * CJS bridge → 03-coding/prompts/scene-agents/
 * 加载六场景 Agent 人工提示词，供 archive demo / 测试使用。
 */

const path = require('node:path');
const fs = require('node:fs');

const PROMPTS_DIR = path.join(__dirname, '../../../03-coding/prompts/scene-agents');

const SCENE_FILES = {
  family: 'family.md',
  love: 'love.md',
  friendship: 'friendship.md',
  academic: 'academic.md',
  career: 'career.md',
  self_growth: 'self-growth.md'
};

const _cache = new Map();

function readFile(name) {
  if (_cache.has(name)) return _cache.get(name);
  const text = fs.readFileSync(path.join(PROMPTS_DIR, name), 'utf8').trim();
  _cache.set(name, text);
  return text;
}

function loadBasePrompt() {
  return readFile('base-prompt.md');
}

function loadSceneRouterPrompt() {
  return readFile('scene-router.md');
}

function loadOutputSchemaPrompt() {
  return readFile('output-schema.md');
}

/** @param {keyof SCENE_FILES} scene */
function loadScenePrompt(scene) {
  const file = SCENE_FILES[scene];
  if (!file) throw new Error(`Unknown scene: ${scene}`);
  return readFile(file);
}

/**
 * @param {keyof SCENE_FILES} scene
 * @param {{ includeOutputSchema?: boolean }} [opts]
 */
function buildSceneAgentSystem(scene, opts = {}) {
  const parts = [loadBasePrompt(), '', '---', '', loadScenePrompt(scene)];
  if (opts.includeOutputSchema) {
    parts.push('', '---', '', loadOutputSchemaPrompt());
  }
  return parts.join('\n');
}

let classifyProfileFn = null;

async function resolveSceneFromProfile(profile) {
  if (!classifyProfileFn) {
    const mod = require('./scenario-classify');
    classifyProfileFn = mod.classifyProfile;
  }
  const result = await classifyProfileFn(profile);
  return result?.domain || result?.scenario_primary || 'self_growth';
}

/**
 * @param {object} profile
 * @param {string} [sceneOverride]
 */
async function buildSceneYearSystem(profile, sceneOverride) {
  const scene = sceneOverride || (await resolveSceneFromProfile(profile));
  return {
    scene,
    system: buildSceneAgentSystem(scene)
  };
}

module.exports = {
  PROMPTS_DIR,
  SCENE_FILES,
  loadBasePrompt,
  loadSceneRouterPrompt,
  loadOutputSchemaPrompt,
  loadScenePrompt,
  buildSceneAgentSystem,
  buildSceneYearSystem,
  resolveSceneFromProfile
};
