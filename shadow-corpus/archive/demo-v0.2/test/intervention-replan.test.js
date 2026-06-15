'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createQueueRuntime } = require('../lib/llm-runtime');
const { runInterventionReplan } = require('../lib/agents');
const { buildInterventionReplanPrompt, buildYearPrompt } = require('../lib/prompts');
const { normalizeUserIntervention } = require('../lib/story-session');
const { replanBeatsAfterIntervention } = require('../lib/beats-replan');

const persona = {
  name: '阿岚',
  core_traits: ['要强', '藏话'],
  soft_spots: ['把期待当成自己的想要'],
  decision_tendency: '总是在退路前再撑一次',
  growth_seed: '学会承认自己不想要'
};

const beats = [
  { year: 1, type: 'pivotal', seed: '复读班第一天' },
  { year: 2, type: 'quiet', seed: '成绩落下后沉默' },
  { year: 3, type: 'quiet', seed: '一个人吃饭' },
  { year: 4, type: 'pivotal', seed: '被推到台前' },
  { year: 5, type: 'quiet', seed: '开始失眠' },
  { year: 6, type: 'pivotal', seed: '复试被刷' },
  { year: 7, type: 'quiet', seed: '邮局窗口' }
];

test('normalizeUserIntervention maps year → from_year and fills question from pivotal year', () => {
  const session = {
    years: [{
      year: 1,
      intervention_prompt: { question: '告诉父母吗？', options: ['告诉', '不说'] }
    }]
  };
  const iv = normalizeUserIntervention({ year: 1, choice: '不说', option_index: 1 }, session);
  assert.equal(iv.from_year, 1);
  assert.equal(iv.choice, '不说');
  assert.equal(iv.question, '告诉父母吗？');
});

test('replanBeatsAfterIntervention diverges seeds for different choices', () => {
  const interventionA = { from_year: 1, choice: '打电话告诉父母' };
  const interventionB = { from_year: 1, choice: '自己消化' };
  const replanA = replanBeatsAfterIntervention({ beats, pivotal_years: [1, 4, 6], intervention: interventionA });
  const replanB = replanBeatsAfterIntervention({ beats, pivotal_years: [1, 4, 6], intervention: interventionB });
  assert.notEqual(replanA.beats[1].seed, replanB.beats[1].seed);
});

test('buildInterventionReplanPrompt includes intervention_history', () => {
  const { prompt } = buildInterventionReplanPrompt({
    persona_card: persona,
    beats,
    pivotal_years: [1, 4, 6],
    intervention: { from_year: 1, choice: '告诉', question: '告诉父母吗？' },
    intervention_history: [
      { from_year: 1, choice: '告诉', question: '告诉父母吗？' }
    ]
  });
  assert.match(prompt, /历史介入/);
  assert.match(prompt, /年1：「告诉」/);
});

test('buildYearPrompt threads intervention_history and causal block', () => {
  const { prompt } = buildYearPrompt({
    persona_card: persona,
    memory_stream: [],
    current_mood: 5,
    current_esteem: 5,
    year_n: 2,
    age: 19,
    beat_type: 'quiet',
    beat_seed: '成绩落下后沉默',
    user_intervention: { from_year: 1, choice: '告诉', question: '告诉父母吗？' },
    intervention_history: [{ from_year: 1, choice: '告诉', question: '告诉父母吗？' }],
    full_beats: beats,
    pivotal_years: [1, 4, 6]
  });
  assert.match(prompt, /介入因果/);
  assert.match(prompt, /年1：「告诉」/);
});

test('runInterventionReplan uses LLM output when runtime is live-like', async () => {
  const replannedBeats = beats.map((b, i) => (
    i === 0 ? b : { ...b, seed: `LLM修订：${b.seed}` }
  ));
  const runtime = createQueueRuntime([{
    beats: replannedBeats,
    pivotal_years: [1, 4, 6]
  }]);

  const result = await runInterventionReplan({
    persona_card: persona,
    beats,
    pivotal_years: [1, 4, 6],
    intervention: { from_year: 1, choice: '告诉' },
    intervention_history: [],
    runtime
  });

  assert.equal(result.replanned, true);
  assert.equal(result.placeholder, false);
  assert.match(result.beats[1].seed, /LLM修订/);
});

test('runInterventionReplan falls back to rule-based when queue exhausted', async () => {
  const runtime = createQueueRuntime([]);
  const result = await runInterventionReplan({
    persona_card: persona,
    beats,
    pivotal_years: [1, 4, 6],
    intervention: { from_year: 1, choice: '自己消化' },
    intervention_history: [],
    runtime
  });
  assert.equal(result.replanned, true);
  assert.equal(result.placeholder, true);
  assert.match(result.beats[1].seed, /自己消化/);
});
