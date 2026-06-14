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

function evaluateYear(year, beat) {
  const findings = [];
  if (!year) return [issue('year.missing', '缺少年份对象', 'error')];

  const beatType = beat?.type || (year.is_pivotal ? 'pivotal' : 'quiet');
  const eventLen = (year.event || '').length;

  if (beatType === 'quiet') {
    if (eventLen > 35) {
      findings.push(issue('year.quiet_length', `quiet 年 event 应 ≤30 字左右，当前 ${eventLen}`, 'warn'));
    }
    if (year.intervention_prompt) {
      findings.push(issue('year.quiet_intervention', 'quiet 年不应有 intervention_prompt', 'error'));
    }
    if (year.is_pivotal) {
      findings.push(issue('year.quiet_flag', 'quiet 年 is_pivotal 应为 false', 'error'));
    }
  }

  if (beatType === 'pivotal') {
    if (eventLen < 40) {
      findings.push(issue('year.pivotal_length', `pivotal 年 event 应更完整，当前 ${eventLen} 字`, 'warn'));
    }
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

  if ((year.shadow_dialogue || '').length > 35) {
    findings.push(issue('year.dialogue_long', 'shadow_dialogue 建议 ≤30 字', 'warn'));
  }

  return findings;
}

function evaluateInterventionThread(prevYear, nextYear) {
  const findings = [];
  const iv = prevYear?.user_intervention;
  if (!iv?.choice) return findings;

  const haystack = `${nextYear?.event || ''}${nextYear?.decision_made || ''}`;
  if (!haystack.includes(iv.choice) && !/(告诉|撑|承认|再战|接受)/.test(haystack)) {
    findings.push(issue(
      'intervention.thread',
      `年${nextYear?.year} 的叙事未明显承接年${iv.from_year} 的介入选择「${iv.choice}」`,
      'warn'
    ));
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

function evaluateStory(story) {
  const findings = [];
  findings.push(...evaluateBeats(story.beats, story.pivotal_years));

  const beats = story.beats || [];
  (story.years || []).forEach((year, index) => {
    findings.push(...evaluateYear(year, beats[index]));
    if (index > 0) {
      findings.push(...evaluateInterventionThread(story.years[index - 1], year));
    }
  });

  if ((story.years || []).length === 7) {
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
  evaluateInterventionThread
};
