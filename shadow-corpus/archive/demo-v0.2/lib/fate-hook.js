'use strict';

const { z } = require('zod');
const {
  calendarYearForNarrative,
  resolveFateContext,
  formatFateContextForPrompt
} = require('./fate-bridge');

/** UI / demo ShadowAgents.fate 共用契约 */
const FateResultSchema = z.object({
  overlay: z.string().optional(),
  hint: z.string().min(1).max(120),
  era_line: z.string().optional(),
  calendar_year: z.number().int().optional(),
  _placeholder: z.boolean().optional()
});

/**
 * @param {object} ctx from resolveFateContext
 * @returns {object}
 */
function fateContextToUiResult(ctx) {
  const calendar_year = ctx.calendar_year ?? ctx.calendarYear;
  return FateResultSchema.parse({
    overlay: ctx.era_line || undefined,
    hint: `时代 ${calendar_year}${ctx.placeholder ? ' · placeholder' : ''}`,
    era_line: ctx.era_line,
    calendar_year,
    _placeholder: ctx.placeholder ?? false
  });
}

/** @param {object} raw */
function normalizeFateResult(raw) {
  return FateResultSchema.parse(raw);
}

/**
 * Placeholder Fate hook — 与 docs/demo-data.js ShadowAgents.fate 对齐。
 * @param {object} ctx
 */
async function askFatePlaceholder(ctx) {
  const narrativeYear = ctx.year?.year ?? ctx.narrativeYear ?? 1;
  const profile = ctx.story?.profile || ctx.profile || { choice: '复读', age: 18 };
  const beatType = ctx.beatType
    ?? (ctx.year?.is_pivotal ? 'pivotal' : 'quiet');

  if (ctx.snippets && typeof ctx.snippets === 'object') {
    const cal = calendarYearForNarrative(profile, narrativeYear);
    const snip = ctx.snippets[String(cal)];
    if (snip) {
      return normalizeFateResult({
        overlay: snip.era_line,
        hint: `时代 ${cal} · placeholder`,
        era_line: snip.era_line,
        calendar_year: cal,
        _placeholder: true
      });
    }
  }

  const resolved = await resolveFateContext({
    runId: ctx.runId || 'placeholder',
    profile,
    persona_card: ctx.persona_card,
    narrativeYear,
    beatType,
    priorInterventions: ctx.priorInterventions || []
  });
  return fateContextToUiResult(resolved);
}

/** @param {object} ctx */
async function askFateOnIntervention(ctx) {
  const base = await askFatePlaceholder(ctx);
  const choice = ctx.choice ?? ctx.lastIntervention?.choice;
  if (!choice) return base;
  return normalizeFateResult({
    ...base,
    overlay: base.overlay
      ? `${base.overlay} · 你选了「${choice}」`
      : `你选了「${choice}」`
  });
}

module.exports = {
  FateResultSchema,
  normalizeFateResult,
  fateContextToUiResult,
  askFatePlaceholder,
  askFateOnIntervention,
  formatFateContextForPrompt
};
