'use strict';

import { familyPool } from './family.mjs';
import { lovePool } from './love.mjs';
import { friendshipPool } from './friendship.mjs';
import { academicPool } from './academic.mjs';
import { careerPool } from './career.mjs';
import { selfGrowthPool } from './self-growth.mjs';
import { SCENARIO_DOMAINS } from '../scenario-domains.mjs';
import { dedupeByText } from '../helpers.mjs';

const POOLS = {
  family: familyPool,
  love: lovePool,
  friendship: friendshipPool,
  academic: academicPool,
  career: careerPool,
  self_growth: selfGrowthPool
};

/** 六域专属子池合并 */
export function expandScenarioMicros(year) {
  const all = [];
  for (const domain of SCENARIO_DOMAINS) {
    all.push(...POOLS[domain](year));
  }
  return dedupeByText(all);
}

/** 按域统计 */
export function countByScenario(micros) {
  const counts = Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, 0]));
  for (const m of micros) {
    if (counts[m.scenario] !== undefined) counts[m.scenario]++;
  }
  return counts;
}

export { POOLS };
