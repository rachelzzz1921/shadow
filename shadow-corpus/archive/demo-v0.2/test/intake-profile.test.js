'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFullProfile, buildShadowPreview } = require('../lib/intake-profile');

const QUESTIONS = require('../public/data/intake-questions.json');

test('buildShadowPreview mentions parents when tag selected', () => {
  const preview = buildShadowPreview(
    { self_description: '我习惯证明自己' },
    [{ category_id: 'trait', label: '要强' }, { category_id: 'relation_pressure', label: '父母期待' }]
  );
  assert.match(preview, /父母/);
  assert.match(preview, /还不确定/);
});

test('buildFullProfile: 复读线-like intake yields academic weight', () => {
  const full = buildFullProfile({
    layerA: {
      choice_text: '如果当年我去复读了',
      self_description: '我不甘心，又怕被看穿',
      one_liner: '再撑一下，撑过去就好了',
      birth_year: 2001,
      fork_year: 2019,
      age_at_fork: 18
    },
    selectedTags: [
      { category_id: 'trait', label: '要强' },
      { category_id: 'fear', label: '怕被看穿' },
      { category_id: 'scenario_hint', label: '学业' }
    ],
    questionAnswers: [
      { question_id: 'SH-Q01', answer: { optionKey: 'B' }, duration_ms: 3000 },
      { question_id: 'SH-Q02', answer: { value: 80 }, duration_ms: 5000 },
      { question_id: 'SH-Q05', answer: { optionKey: 'A' }, duration_ms: 2000 },
      { question_id: 'SH-Q06', answer: { value: 85 }, duration_ms: 9000 },
      { question_id: 'SH-Q10', answer: { optionKey: 'A' }, duration_ms: 4000 }
    ],
    questions: QUESTIONS,
    scenarioFromText: { domain: 'academic', label: '学业', scenario_primary: 'academic', scenario_weights: { academic: 0.4 } }
  });

  assert.ok(full.scenario_weights.academic > full.scenario_weights.love);
  assert.equal(full.profile.choice, '如果当年我去复读了');
  assert.ok(full.persona_signals.decision_tendency.includes('再努力一次'));
  assert.ok(full.persona_signals.soft_spots.length >= 1);
  assert.equal(full.baseline.initial_mood, 3);
  assert.equal(full.meta.schema_version, 1);
  assert.equal(full.raw.selected_tags[0].category_id, 'trait');
});

test('buildFullProfile detects self_report vs behavior tension', () => {
  const full = buildFullProfile({
    layerA: {
      choice_text: '如果当年我独自去了上海',
      self_description: '我很独立，不太在乎别人怎么看',
      birth_year: 1995,
      fork_year: 2017,
      age_at_fork: 22
    },
    selectedTags: [{ category_id: 'trait', label: '独立' }],
    questionAnswers: [
      { question_id: 'SH-Q04', answer: { optionKey: 'A' } },
      { question_id: 'SH-Q09', answer: { optionKey: 'B' } }
    ],
    questions: QUESTIONS
  });
  assert.equal(full.tension_flags.length, 1);
  assert.equal(full.tension_flags[0].type, 'self_report_vs_behavior');
});
