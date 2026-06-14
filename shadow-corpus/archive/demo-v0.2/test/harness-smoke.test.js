'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createQueueRuntime } = require('../lib/llm-runtime');
const { createRunTrace } = require('../lib/run-trace');
const {
  startStorySession,
  generateNextYear,
  finishStorySession
} = require('../lib/story-session');

function year(n, overrides = {}) {
  return {
    year: n,
    age: 18 + n,
    is_pivotal: overrides.is_pivotal ?? n === 1,
    title: `第${n}年`,
    scene: 'rain',
    environment: 'classroom',
    pose: 'wait',
    prop: 'desk',
    city: 'city2',
    event: '你坐在最后一排，听见雨打在窗上。',
    decision_made: '继续撑下去',
    intervention_prompt: overrides.intervention_prompt ?? null,
    emotion: { label: '低落', value: 4 },
    new_mood: 4,
    new_esteem: 5,
    reflection: '我还是怕被看见。',
    shadow_dialogue: '你看，我还在这里。',
    memory_summary: `年${n}：坐在最后一排`
  };
}

function buildRuntime(yearCount = 2) {
  const queue = [
    {
      name: '阿岚',
      core_traits: ['要强'],
      soft_spots: ['期待'],
      decision_tendency: '再撑一次',
      growth_seed: '说够了'
    },
    {
      beats: Array.from({ length: 7 }, (_, i) => ({
        year: i + 1,
        type: [1, 4, 6].includes(i + 1) ? 'pivotal' : 'quiet',
        seed: `seed-${i + 1}`
      })),
      pivotal_years: [1, 4, 6]
    }
  ];

  for (let i = 1; i <= yearCount; i += 1) {
    queue.push(year(i, {
      is_pivotal: i === 1,
      intervention_prompt: i === 1
        ? { question: '告诉父母吗？', options: ['告诉', '不说'] }
        : null
    }));
  }

  queue.push({
    title: '七年',
    message: '我后来终于知道，安静不是失败，只是另一种活法。',
    regret: '没有早点说不想要。',
    scene: 'home',
    emotion_arc: '从紧绷到平稳'
  });

  return createQueueRuntime(queue);
}

test('harness smoke: trace records fate:sampled and replan on intervention', async () => {
  const runtime = buildRuntime(2);
  const trace = createRunTrace({ profile: { choice: '复读', age: 18 }, mode: 'smoke' });

  let session = await startStorySession({
    profile: { choice: '复读', age: 18 },
    runtime,
    trace
  });

  await generateNextYear({ session, runtime, trace });
  session = (await generateNextYear({
    session,
    runtime,
    trace,
    user_intervention: { from_year: 1, question: '告诉父母吗？', choice: '告诉' }
  })).session;

  const stages = trace.events.map(e => e.stage);
  assert.ok(stages.includes('fate:sampled'), stages.join(', '));
  assert.ok(stages.includes('beats:done'));
  assert.equal(trace.interventions.length, 1);

  const final = await finishStorySession({ session, runtime, trace });
  assert.ok(final.eval.ok);
  assert.ok(final.eval.score >= 70);
});
