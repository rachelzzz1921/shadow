'use strict';

/**
 * CJS bridge → world/lib/scenario-domains.mjs
 * 判断用户输入属于六类场景 Agent 的哪一域。
 */

let classifyUserInputFn = null;

async function getClassifier() {
  if (classifyUserInputFn) return classifyUserInputFn;
  const mod = await import('../../../world/lib/scenario-domains.mjs');
  classifyUserInputFn = mod.classifyUserInput;
  return classifyUserInputFn;
}

/**
 * @param {string} text
 * @param {object} [opts]
 * @param {string[]} [opts.keywords]
 * @param {string} [opts.description]
 */
async function classifyUserQuestion(text, opts = {}) {
  const classify = await getClassifier();
  return classify(text, opts);
}

/**
 * 从 profile 对象推断场景域（choice + keywords + description）
 * @param {object} profile
 */
async function classifyProfile(profile) {
  const keywords = Array.isArray(profile?.keywords)
    ? profile.keywords
    : String(profile?.keywords || '').split(/[、,，\s]+/).filter(Boolean);
  return classifyUserQuestion(profile?.choice || '', {
    keywords,
    description: profile?.description || ''
  });
}

module.exports = {
  classifyUserQuestion,
  classifyProfile
};
