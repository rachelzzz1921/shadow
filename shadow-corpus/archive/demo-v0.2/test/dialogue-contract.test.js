'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createQueueRuntime } = require('../lib/llm-runtime');
const { runDialogue } = require('../lib/agents');
const { askDialoguePlaceholder, normalizeDialogueResult } = require('../lib/dialogue-hook');
const { DialogueSchema } = require('../lib/schemas');

const golden = require('../../../fixtures/golden-stories/复读线.json');

const persona = golden.persona_card;
const memory_stream = golden.memory_stream;

test('askDialoguePlaceholder returns DialogueSchema-shaped result with memory cites', () => {
  const out = askDialoguePlaceholder({
    persona_card: persona,
    memory_stream,
    at_year: 4,
    user_question: '撕准考证'
  });
  assert.equal(out._placeholder, true);
  const parsed = DialogueSchema.parse(out);
  assert.ok(parsed.cite_memory_ids.length >= 1);
  assert.ok(memory_stream.some(m => parsed.cite_memory_ids.includes(m.id)));
  assert.ok(parsed.reply.length >= 20);
});

test('normalizeDialogueResult rejects invalid dialogue payload', () => {
  assert.throws(() => normalizeDialogueResult({ reply: '短', cite_memory_ids: [], mood_after: 'x' }));
});

test('runDialogue uses selectMemories and returns schema-valid reply via mock runtime', async () => {
  const mockReply = {
    reply: '撕准考证那晚，纸边划破手指，我假装是天气太干。你现在问这个，是想替我说出那声疼吗？',
    cite_memory_ids: ['m2'],
    mood_after: '钝'
  };
  const runtime = createQueueRuntime([mockReply]);

  const result = await runDialogue({
    persona_card: persona,
    memory_stream,
    current_mood: 4,
    current_esteem: 5,
    at_year: 2,
    user_question: '为什么撕准考证',
    runtime
  });

  DialogueSchema.parse(result);
  assert.deepEqual(result.cite_memory_ids, ['m2']);
});

test('placeholder cite_memory_ids prefer query overlap', () => {
  const out = askDialoguePlaceholder({
    persona_card: persona,
    memory_stream,
    at_year: 6,
    user_question: '考研复试'
  });
  assert.ok(out.cite_memory_ids.includes('m6') || out.cite_memory_ids.includes('m4'));
});
