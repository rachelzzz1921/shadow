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
  const event = overrides.event || (
    `第 ${n} 年，你坐在教室最后一排，听见雨打在窗上，粉笔灰的味道混着潮气。\n\n`
    + '卷子上的红叉、窗外灰蒙蒙的天、同桌压低声音的议论，把这一年压得又慢又重。'
    + '你还没学会说「不想要」，但已经开始用沉默回答所有期待。'
    + '放学后天色总是先暗下来，你背着书包走过操场，路灯一盏盏亮起来，'
    + '像一串你暂时还不想承认的倒计时。夜里你反复想起岔路口那天说过的每一句话。'
  );
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
    event,
    decision_made: '继续撑下去',
    intervention_prompt: overrides.intervention_prompt ?? null,
    emotion: { label: '低落', value: 4 },
    new_mood: 4,
    new_esteem: 5,
    reflection: '我还是怕被看见。原来有些路只能自己走完，哪怕窗外一直下雨。',
    shadow_dialogue: '你看，我还在这里。那年雨声很大，你没听见我说想停下。',
    memory_summary: `年${n}：坐在最后一排`,
    visual_anchor: overrides.visual_anchor || `教室后排 · 第${n}年 · 雨窗`,
    key_props: overrides.key_props || ['课桌', '雨窗']
  };
}

function buildRuntime(yearCount = 2, { withReplanQueue = true } = {}) {
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
    if (i === 1 && yearCount > 1 && withReplanQueue) {
      queue.push({
        beats: Array.from({ length: 7 }, (_, j) => ({
          year: j + 1,
          type: [1, 4, 6].includes(j + 1) ? 'pivotal' : 'quiet',
          seed: `seed-${j + 1}-replan`
        })),
        pivotal_years: [1, 4, 6]
      });
    }
  }

  if (yearCount >= 2) {
    const idx = queue.findIndex((item) => item?.year === 2);
    if (idx >= 0) {
      queue[idx] = year(2, {
        is_pivotal: false,
        event:
          '你告诉父母那晚，电话那头沉默了很久，只有呼吸声贴着听筒。\n\n'
          + '母亲没说支持也没说反对，只问了一句「你想清楚了吗」，父亲在旁边咳了一声。'
          + '第二天你照常去教室，但心里知道有些事已经说出口，再也收不回去。'
          + '课间你盯着窗外，雨又下了，同桌问你昨晚睡得好吗，你点点头，'
          + '把那句「告诉」在心里又默念了一遍，像按住一枚还没结痂的伤口，雨声又盖过来。'
      });
    }
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
    trace,
    generation_mode: 'full'
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

test('harness smoke: full 7 years with intervention passes eval', async () => {
  const runtime = buildRuntime(7, { withReplanQueue: false });
  const trace = createRunTrace({ profile: { choice: '复读', age: 18 }, mode: 'smoke-full' });
  const { evaluateStory } = require('../lib/evaluator');

  let session = await startStorySession({
    profile: { choice: '复读', age: 18 },
    runtime,
    trace,
    generation_mode: 'fast'
  });

  for (let i = 0; i < 7; i += 1) {
    const intervention = i === 1
      ? { from_year: 1, question: '告诉父母吗？', choice: '告诉' }
      : null;
    session = (await generateNextYear({
      session,
      runtime,
      trace,
      user_intervention: intervention
    })).session;
  }

  const fin = await finishStorySession({ session, runtime, trace });
  const evalResult = evaluateStory(fin.session);
  assert.equal(evalResult.errors.length, 0, JSON.stringify(evalResult.errors));
  assert.ok(evalResult.ok);
  assert.ok(fin.session.years.length === 7);
});
