'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFullProfile } = require('../../../packages/intake-kit/lib/index.cjs');
const { buildFullProfile: buildFullProfileServer } = require('../lib/intake-profile');

const QUESTIONS = require('../public/data/intake-questions.json');

const FIXTURE = {
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
  scenarioFromText: {
    domain: 'academic',
    label: '学业',
    scenario_primary: 'academic',
    scenario_weights: { academic: 0.4 }
  }
};

test('intake-kit parity: server re-export matches kit buildFullProfile', () => {
  const kit = buildFullProfile(FIXTURE);
  const server = buildFullProfileServer(FIXTURE);
  assert.deepEqual(server.scenario_weights, kit.scenario_weights);
  assert.equal(server.meta.schema_version, 1);
  assert.equal(typeof server.raw.selected_tags[0], 'object');
  assert.equal(server.raw.selected_tags[0].category_id, 'trait');
});

test('intake-kit: schema_version and structured tags', () => {
  const full = buildFullProfile(FIXTURE);
  assert.equal(full.meta.schema_version, 1);
  assert.ok(full.profile.scenario_domain);
  assert.ok(full.profile.selected_tags?.length);
});
