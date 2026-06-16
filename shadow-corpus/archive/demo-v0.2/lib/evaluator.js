'use strict';

/**
 * Rule-based narrative feedback for Shadow stories.
 * Mechanical checks only — not LLM quality scoring.
 * See 04-dev-testing/01-narrative-eval-rubric.md for rationale.
 */

const CLICHE_PATTERNS = [
  /另一条路也好/,
  /人生没有标准答案/,
  /一切都是最好的安排/,
  /你要相信自己/,
  /加油/,
  /未来可期/,
  /都会好的/
];

const ABSTRACT_MEMORY = /^年?\d*[：:]?(决定|发生|经历|继续|坚持|努力)/;

function issue(code, message, severity = 'warn') {
  return { code, message, severity };
}

function evaluateBeats(beats, pivotalYears) {
  const findings = [];
  if (!Array.isArray(beats) || beats.length !== 7) {
    findings.push(issue('beats.length', 'beats 必须是 7 条', 'error'));
    return findings;
  }

  const pivotal = beats.filter(b => b.type === 'pivotal').map(b => b.year);
  const declared = Array.isArray(pivotalYears) ? pivotalYears : [];

  if (pivotal.length < 2 || pivotal.length > 3) {
    findings.push(issue('beats.pivotal_count', `pivotal 年应为 2-3 个，当前 ${pivotal.length}`, 'error'));
  }

  for (let i = 1; i < pivotal.length; i += 1) {
    if (pivotal[i] - pivotal[i - 1] === 1) {
      findings.push(issue('beats.pivotal_spacing', `pivotal 年 ${pivotal[i - 1]} 与 ${pivotal[i]} 相邻，留白不足`, 'warn'));
    }
  }

  if (beats[0]?.type === 'pivotal') {
    findings.push(issue('beats.year1_quiet', '第一年通常应为 quiet，给读者日常入口', 'warn'));
  }
  if (beats[6]?.type === 'pivotal') {
    findings.push(issue('beats.year7_quiet', '第七年通常应为 quiet，留给收尾', 'warn'));
  }

  const mismatch = pivotal.some(y => !declared.includes(y)) || declared.some(y => !pivotal.includes(y));
  if (mismatch) {
    findings.push(issue('beats.pivotal_sync', 'pivotal_years 与 beats 中 type=pivotal 不一致', 'error'));
  }

  return findings;
}

