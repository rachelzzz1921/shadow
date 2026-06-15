'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFullProfile } = require('../lib/intake-profile');
const {
  buildBeatsPrompt,
  buildYearPrompt,
  formatPersonaCard,
  formatIntakeContext
} = require('../lib/prompts');

const QUESTIONS = require('../public/data/intake-questions.json');

function fuxuFixtureFullProfile() {
  return buildFullProfile({
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
  });
}

test('formatPersonaCard includes extended Persona agent fields', () => {
  const card = {
    name: '阿岚',
    core_traits: ['要强'],
    soft_spots: ['怕被看穿'],
    decision_tendency: '再努力一次',
    growth_seed: '学会停下',
    core_tension: '要强与脆弱之间的裂缝',
    defense_mechanism: 'overwork',
    voice_notes: '短句，不解释',
    narrative_warnings: '不要写成爽文'
  };
  const text = formatPersonaCard(card);
  assert.match(text, /核心张力/);
  assert.match(text, /防御机制/);
  assert.match(text, /说话方式/);
  assert.match(text, /叙事禁忌/);
});

test('formatIntakeContext surfaces weights tension and baseline', () => {
  const full = fuxuFixtureFullProfile();
  const ctx = formatIntakeContext(full);
  assert.match(ctx, /学业/);
  assert.match(ctx, /Intake 信号/);
  assert.match(ctx, /岔路口基线/);
});

test('buildBeatsPrompt injects intake context', () => {
  const full = fuxuFixtureFullProfile();
  const { prompt } = buildBeatsPrompt({
    persona_card: {
      name: '阿岚',
      core_traits: ['要强'],
      soft_spots: ['怕被看穿'],
      decision_tendency: '再努力一次',
      growth_seed: '学会停下',
      core_tension: '要强与脆弱'
    },
    profile: full.profile,
    full_profile: full
  });
  assert.match(prompt, /Intake 信号/);
  assert.match(prompt, /学业/);
  assert.match(prompt, /核心张力/);
});

test('buildYearPrompt injects intake context', () => {
  const full = fuxuFixtureFullProfile();
  const { prompt } = buildYearPrompt({
    persona_card: {
      name: '阿岚',
      core_traits: ['要强'],
      soft_spots: ['怕被看穿'],
      decision_tendency: '再努力一次',
      growth_seed: '学会停下'
    },
    memory_stream: [],
    current_mood: 4,
    current_esteem: 3,
    year_n: 1,
    age: 19,
    beat_type: 'quiet',
    beat_seed: '日子像复印件',
    user_intervention: null,
    full_beats: [{ year: 1, type: 'quiet', seed: '日子像复印件' }],
    pivotal_years: [],
    fate_context: null,
    full_profile: full
  });
  assert.match(prompt, /Intake 信号/);
  assert.match(prompt, /学业/);
});
