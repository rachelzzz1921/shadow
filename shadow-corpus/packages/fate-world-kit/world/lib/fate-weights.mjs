'use strict';

import {
  SCENARIO_DOMAINS,
  SCENARIO_LABELS,
  SCENARIO_BRIEFS,
  KEYWORD_SCENARIO,
  normalizeWeights,
  topDomains,
  uniformWeights
} from './scenario-domains.mjs';

const FORK_YEAR0_BOOST = {
  family: 0.08,
  academic: 0.12,
  self_growth: 0.1,
  career: 0.05
};

const NARRATIVE_YEAR_NUDGE = {
  0: { academic: 0.15, family: 0.1, self_growth: 0.08 },
  1: { academic: 0.08, friendship: 0.06 },
  2: { friendship: 0.08, self_growth: 0.05 },
  3: { career: 0.08, love: 0.05 },
  4: { career: 0.1, self_growth: 0.08 },
  5: { family: 0.06, love: 0.06 },
  6: { career: 0.1, academic: 0.06 },
  7: { self_growth: 0.12, family: 0.06 }
};

function addBoost(raw, domain, amount) {
  if (!SCENARIO_DOMAINS.includes(domain)) return;
  raw[domain] = (raw[domain] || 0) + amount;
}

function scanText(text, raw) {
  if (!text) return;
  for (const { re, domain, boost } of KEYWORD_SCENARIO) {
    if (re.test(text)) addBoost(raw, domain, boost);
  }
}

function fromPersona(persona_card, raw) {
  if (!persona_card) return;
  const blob = [
    ...(persona_card.soft_spots || []),
    persona_card.decision_tendency,
    persona_card.growth_seed,
    ...(persona_card.core_traits || [])
  ].filter(Boolean).join(' ');
  scanText(blob, raw);

  // soft_spots 通常指向 self_growth + 一个关系域
  if ((persona_card.soft_spots || []).length) {
    addBoost(raw, 'self_growth', 0.15);
  }
}

function fromProfile(profile, raw) {
  if (!profile) return;
  scanText(profile.choice, raw);
  const keywords = Array.isArray(profile.keywords)
    ? profile.keywords.join('、')
    : String(profile.keywords || '');
  scanText(keywords, raw);
  if (profile.quote) scanText(profile.quote, raw);
  if (profile.description) scanText(profile.description, raw);
}

function fromInterventions(interventions, raw) {
  for (const iv of interventions || []) {
    scanText(iv?.choice || iv?.label || iv?.text || '', raw);
  }
}

function applyNudge(raw, nudgeMap) {
  for (const [domain, amt] of Object.entries(nudgeMap || {})) {
    addBoost(raw, domain, amt);
  }
}

function sharpenForBeat(weights, beatType) {
  if (beatType !== 'pivotal') return weights;
  const ranked = topDomains(weights, 3);
  const out = { ...weights };
  for (const { domain } of ranked) {
    out[domain] *= 1.25;
  }
  return normalizeWeights(out);
}

/**
 * 计算本叙事年的六域命运侧重权重。
 *
 * @param {object} p
 * @param {object} [p.profile]
 * @param {object} [p.persona_card]
 * @param {number} p.narrativeYear 0..7
 * @param {'pivotal'|'quiet'} p.beatType
 * @param {object[]} [p.priorInterventions]
 * @returns {{ weights: Record<string,number>, primary: string, secondary: string, emphasis_line: string, rationale: string[] }}
 */
export function computeFateWeights({
  profile,
  persona_card,
  narrativeYear = 0,
  beatType = 'quiet',
  priorInterventions = []
}) {
  const raw = uniformWeights();
  const rationale = ['base:uniform'];

  fromProfile(profile, raw);
  rationale.push('profile:choice+keywords');
  fromPersona(persona_card, raw);
  rationale.push('persona:soft_spots+growth_seed');
  fromInterventions(priorInterventions, raw);
  if (priorInterventions.length) rationale.push('interventions:prior');

  if (narrativeYear === 0) {
    applyNudge(raw, FORK_YEAR0_BOOST);
    rationale.push('narrative:year0_fork');
  }
  applyNudge(raw, NARRATIVE_YEAR_NUDGE[narrativeYear]);
  rationale.push(`narrative:year${narrativeYear}`);

  let weights = normalizeWeights(raw);
  weights = sharpenForBeat(weights, beatType);
  if (beatType === 'pivotal') rationale.push('beat:pivotal_sharpen_top3');

  const [primary, secondary] = topDomains(weights, 2);
  const emphasis_line = `本年命运侧重：${primary.label}（${Math.round(primary.weight * 100)}%）· ${secondary.label}（${Math.round(secondary.weight * 100)}%）`;

  return {
    weights,
    primary: primary.domain,
    secondary: secondary.domain,
    emphasis_line,
    rationale,
    domain_briefs: SCENARIO_BRIEFS
  };
}

export { SCENARIO_LABELS, SCENARIO_BRIEFS, topDomains };