function evaluateYear(year, beat, opts = {}) {
  const findings = [];
  if (!year) return [issue('year.missing', '缺少年份对象', 'error')];

  const lengthStandard = opts.lengthStandard || 'legacy';
  const isLive = opts.isLive || lengthStandard === 'v2' || lengthStandard === 'fast';
  const beatType = beat?.type || (year.is_pivotal ? 'pivotal' : 'quiet');
  const eventLen = (year.event || '').length;

  if (lengthStandard === 'fast') {
    if (eventLen < 80) {
      findings.push(issue(
        'year.event_volume',
        `快速模式 event 建议 90–120 字，当前 ${eventLen}`,
        isLive ? 'error' : 'warn'
      ));
    }
    if (eventLen > 145) {
      findings.push(issue(
        'year.event_long',
        `快速模式 event 建议 ≤120 字左右，当前 ${eventLen}`,
        'warn'
      ));
    }
    const anchorLen = (year.visual_anchor || '').length;
    if (anchorLen < 8) {
      findings.push(issue(
        'year.visual_anchor',
        `年${year.year} 缺少 visual_anchor（8–48 字）`,
        'warn'
      ));
    }
    const props = Array.isArray(year.key_props) ? year.key_props : [];
    if (props.length < 2) {
      findings.push(issue(
        'year.key_props',
        `年${year.year} 缺少 key_props（须 2–3 个物件）`,
        'warn'
      ));
    }
  } else if (lengthStandard === 'v2') {
    if (eventLen < 160) {
      findings.push(issue(
        'year.event_volume',
        `全年 event 建议 160–240 字，当前 ${eventLen}`,
        isLive ? 'error' : 'warn'
      ));
    }
    if (eventLen > 280) {
      findings.push(issue(
        'year.event_long',
        `全年 event 建议 ≤240 字左右，当前 ${eventLen}`,
        'warn'
      ));
    }
    const anchorLen = (year.visual_anchor || '').length;
    if (anchorLen < 12) {
      findings.push(issue(
        'year.visual_anchor',
        `年${year.year} 缺少 visual_anchor（12–48 字）`,
        isLive ? 'error' : 'warn'
      ));
    }
    const props = Array.isArray(year.key_props) ? year.key_props : [];
    if (props.length < 2) {
      findings.push(issue(
        'year.key_props',
        `年${year.year} 缺少 key_props（须 2–3 个物件）`,
        isLive ? 'error' : 'warn'
      ));
    }
  } else if (beatType === 'quiet') {
    if (eventLen > 35) {
      findings.push(issue('year.quiet_length', `quiet 年 event 应 ≤30 字左右，当前 ${eventLen}`, 'warn'));
    }
  } else if (eventLen < 40) {
    findings.push(issue('year.pivotal_length', `pivotal 年 event 应更完整，当前 ${eventLen} 字`, 'warn'));
  }

  if (beatType === 'quiet') {
    if (year.intervention_prompt) {
      findings.push(issue('year.quiet_intervention', 'quiet 年不应有 intervention_prompt', 'error'));
    }
    if (year.is_pivotal) {
      findings.push(issue('year.quiet_flag', 'quiet 年 is_pivotal 应为 false', 'error'));
    }
  }

  if (beatType === 'pivotal') {
    if (!year.intervention_prompt?.question || !Array.isArray(year.intervention_prompt?.options)) {
      findings.push(issue('year.pivotal_intervention', 'pivotal 年缺少 intervention_prompt', 'error'));
    } else if (year.intervention_prompt.options.length !== 2) {
      findings.push(issue('year.intervention_options', 'intervention 必须恰好两个选项', 'error'));
    } else {
      const [a, b] = year.intervention_prompt.options;
      if (a === b) {
        findings.push(issue('year.intervention_distinct', '两个 intervention 选项不能相同', 'error'));
      }
    }
  }

  const summary = year.memory_summary || '';
  if (summary.length < 6) {
    findings.push(issue('year.memory_short', 'memory_summary 过短，dialogue 难以引用', 'warn'));
  }
  if (ABSTRACT_MEMORY.test(summary) && summary.length < 12) {
    findings.push(issue('year.memory_abstract', 'memory_summary 过于抽象，缺少具体物件或瞬间', 'warn'));
  }

  const reflectionLen = (year.reflection || '').length;
  const dialogueLen = (year.shadow_dialogue || '').length;
  if (lengthStandard === 'fast') {
    if (reflectionLen < 32) {
      findings.push(issue('year.reflection_short', `快速模式 reflection 建议 40–55 字，当前 ${reflectionLen}`, 'warn'));
    }
    if (dialogueLen < 28) {
      findings.push(issue('year.dialogue_short', '快速模式 shadow_dialogue 建议 35–48 字', 'warn'));
    }
  } else if (lengthStandard === 'v2') {
    if (reflectionLen < 45) {
      findings.push(issue('year.reflection_short', `reflection 建议 55–75 字，当前 ${reflectionLen}`, 'warn'));
    }
    if (reflectionLen > 85) {
      findings.push(issue('year.reflection_long', `reflection 建议 ≤75 字，当前 ${reflectionLen}`, 'warn'));
    }
    if (dialogueLen < 35) {
      findings.push(issue('year.dialogue_short', 'shadow_dialogue 建议 45–58 字', 'warn'));
    }
    if (dialogueLen > 65) {
      findings.push(issue('year.dialogue_long', 'shadow_dialogue 建议 ≤58 字', 'warn'));
    }
  } else if (dialogueLen > 35) {
    findings.push(issue('year.dialogue_long', 'shadow_dialogue 建议 ≤30 字', 'warn'));
  }

  return findings;
}

function interventionConsequenceMatches(choice, eventText, decisionText) {
  if (!choice) return false;
  const opening = (eventText || '').slice(0, 80);
  const full = `${opening}${decisionText || ''}`;
  if (full.includes(choice)) return true;

  const choiceChars = [...choice].filter((c) => c.trim() && !/[，。、；：？！\s]/.test(c));
  const minHits = Math.max(2, Math.ceil(choiceChars.length * 0.35));
  const hits = choiceChars.filter((c) => full.includes(c)).length;
  if (hits >= minHits) return true;

  const CONSEQUENCE_HINTS = [
    /告诉|撑|承认|再战|接受|消化|打电话|挂断|转身|留下|离开|开口|沉默/,
    /因为|于是|从此|那晚|第二天|接下来|你选|你决定/
  ];
  return CONSEQUENCE_HINTS.some((re) => re.test(opening));
}

function evaluateVisualConsistency(years, opts = {}) {
  const findings = [];
  if (!Array.isArray(years) || !years.length) return findings;

  const lengthStandard = opts.lengthStandard || 'legacy';
  const isLive = opts.isLive || lengthStandard === 'v2';
  const withAnchor = years.filter(y => y?.visual_anchor);

  if (lengthStandard === 'v2' && withAnchor.length !== years.length) {
    const missing = years.filter(y => !y?.visual_anchor).map(y => y.year);
    findings.push(issue(
      'visual.partial',
      `部分年份缺 visual_anchor：年 ${missing.join(',')}`,
      isLive ? 'error' : 'warn'
    ));
  } else if (withAnchor.length && withAnchor.length !== years.length) {
    const missing = years.filter(y => !y?.visual_anchor).map(y => y.year);
    findings.push(issue(
      'visual.partial',
      `部分年份有 visual_anchor，但年 ${missing.join(',')} 缺失（v2 同步不完整）`,
      'warn'
    ));
  }

  for (const year of years) {
    if (year?.visual_anchor && (!Array.isArray(year.key_props) || year.key_props.length < 2)) {
      findings.push(issue(
        'visual.key_props',
        `年${year.year} 有 visual_anchor 但缺 key_props（须 2–3 个）`,
        isLive ? 'error' : 'warn'
      ));
    }
  }

  return findings;
}

