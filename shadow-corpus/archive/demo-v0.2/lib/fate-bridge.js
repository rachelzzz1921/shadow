'use strict';

/**
 * Bridge to @shadow/world fate sampling (ESM) for archive demo (CJS).
 * PLACEHOLDER: teammates refine weights + scenario domains.
 */

const path = require('node:path');
const fs = require('node:fs');

const WORLD_YEARS_DIR = path.join(__dirname, '../../../world/data/years');

/** @param {number} calendarYear */
function loadWorldYearPool(calendarYear) {
  const file = path.join(WORLD_YEARS_DIR, `${calendarYear}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Map narrative year → calendar year (复读线默认：年1≈2019）
 * @param {object} profile
 * @param {number} narrativeYear 1–7
 */
function calendarYearForNarrative(profile, narrativeYear) {
  const start = profile?.story_start_year || 2019;
  return start + narrativeYear - 1;
}

let sampleFateContextFn = null;

async function getSampler() {
  if (sampleFateContextFn) return sampleFateContextFn;
  const mod = await import('../../../world/lib/sample-fate.mjs');
  sampleFateContextFn = mod.sampleFateContext;
  return sampleFateContextFn;
}

/**
 * @param {object} p
 * @param {string} p.runId
 * @param {object} p.profile
 * @param {object} [p.persona_card]
 * @param {number} p.narrativeYear
 * @param {'pivotal'|'quiet'} p.beatType
 * @param {object[]} [p.priorInterventions]
 * @param {object} [p.full_profile]
 */
async function resolveFateContext({
  runId = 'local',
  profile,
  persona_card = null,
  full_profile = null,
  narrativeYear,
  beatType,
  priorInterventions = []
}) {
  const calendarYear = calendarYearForNarrative(profile, narrativeYear);
  const pool = loadWorldYearPool(calendarYear);
  if (!pool) {
    return {
      calendar_year: calendarYear,
      narrative_year: narrativeYear,
      era_line: `${calendarYear}年 · （world 语料未加载）`,
      placeholder: true
    };
  }

  const sample = await getSampler();
  const narrowedPool = await refinePool(pool, {
    runId,
    profile,
    persona_card,
    narrativeYear,
    beatType,
    priorInterventions,
    calendarYear
  });
  const ctx = await sample({
    runId,
    calendarYear,
    narrativeYear,
    beatType,
    pool: narrowedPool,
    profile,
    persona_card,
    priorInterventions,
    retrieval: 'none',
    intakeScenarioWeights: full_profile?.scenario_weights || null
  });
  return { ...ctx, placeholder: false, rag_refine: narrowedPool._rag_refine || null };
}

let refinePoolFn = null;

async function refinePool(pool, opts) {
  try {
    if (!refinePoolFn) {
      const rag = require('./rag-service');
      refinePoolFn = rag.refineWorldPoolForFate;
    }
    return await refinePoolFn(pool, opts);
  } catch (err) {
    console.warn('[fate-bridge] pool refine skipped:', err.message);
    return pool;
  }
}

function formatFateContextForPrompt(ctx) {
  if (!ctx) return '（无时代际遇层）';
  const lines = [
    `# 时代际遇层（Fate agent · 勿照抄，作背景压力）`,
    ctx.era_line || '',
    ctx.emphasis_line ? `侧重：${ctx.emphasis_line}` : null,
    ctx.macro_sample?.length
      ? '宏观：' + ctx.macro_sample.slice(0, 2).map(m => m.title).join('；')
      : null,
    ctx.micro_sample?.length
      ? '微观：' + ctx.micro_sample.slice(0, 2).map(m => m.text).join('；')
      : null
  ].filter(Boolean);
  return lines.join('\n');
}

module.exports = {
  loadWorldYearPool,
  calendarYearForNarrative,
  resolveFateContext,
  formatFateContextForPrompt
};
