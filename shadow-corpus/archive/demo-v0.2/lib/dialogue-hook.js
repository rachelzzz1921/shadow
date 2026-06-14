'use strict';

const { DialogueSchema } = require('./schemas');
const { selectMemories } = require('./memory-retrieval');

/**
 * Placeholder Dialogue hook — 队友替换 runDialogue / enabled 后仍可用作 fallback。
 * 契约与 docs/demo-data.js ShadowAgents.dialogue.ask 对齐。
 *
 * @param {object} ctx
 * @param {object} ctx.persona_card
 * @param {object[]} ctx.memory_stream
 * @param {number} [ctx.at_year]
 * @param {string} [ctx.user_question]
 * @param {string} [ctx.fallback_reply]
 */
function askDialoguePlaceholder(ctx) {
  const atYear = ctx.at_year ?? 7;
  const picked = selectMemories(ctx.memory_stream || [], {
    limit: 3,
    at_year: atYear,
    query: ctx.user_question || ''
  });
  const citeIds = picked.map(m => m.id).slice(0, 2);
  const reply = ctx.fallback_reply
    || (picked[0] ? `我记得${picked[0].content.slice(0, 12)}…你问这个，是想确认什么吗？` : '那年的雨还在窗上，你想问什么？');

  return {
    reply: reply.length >= 20 ? reply : `${reply}（影子还在想该怎么答你。）`,
    cite_memory_ids: citeIds.length ? citeIds : ['m1'],
    mood_after: '静',
    _placeholder: true
  };
}

/** @param {object} raw @returns {object} */
function normalizeDialogueResult(raw) {
  return DialogueSchema.parse(raw);
}

module.exports = {
  askDialoguePlaceholder,
  normalizeDialogueResult
};
