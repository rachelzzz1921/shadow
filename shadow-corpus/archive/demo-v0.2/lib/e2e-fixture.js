'use strict';

const { createQueueRuntime } = require('./llm-runtime');

const E2E_INTERVENTION = {
  question: 'E2E：你要告诉父母这个决定吗？',
  options: ['告诉', '不说']
};

function e2eYear(n, overrides = {}) {
  const pivotal = overrides.is_pivotal ?? n === 1;
  return {
    year: n,
    age: 18 + n,
    is_pivotal: pivotal,
    title: `E2E第${n}年`,
    scene: n >= 5 ? 'night' : 'rain',
    environment: n === 4 ? 'stage' : 'classroom',
    pose: 'wait',
    prop: 'desk',
    city: 'city2',
    event: pivotal
      ? `第${n}年，你站在岔路口。雨还在下，你选了继续走。教室里的灯一盏盏灭掉，你背着书包穿过走廊，听见自己的心跳比雨声还响。`
      : `第${n}年，日子像一层灰。你照常上课、吃饭、睡觉，把不想说的话咽回肚子里，窗外天色总是先暗下来。`,
    decision_made: '继续走',
    intervention_prompt: overrides.intervention_prompt ?? (
      n === 1 ? E2E_INTERVENTION : null
    ),
    emotion: { label: '低', value: 4 },
    new_mood: 4,
    new_esteem: 5,
    reflection: '还在这里。',
    shadow_dialogue: '影子还在。',
    memory_summary: `年${n}：E2E`,
    visual_anchor: `E2E · 第${n}年`,
    key_props: ['课桌']
  };
}

function buildE2eProfile() {
  return {
    choice: '如果当年我没有选择复读',
    age: 18,
    keywords: ['接受不完美', '往前走'],
    quote: 'E2E 测试岔路口',
    description: 'E2E fixture profile'
  };
}

function buildE2ePersonaCard() {
  return {
    name: '阿岚',
    core_traits: ['要强', '学会放下'],
    soft_spots: ['期待'],
    decision_tendency: '继续走',
    growth_seed: '够了'
  };
}

function buildE2eJobPayload() {
  return {
    profile: buildE2eProfile(),
    persona_card: buildE2ePersonaCard(),
    generation_mode: 'fast'
  };
}

/** Deterministic queue: beats + 7 years + final (persona skipped when card provided). */
function buildE2eRuntime() {
  const queue = [
    {
      beats: Array.from({ length: 7 }, (_, i) => ({
        year: i + 1,
        type: [1, 4, 6].includes(i + 1) ? 'pivotal' : 'quiet',
        seed: `e2e-${i + 1}`
      })),
      pivotal_years: [1, 4, 6]
    }
  ];

  for (let n = 1; n <= 7; n += 1) {
    queue.push(e2eYear(n));
  }

  queue.push({
    title: 'E2E 收束',
    message: '七年走完，影子还在这里。',
    regret: '没有早点说不想。',
    scene: 'home',
    emotion_arc: '从紧绷到平稳'
  });

  return createQueueRuntime(queue);
}

module.exports = {
  E2E_INTERVENTION,
  buildE2eProfile,
  buildE2ePersonaCard,
  buildE2eJobPayload,
  buildE2eRuntime
};
