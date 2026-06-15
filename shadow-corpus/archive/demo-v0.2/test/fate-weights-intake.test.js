'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFullProfile } = require('../lib/intake-profile');

const QUESTIONS = require('../public/data/intake-questions.json');

test('intake scenario_weights bias year0 fate primary toward academic', async () => {
  const full = buildFullProfile({
    layerA: {
      choice_text: '如果当年我去复读了',
      self_description: '我不甘心，又怕被看穿',
      birth_year: 2001,
      fork_year: 2019,
      age_at_fork: 18
    },
    selectedTags: [
      { category_id: 'trait', label: '要强' },
      { category_id: 'scenario_hint', label: '学业' }
    ],
    questionAnswers: [
      { question_id: 'SH-Q06', answer: { value: 85 } },
      { question_id: 'SH-Q10', answer: { optionKey: 'A' } }
    ],
    questions: QUESTIONS,
    scenarioFromText: {
      domain: 'academic',
      label: '学业',
      scenario_weights: { academic: 0.4 }
    }
  });

  const { computeFateWeights } = await import('../../../world/lib/fate-weights.mjs');
  const result = computeFateWeights({
    profile: full.profile,
    persona_card: null,
    narrativeYear: 0,
    beatType: 'quiet',
    priorInterventions: [],
    intakeScenarioWeights: full.scenario_weights
  });

  assert.equal(result.primary, 'academic');
  assert.ok(result.rationale.includes('intake:scenario_weights'));
});