function evaluateInterventionThread(prevYear, nextYear, opts = {}) {
  const findings = [];
  const iv = prevYear?.user_intervention;
  if (!iv?.choice) return findings;

  const eventText = nextYear?.event || '';
  const opening = eventText.slice(0, 80);
  const matched = interventionConsequenceMatches(iv.choice, eventText, nextYear?.decision_made);
  const severity = (opts.isLive || opts.lengthStandard === 'v2') ? 'error' : 'warn';

  if (!matched) {
    findings.push(issue(
      'intervention.thread',
      `年${nextYear?.year} event 开篇（前 80 字）未承接年${iv.from_year} 的介入「${iv.choice}」`,
      severity
    ));
  } else if (!opening.trim() && eventText.length) {
    findings.push(issue(
      'intervention.thread_opening',
      `年${nextYear?.year} 应在 event 第一段写清介入后果，而非仅在末尾提及`,
      'warn'
    ));
  }
  return findings;
}

function evaluateIntakeConsistency(fullProfile, personaCard) {
  const findings = [];
  if (!fullProfile) {
    findings.push(issue('intake.missing', '缺少 full_profile', 'error'));
    return findings;
  }

  if (fullProfile.meta?.schema_version !== 1) {
    findings.push(issue(
      'intake.schema_version',
      `full_profile.meta.schema_version 应为 1，当前 ${fullProfile.meta?.schema_version ?? '缺失'}`,
      'warn'
    ));
  }

  const tags = fullProfile.raw?.selected_tags || [];
  if (tags.length && typeof tags[0] === 'string') {
    findings.push(issue(
      'intake.tags_shape',
      'raw.selected_tags 应为 { label, category_id }[]，当前为 string[]',
      'warn'
    ));
  }

  if (!fullProfile.tension_flags?.length) {
    findings.push(issue('intake.tension_empty', '未检测到 intake 张力标记', 'warn'));
  }

  if (personaCard?.core_tension && fullProfile.tension_flags?.length) {
    const tensionBlob = fullProfile.tension_flags.map((f) => `${f.detail || ''}${f.note || ''}`).join('');
    if (!/(独立|面子|无所谓|再试|真实|依赖|裂缝)/.test(personaCard.core_tension)
      && !/(独立|面子|无所谓|再试|真实|依赖|裂缝)/.test(tensionBlob)) {
      findings.push(issue(
        'intake.persona_tension',
        'persona_card.core_tension 与 intake tension_flags 语义未对齐',
        'warn'
      ));
    }
  }

  return findings;
}

function evaluateFinal(final) {
  const findings = [];
  if (!final) {
    findings.push(issue('final.missing', '缺少 final 收尾', 'error'));
    return findings;
  }

  const message = final.message || '';
  if (message.length < 20) {
    findings.push(issue('final.message_short', 'final.message 过短', 'warn'));
  }
  for (const pattern of CLICHE_PATTERNS) {
    if (pattern.test(message)) {
      findings.push(issue('final.cliche', `final.message 含鸡汤/平衡话术：${pattern}`, 'warn'));
    }
  }
  if (!final.regret) {
    findings.push(issue('final.regret_missing', 'final 应包含真实 regret', 'warn'));
  }
  return findings;
}

function evaluateStory(story, opts = {}) {
  const findings = [];
  const lengthStandard = opts.lengthStandard
    || story?.generation_mode
    || (story?._from_live || story?._from_generate ? 'v2' : 'legacy');
  const isLive = opts.isLive ?? !!(story?._from_live || story?._from_generate);
  const evalOpts = { lengthStandard, isLive };

  findings.push(...evaluateBeats(story.beats, story.pivotal_years));
  if (story.full_profile) {
    findings.push(...evaluateIntakeConsistency(story.full_profile, story.persona_card));
  }

  const beats = story.beats || [];
  (story.years || []).forEach((year, index) => {
    findings.push(...evaluateYear(year, beats[index], evalOpts));
    if (index > 0) {
      findings.push(...evaluateInterventionThread(story.years[index - 1], year, evalOpts));
    }
  });

  if ((story.years || []).length === 7) {
    findings.push(...evaluateVisualConsistency(story.years, evalOpts));
    findings.push(...evaluateFinal(story.final));
  }

  const errors = findings.filter(f => f.severity === 'error');
  const warns = findings.filter(f => f.severity === 'warn');
  return {
    ok: errors.length === 0,
    score: Math.max(0, 100 - errors.length * 15 - warns.length * 5),
    errors,
    warnings: warns,
    findings
  };
}

module.exports = {
  evaluateBeats,
  evaluateYear,
  evaluateFinal,
  evaluateStory,
  evaluateIntakeConsistency,
  evaluateInterventionThread,
  evaluateVisualConsistency,
  interventionConsequenceMatches
};
