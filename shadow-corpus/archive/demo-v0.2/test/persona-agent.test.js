'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createQueueRuntime } = require('../lib/llm-runtime');
const {
  personaToPersonaCard,
  runPersonaAnalyze,
  loadPersonaSystemPrompt
} = require('../lib/persona-agent');

test('loadPersonaSystemPrompt reads repo persona_agent_prompt.md', () => {
  const text = loadPersonaSystemPrompt();
  assert.match(text, /Persona agent/i);
  assert.match(text, /full_profile/i);
});

test('personaToPersonaCard maps shadow_name → name', () => {
  const card = personaToPersonaCard({
    shadow_name: '阿岚',
    core_traits: ['用尽全力地要强'],
    soft_spots: ['怕被看穿'],
    decision_tendency: '再赌一次',
    growth_seed: '学会停下',
    core_tension: '矛盾',
    defense_mechanism: 'overwork',
    value_hierarchy: ['面子'],
    voice_notes: '再撑一下',
    narrative_warnings: ['别鸡汤']
  });
  assert.equal(card.name, '阿岚');
  assert.equal(card._from_persona_agent, true);
});

test('runPersonaAnalyze uses LLM queue when runtime provided', async () => {
  const fakePersona = {
    shadow_name: '试岚',
    core_traits: ['试探', '要强', '藏话'],
    core_tension: '她想证明我行，又怕证明完仍不够。',
    soft_spots: ['怕被看穿，所以从不露怯，代价是没法松口气', '把期待当自己想要，代价是赢了也不快乐'],
    decision_tendency: '在再努力与承认之间结构性地选前者，因为承认等于承认自己不行。',
    defense_mechanism: 'overwork——用忙碌填满空隙',
    growth_seed: '也许有一天能停下来——也可能七年都不发生。',
    value_hierarchy: ['被认可', '面子', '（很靠后才是）自己真正想要什么'],
    voice_notes: '习惯说再撑一下',
    narrative_warnings: ['别让她轻易和解', '严禁鸡汤']
  };
  const runtime = createQueueRuntime([fakePersona]);
  const full_profile = {
    raw: {
      choice_text: '如果当年我去复读了',
      self_description: '不甘心',
      one_liner: '再撑一下',
      selected_tags: ['要强']
    },
    temporal: { birth_year: 1988, fork_year: 2006, age_at_fork: 18 },
    scenario_weights: { academic: 0.4, family: 0.3, love: 0.05, friendship: 0.05, career: 0.1, self_growth: 0.1 },
    persona_signals: { archetype: 'the_endurer' },
    baseline: { initial_mood: 4, initial_esteem: 4 },
    tension_flags: []
  };

  const result = await runPersonaAnalyze({
    full_profile,
    runtime,
    fallbackRuleBased: false
  });

  assert.equal(result.source, 'llm');
  assert.equal(result.persona.shadow_name, '试岚');
  assert.equal(result.persona_card.name, '试岚');
  assert.equal(result.profile.choice, '如果当年我去复读了');
});
