'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createQueueRuntime } = require('../lib/llm-runtime');
const { normalizeYear } = require('../lib/story-contract');
const {
  startStorySession,
  generateNextYear,
  finishStorySession
} = require('../lib/story-session');

const persona = {
  name: '阿岚',
  core_traits: ['要强', '藏话'],
  soft_spots: ['把期待当成自己的想要', '被否定时加倍努力'],
  decision_tendency: '总是在退路前再撑一次',
  growth_seed: '学会承认自己不想要'
};

const beats = {
  beats: [
    { year: 1, type: 'pivotal', seed: '复读班第一天' },
    { year: 2, type: 'quiet', seed: '成绩落下后沉默' },
    { year: 3, type: 'quiet', seed: '一个人吃饭' },
    { year: 4, type: 'pivotal', seed: '被推到台前' },
    { year: 5, type: 'quiet', seed: '开始失眠' },
    { year: 6, type: 'pivotal', seed: '复试被刷' },
    { year: 7, type: 'quiet', seed: '邮局窗口' }
  ],
  pivotal_years: [1, 4, 6]
};

function year(yearN, overrides = {}) {
  return {
    year: yearN,
    age: 18 + yearN,
    is_pivotal: overrides.is_pivotal ?? yearN === 1,
    title: `第${yearN}年`,
    scene: 'rain',
    environment: 'classroom',
    pose: 'wait',
    prop: 'desk',
    city: 'city2',
    event: '你坐在最后一排。',
    decision_made: '继续撑下去',
    intervention_prompt: overrides.intervention_prompt ?? null,
    emotion: { label: '低落', value: 4 },
    new_mood: 4,
    new_esteem: 5,
    reflection: '我还是怕被看见。',
    shadow_dialogue: '你看，我还在这里。',
    memory_summary: `年${yearN}：坐在最后一排`
  };
}

test('normalizeYear flattens emotion and enforces quiet intervention invariant', () => {
  const normalized = normalizeYear({
    ...year(2, {
      is_pivotal: false,
      intervention_prompt: { question: '要继续吗？', options: ['继续', '停止'] }
    })
  }, {
    index: 1,
    startAge: 18,
    beats: beats.beats,
    pivotalYears: beats.pivotal_years
  });

  assert.equal(normalized.emotion, '低落');
  assert.equal(normalized.emotion_value, 4);
  assert.equal(normalized.is_pivotal, false);
  assert.equal(normalized.intervention_prompt, null);
});

test('story session advances year-by-year and threads intervention into runtime prompt', async () => {
  const runtime = createQueueRuntime([
    persona,
    beats,
    year(1, {
      is_pivotal: true,
      intervention_prompt: { question: '告诉父母吗？', options: ['告诉', '不说'] }
    }),
    {
      beats: beats.beats.map((b) => ({ ...b, seed: `${b.seed}·replan` })),
      pivotal_years: beats.pivotal_years
    },
    year(2, { is_pivotal: false }),
    {
      title: '阿岚的七年',
      message: '我后来终于知道，安静不是失败。',
      regret: '没有早点说不想要。',
      scene: 'home',
      emotion_arc: '从紧绷走向低处的平稳'
    }
  ]);

  const generatedPrompts = [];
  const observingRuntime = {
    ...runtime,
    async generateStructured(args) {
      generatedPrompts.push(args.prompt);
      return runtime.generateStructured(args);
    }
  };

  let session = await startStorySession({
    profile: { choice: '如果去复读', age: 18 },
    runtime: observingRuntime
  });

  let result = await generateNextYear({ session, runtime: observingRuntime });
  session = result.session;
  assert.equal(result.year.year, 1);
  assert.equal(session.memory_stream.length, 1);

  const intervention = {
    from_year: 1,
    question: '告诉父母吗？',
    choice: '告诉'
  };
  result = await generateNextYear({ session, user_intervention: intervention, runtime: observingRuntime });
  session = result.session;
  assert.equal(result.year.year, 2);
  assert.equal(session.years[0].user_intervention.choice, '告诉');
  assert.match(generatedPrompts.at(-1), /用户上一步选择了：「告诉」/);
  assert.ok(session.replan_log?.length >= 1);

  const finalResult = await finishStorySession({ session, runtime: observingRuntime });
  assert.equal(finalResult.final.title, '阿岚的七年');
  assert.equal(finalResult.story.years.length, 2);
});
