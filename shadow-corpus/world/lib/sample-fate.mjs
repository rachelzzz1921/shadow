'use strict';

import { inferScenario } from './scenario-domains.mjs';
import { computeFateWeights } from './fate-weights.mjs';
import { preparePoolForSampling } from './corpus-retrieval.mjs';

/** @param {string} str */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 按条目 weight × scenarioWeight 加权抽样
 */
function weightedSample(items, n, seed, scenarioWeights = null) {
  if (!items.length || n <= 0) return [];
  const rand = mulberry32(seed);
  const pool = items.map((it) => {
    const scenario = it.scenario || inferScenario(it);
    const scenarioMul = scenarioWeights?.[scenario] ?? 1;
    return { ...it, scenario, _eff: (it.weight || 1) * scenarioMul };
  });
  const out = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const total = pool.reduce((s, it) => s + it._eff, 0);
    let r = rand() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= pool[idx]._eff;
      if (r <= 0) break;
    }
    const pick = pool.splice(Math.min(idx, pool.length - 1), 1)[0];
    out.push(pick);
  }
  return out;
}

/**
 * @param {object} p
 * @param {string} p.runId
 * @param {number} p.calendarYear
 * @param {number} p.narrativeYear
 * @param {'pivotal'|'quiet'} p.beatType
 * @param {object} p.pool
 * @param {object} [p.profile]
 * @param {object} [p.persona_card]
 * @param {object} [p.persona_card]
 * @param {object[]} [p.priorInterventions]
 * @param {'none'|'local'|'rules'|'hybrid'} [p.retrieval='none']
 */
export async function sampleFateContext({
  runId,
  calendarYear,
  narrativeYear,
  beatType,
  pool,
  profile = null,
  persona_card = null,
  priorInterventions = [],
  retrieval = 'none',
  intakeScenarioWeights = null
}) {
  const workingPool = await preparePoolForSampling(pool, retrieval, {
    profile,
    persona_card,
    narrativeYear,
    beatType,
    priorInterventions
  });

  const baseSeed = hashString(`${runId}:${calendarYear}:${narrativeYear}`);
  const macroN = beatType === 'pivotal' ? 10 : 6;
  const microN = beatType === 'pivotal' ? 5 : 3;

  const fateWeights = computeFateWeights({
    profile,
    persona_card,
    narrativeYear,
    beatType,
    priorInterventions,
    intakeScenarioWeights
  });

  let microPool = workingPool.micro_events || [];
  if (beatType !== 'pivotal') {
    microPool = microPool.filter((m) => !m.can_pivot || (m.weight || 1) < 0.85);
  }

  const macro_sample = weightedSample(
    workingPool.macro_events || [],
    macroN,
    baseSeed,
    fateWeights.weights
  );
  const micro_sample = weightedSample(
    microPool,
    microN,
    baseSeed + 1,
    fateWeights.weights
  );

  const popRand = mulberry32(baseSeed + 2);
  const pop = [...(workingPool.pop_culture || [])]
    .sort(() => popRand() - 0.5)
    .slice(0, beatType === 'pivotal' ? 5 : 3);

  const era_line = [
    `${calendarYear}年`,
    fateWeights.emphasis_line,
    macro_sample[0]?.title,
    micro_sample[0]?.text
  ].filter(Boolean).join(' · ').slice(0, 120);

  return {
    calendar_year: calendarYear,
    narrative_year: narrativeYear,
    scenario_weights: fateWeights.weights,
    scenario_primary: fateWeights.primary,
    scenario_secondary: fateWeights.secondary,
    emphasis_line: fateWeights.emphasis_line,
    macro_sample: macro_sample.map(({ category, title, detail, source_url, scenario }) => ({
      category,
      title,
      detail,
      source_url,
      scenario
    })),
    micro_sample: micro_sample.map(({ text, can_pivot, category, scenario }) => ({
      text,
      can_pivot,
      category,
      scenario
    })),
    atmosphere_slice: workingPool.atmosphere || {},
    pop_culture_slice: pop,
    era_line
  };
}

export { computeFateWeights } from './fate-weights.mjs';
