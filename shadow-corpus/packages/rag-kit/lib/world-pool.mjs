'use strict';

import { computeFateWeights } from '../../../world/lib/fate-weights.mjs';
import { inferScenario } from '../../../world/lib/scenario-domains.mjs';
import { overlapScore } from './score-rules.mjs';

/**
 * Build a retrieval query from profile + persona for Fate pool refinement.
 */
export function buildFateQuery({ profile, persona_card, priorInterventions = [] }) {
  const parts = [
    profile?.choice,
    profile?.scenario_label,
    profile?.description,
    ...(profile?.keywords || []),
    persona_card?.growth_seed,
    persona_card?.decision_tendency,
    ...(persona_card?.core_traits || []),
    ...(priorInterventions || []).map(i => i?.choice).filter(Boolean)
  ];
  return parts.filter(Boolean).join(' ').trim();
}

/**
 * Rule-based local pre-filter on world year pool before deterministic sampling.
 * Works without Supabase / embedding API.
 */
export function refineWorldPool(pool, opts) {
  const {
    profile = null,
    persona_card = null,
    narrativeYear = 1,
    beatType = 'quiet',
    priorInterventions = [],
    query: queryOverride = '',
    boostIds = []
  } = opts;

  if (!pool) return pool;

  const fateWeights = computeFateWeights({
    profile,
    persona_card,
    narrativeYear,
    beatType,
    priorInterventions
  });
  const scenarioWeights = fateWeights.weights;
  const query = queryOverride || buildFateQuery({ profile, persona_card, priorInterventions });
  const boost = new Set(boostIds);

  const scoreMacro = (item) => {
    const text = `${item.title || ''} ${item.detail || ''}`;
    const scenario = item.scenario || inferScenario(item);
    let s = overlapScore(query, text) * 0.45 + (Number(item.weight) || 1) * 0.25;
    s *= 0.5 + (scenarioWeights[scenario] || 0.1) * 1.5;
    if (boost.has(item.id) || boost.has(`macro:${item.title}`)) s += 0.2;
    return s;
  };

  const macroAll = [...(pool.macro_events || [])].sort((a, b) => scoreMacro(b) - scoreMacro(a));
  const macroKeep = Math.min(macroAll.length, Math.max(12, Math.ceil(macroAll.length * 0.35)));

  let microAll = [...(pool.micro_events || [])];
  if (beatType !== 'pivotal') {
    microAll = microAll.filter(m => !m.can_pivot || (Number(m.weight) || 1) < 0.85);
  }

  const scoreMicro = (item) => {
    const scenario = item.scenario || inferScenario(item);
    let s = overlapScore(query, item.text || '') * 0.45 + (Number(item.weight) || 1) * 0.25;
    s *= 0.5 + (scenarioWeights[scenario] || 0.1) * 1.5;
    if (beatType === 'pivotal' && item.can_pivot) s += 0.12;
    if (boost.has(item.id)) s += 0.2;
    return s;
  };

  microAll.sort((a, b) => scoreMicro(b) - scoreMicro(a));
  const microKeep = Math.min(microAll.length, Math.max(15, Math.ceil(microAll.length * 0.4)));

  return {
    ...pool,
    macro_events: macroAll.slice(0, macroKeep),
    micro_events: microAll.slice(0, microKeep),
    _rag_refine: {
      query: query.slice(0, 120),
      macro_before: pool.macro_events?.length || 0,
      macro_after: macroKeep,
      micro_before: pool.micro_events?.length || 0,
      micro_after: microKeep,
      scenario_primary: fateWeights.primary
    }
  };
}
