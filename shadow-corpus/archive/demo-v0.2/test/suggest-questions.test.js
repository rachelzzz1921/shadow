'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createQueueRuntime } = require('../lib/llm-runtime');
const { runSuggestQuestions } = require('../lib/agents');
const { suggestQuestionsPlaceholder } = require('../lib/dialogue-hook');
const { SuggestQuestionsSchema } = require('../lib/schemas');

const golden = require('../../../fixtures/golden-stories/复读线.json');
const persona = golden.persona_card;
const memory_stream = golden.memory_stream;

// 旧版写死的同质化问句——兜底问题不应再产出这几句
const BANNED = new Set([
  '这七年，你后悔过吗？',
  '如果重来一次，你还会这么选吗？',
  '对现在的我，你最想说哪句话？'
]);

test('suggestQuestionsPlaceholder returns 3-4 schema-valid, non-cliché questions', () => {
  const out = suggestQuestionsPlaceholder({
    persona_card: persona,
    memory_stream,
    year: { year: 4, title: '撕掉准考证', event: '在复读班撕掉准考证那晚', is_pivotal: true },
    at_year: 4,
    last_reply: '撕准考证那晚，纸边划破手指，我假装是天气太干。'
  });
  assert.equal(out._placeholder, true);
  const parsed = SuggestQuestionsSchema.parse(out);
  assert.ok(parsed.questions.length >= 3 && parsed.questions.length <= 4);
  for (const q of parsed.questions) assert.ok(!BANNED.has(q), `还在用同质化问句: ${q}`);
});

test('suggestQuestionsPlaceholder hooks onto the shadow last reply', () => {
  const out = suggestQuestionsPlaceholder({
    persona_card: persona,
    memory_stream,
    year: { year: 2, title: '复读班', is_pivotal: false },
    last_reply: '我记得那台旧风扇一直转，吵得人睡不着。'
  });
  // 至少一条扣住了刚说的那句话（"你说的「…」"形式）
  assert.ok(out.questions.some(q => q.includes('你说的')));
});

test('suggestQuestionsPlaceholder excludes already-asked questions', () => {
  const first = suggestQuestionsPlaceholder({
    persona_card: persona,
    memory_stream,
    year: { year: 3, title: '复读班', is_pivotal: false }
  });
  const asked = first.questions[0];
  const second = suggestQuestionsPlaceholder({
    persona_card: persona,
    memory_stream,
    year: { year: 3, title: '复读班', is_pivotal: false },
    recent_dialogue: [{ role: 'user', text: asked }]
  });
  assert.ok(!second.questions.includes(asked));
});

test('runSuggestQuestions returns schema-valid output via mock runtime', async () => {
  const mock = {
    questions: [
      '你假装是天气太干，那真话是什么？',
      '划破手指那下，疼吗？',
      '撕之前，你犹豫了多久？'
    ]
  };
  const runtime = createQueueRuntime([mock]);
  const result = await runSuggestQuestions({
    persona_card: persona,
    memory_stream,
    year: { year: 4, title: '撕掉准考证', is_pivotal: true },
    at_year: 4,
    recent_dialogue: [{ role: 'shadow', text: '撕准考证那晚，纸边划破手指。' }],
    last_reply: '撕准考证那晚，纸边划破手指。',
    runtime
  });
  SuggestQuestionsSchema.parse(result);
  assert.equal(result.questions.length, 3);
});
