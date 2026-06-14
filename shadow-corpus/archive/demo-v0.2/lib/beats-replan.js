'use strict';

/**
 * Intervention re-plan — PLACEHOLDER (T-016).
 * Rule-based seed nudge for beats AFTER intervention year.
 * Teammate replaces with LLM via buildInterventionReplanPrompt.
 */

const MAX_SEED_LEN = 40;

function truncateSeed(s) {
  const t = String(s || '').trim();
  return t.length <= MAX_SEED_LEN ? t : t.slice(0, MAX_SEED_LEN - 1) + '…';
}

/**
 * @param {object} p
 * @param {object[]} p.beats
 * @param {number[]} p.pivotal_years
 * @param {{ from_year: number, choice: string, question?: string }} p.intervention
 */
function replanBeatsAfterIntervention({ beats, pivotal_years, intervention }) {
  if (!intervention?.from_year || !intervention?.choice) {
    return { beats, pivotal_years, replanned: false, placeholder: true };
  }

  const fromYear = intervention.from_year;
  const tag = truncateSeed(intervention.choice);

  const nextBeats = beats.map((b) => {
    if (b.year <= fromYear) return { ...b };
    const seed = truncateSeed(`[${tag}] ${b.seed}`);
    return { ...b, seed };
  });

  return {
    beats: nextBeats,
    pivotal_years: [...(pivotal_years || [])],
    replanned: true,
    placeholder: true,
    note: 'Rule-based placeholder — replace with LLM re-plan (T-016)'
  };
}

module.exports = {
  replanBeatsAfterIntervention,
  truncateSeed
};
