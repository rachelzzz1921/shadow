'use strict';

const SCENARIO_DOMAINS = [
  'family',
  'love',
  'friendship',
  'academic',
  'career',
  'self_growth'
];

function findOption(question, key) {
  return (question?.options || []).find((o) => o.key === key);
}

/**
 * Apply declarative maps_to from a selected option onto accumulators.
 * @param {object|null} mapsTo
 * @param {{ scenarioRaw: object, personaSignals: object }} acc
 */
function applyMapsTo(mapsTo, acc) {
  if (!mapsTo || typeof mapsTo !== 'object') return;
  for (const [key, value] of Object.entries(mapsTo)) {
    if (key.startsWith('scenario_weights.')) {
      const domain = key.split('.')[1];
      if (SCENARIO_DOMAINS.includes(domain)) {
        acc.scenarioRaw[domain] = (acc.scenarioRaw[domain] || 0) + (Number(value) || 0);
      }
      continue;
    }
    if (key === 'archetype' && value) {
      acc.personaSignals.archetype = value;
    }
    if (key === 'defense_mechanism' && value) {
      acc.personaSignals.defense_mechanism = acc.personaSignals.defense_mechanism
        ? `${acc.personaSignals.defense_mechanism} + ${value}`
        : String(value);
    }
    if (key.startsWith('core_traits.') || key === 'core_traits') {
      const traits = Array.isArray(value) ? value : [value];
      for (const t of traits) {
        if (t) acc.personaSignals.core_traits.add(t);
      }
    }
  }
}

/**
 * Walk all question answers and fold maps_to into accumulators.
 */
function reduceMapsFromAnswers(questionAnswers, questionsById) {
  const acc = {
    scenarioRaw: Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, 0])),
    personaSignals: {
      archetype: null,
      defense_mechanism: null,
      core_traits: new Set()
    }
  };

  for (const ans of questionAnswers || []) {
    const q = questionsById[ans.question_id || ans.q_id];
    if (!q) continue;
    let opt;
    if (ans.answer?.optionKey) opt = findOption(q, ans.answer.optionKey);
    if (ans.answer?.orderedKeys?.length && q.kind === 'rank') {
      opt = findOption(q, ans.answer.orderedKeys[0]);
    }
    if (opt?.maps_to) applyMapsTo(opt.maps_to, acc);
  }

  return acc;
}

module.exports = {
  SCENARIO_DOMAINS,
  applyMapsTo,
  reduceMapsFromAnswers,
  findOption
};
