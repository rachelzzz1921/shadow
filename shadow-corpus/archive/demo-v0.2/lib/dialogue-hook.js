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

/** 取一句话里最有"抓手"感的短片段（去标点，截断） */
function pickFragment(text, max = 9) {
  const cleaned = String(text || '')
    .replace(/[，。！？、；：…—\s「」『』""''（）()]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || String(text || '');
  return cleaned.slice(0, max);
}

/**
 * Placeholder「追问向导」—— 无 API key 时给出**比写死的四句更贴语境**的推荐问题。
 * 契约与 docs/demo-data.js ShadowAgents.dialogue.suggest 对齐：返回 { questions, _placeholder }。
 *
 * @param {object} ctx
 * @param {object} [ctx.persona_card]
 * @param {object[]} [ctx.memory_stream]
 * @param {object} [ctx.year] — { year, title, event, is_pivotal }
 * @param {number} [ctx.at_year]
 * @param {{role:string,text:string}[]} [ctx.recent_dialogue]
 * @param {string} [ctx.last_reply]
 */
function suggestQuestionsPlaceholder(ctx) {
  const year = ctx.year || null;
  const asked = new Set(
    (ctx.recent_dialogue || [])
      .filter(t => t && t.role !== 'shadow')
      .map(t => String(t.text || '').trim())
  );

  // anchored = 扣住语境的高相关问句，永远排在前面、不参与轮换
  const anchored = [];
  const lastReply = (ctx.last_reply || '').trim();
  if (lastReply) {
    const frag = pickFragment(lastReply);
    if (frag) anchored.push(`你说的「${frag}」，后来呢？`);
  }
  if (year?.title) anchored.push(`「${year.title}」那年，最难熬的是哪一刻？`);
  if (year?.is_pivotal) anchored.push('那个岔路口，你有过一秒钟想反悔吗？');
  const soft = (ctx.persona_card?.soft_spots || [])[0];
  if (soft) anchored.push(`你到现在，还会被「${pickFragment(soft, 7)}」绊住吗？`);
  const mem = (ctx.memory_stream || []).find(m => m && (m.content || m.memory_summary));
  if (mem) anchored.push(`${pickFragment(mem.content || mem.memory_summary, 8)}那件事，你怎么过去的？`);

  // generic = 通用填充，按年份+轮次轮换，避开最同质的那几句
  const generic = [
    '那一刻，你身边有人懂你吗？',
    '这一路，你失去的和得到的，哪个更重？',
    '能给那年的我带一句话，你会说什么？',
    '有没有一个人，你一直没机会说谢谢？'
  ];
  const turns = (ctx.recent_dialogue || []).length;
  const freshAnchored = anchored.filter(q => !asked.has(q));
  const freshGeneric = generic.filter(q => !asked.has(q));
  const offset = freshGeneric.length
    ? ((year?.year || ctx.at_year || 1) + turns) % freshGeneric.length
    : 0;
  const rotated = freshGeneric.slice(offset).concat(freshGeneric.slice(0, offset));

  const out = freshAnchored.concat(rotated).slice(0, 4);
  return {
    questions: out.length >= 3 ? out : anchored.concat(generic).slice(0, 4),
    _placeholder: true
  };
}

module.exports = {
  askDialoguePlaceholder,
  suggestQuestionsPlaceholder,
  normalizeDialogueResult
};
