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

const SCENARIO_DOMAINS = Object.keys(SCENE_FILES);

function topDomainFromWeights(weights) {
  if (!weights || typeof weights !== 'object') return null;
  const ranked = Object.entries(weights)
    .filter(([d]) => SCENARIO_DOMAINS.includes(d))
    .sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || null;
}

/**
 * @param {object|null|undefined} full_profile
 * @returns {{ primary: string, secondary: string|null, source: 'intake_weights'|'none' }}
 */
function resolveSceneFromFullProfile(full_profile) {
  const primary = topDomainFromWeights(full_profile?.scenario_weights);
  if (primary) {
    const ranked = Object.entries(full_profile.scenario_weights)
      .filter(([d]) => SCENARIO_DOMAINS.includes(d))
      .sort((a, b) => b[1] - a[1]);
    return {
      primary,
      secondary: ranked[1]?.[0] || null,
      source: 'intake_weights'
    };
  }
  return { primary: null, secondary: null, source: 'none' };
}

/**
 * @param {object|null|undefined} full_profile
 * @param {object} profile
 */
async function buildSceneYearSystemFromFullProfile(full_profile, profile) {
  const routed = resolveSceneFromFullProfile(full_profile);
  if (routed.primary) {
    return {
      scene: routed.primary,
      secondary: routed.secondary,
      source: routed.source,
      system: buildSceneAgentSystem(routed.primary)
    };
  }
  const scene = await resolveSceneFromProfile(profile);
  return {
    scene,
    secondary: null,
    source: 'classify',
    system: buildSceneAgentSystem(scene)
  };
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
    source: 'classify',
    system: buildSceneAgentSystem(scene)
  };
}

let classifyProfileFn = null;

module.exports = {
  PROMPTS_DIR,
  SCENE_FILES,
  loadBasePrompt,
  loadSceneRouterPrompt,
  loadOutputSchemaPrompt,
  loadScenePrompt,
  buildSceneAgentSystem,
  buildSceneYearSystem,
  buildSceneYearSystemFromFullProfile,
  resolveSceneFromProfile,
  resolveSceneFromFullProfile
};
