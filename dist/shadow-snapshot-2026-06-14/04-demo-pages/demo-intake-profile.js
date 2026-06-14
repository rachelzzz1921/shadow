/**
 * Shadow Intake — full_profile 聚合
 * 行为题 > 标签 > 自我叙述；study → academic 域归一
 */
'use strict';

const SCENARIO_DOMAINS = ['family', 'love', 'friendship', 'academic', 'career', 'self_growth'];

const DOMAIN_ALIASES = { study: 'academic', academic: 'academic' };

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function tagsByCategory(selectedTags) {
  const map = {};
  for (const t of selectedTags || []) {
    const cat = t.category_id || t.category || t.cat || 'trait';
    if (!map[cat]) map[cat] = [];
    map[cat].push(t.label || t);
  }
  return map;
}

function getAnswer(answersObj, id) {
  const a = answersObj[id];
  if (!a) return null;
  return {
    question_id: id,
    answer: {
      optionKey: typeof a.value === 'string' && a.value.length === 1 ? a.value : undefined,
      value: a.value,
      orderedKeys: Array.isArray(a.value) ? a.value : undefined
    },
    duration_ms: a.durationMs || 0
  };
}

function answersToArray(answersObj) {
  return Object.keys(answersObj || {}).map(id => getAnswer(answersObj, id)).filter(Boolean);
}

function normalizeScenarioWeights(raw) {
  const out = {};
  let sum = 0;
  for (const d of SCENARIO_DOMAINS) {
    const alias = Object.entries(DOMAIN_ALIASES).find(([k]) => raw[k] != null && k !== d);
    let v = Number(raw[d]) || 0;
    if (raw.study != null && d === 'academic') v += Number(raw.study) || 0;
    for (const [k, target] of Object.entries(DOMAIN_ALIASES)) {
      if (target === d && k !== d && raw[k] != null) v += Number(raw[k]) || 0;
    }
    out[d] = Math.max(0, v);
    sum += out[d];
  }
  if (sum <= 0) {
    const w = 1 / SCENARIO_DOMAINS.length;
    return Object.fromEntries(SCENARIO_DOMAINS.map(d => [d, +w.toFixed(2)]));
  }
  for (const d of SCENARIO_DOMAINS) out[d] = +(out[d] / sum).toFixed(2);
  return out;
}

function computeScenarioWeights(layerA, tagMap, answersObj, domainDetect) {
  const raw = Object.fromEntries(SCENARIO_DOMAINS.map(d => [d, 0.05]));
  const { TAG_DOMAIN } = window.ShadowIntakeQuestions || {};

  for (const label of tagMap.scenario_hint || []) {
    const zh = { 学业: 'academic', 事业: 'career', 爱情: 'love', 亲情: 'family', 友情: 'friendship', 自我成长: 'self_growth' }[label];
    if (zh) raw[zh] += 0.25;
  }

  for (const labels of Object.values(tagMap)) {
    for (const label of labels) {
      const d = TAG_DOMAIN?.[label];
      if (d) {
        const norm = DOMAIN_ALIASES[d] || d;
        if (SCENARIO_DOMAINS.includes(norm)) raw[norm] += 0.12;
      }
    }
  }

  if (domainDetect?.top) {
    const norm = DOMAIN_ALIASES[domainDetect.top] || domainDetect.top;
    if (SCENARIO_DOMAINS.includes(norm)) raw[norm] += 0.35;
  }

  const q4 = getAnswer(answersObj, 'SH-Q04');
  const q4map = { A: 'family', B: 'love', C: 'friendship', D: 'self_growth' };
  if (q4?.answer?.optionKey && q4map[q4.answer.optionKey]) raw[q4map[q4.answer.optionKey]] += 0.3;

  const blob = `${layerA.choice_text || layerA.choice || ''}${layerA.self_description || ''}`;
  if (/复读|考研|学业|学校|专业/.test(blob)) raw.academic += 0.25;
  if (/考公|工作|创业|就业|转行/.test(blob)) raw.career += 0.25;
  if (/分手|恋爱|异地|结婚|感情/.test(blob)) raw.love += 0.25;
  if (/父母|家里|家庭|期待/.test(blob)) raw.family += 0.25;
  if (/朋友|圈子|室友/.test(blob)) raw.friendship += 0.15;

  return normalizeScenarioWeights(raw);
}

function computeBaseline(answersObj) {
  const q02 = getAnswer(answersObj, 'SH-Q02');
  const q05 = getAnswer(answersObj, 'SH-Q05');
  const q06 = getAnswer(answersObj, 'SH-Q06');
  const moodFallback = { A: 4, B: 3, C: 6, D: 4 };
  const q05q = window.ShadowIntakeQuestions?.QUESTIONS?.find((q) => q.id === 'SH-Q05') ?? null;
  const moodCell = q05q?.cells?.find(c => c.key === q05?.answer?.optionKey);

  let initial_mood = moodCell?.mood ?? moodFallback[q05?.answer?.optionKey] ?? 5;
  let initial_esteem = 5;

  if (q02?.answer?.value != null) {
    initial_esteem = clamp(Math.round(10 - Number(q02.answer.value) / 12.5), 1, 10);
  }
  if (q06?.answer?.value != null && Number(q06.answer.value) >= 76) {
    initial_mood = clamp(initial_mood - 1, 1, 10);
  }

  return { initial_mood, initial_esteem };
}

function detectTensionFlags(layerA, tagMap, answersObj) {
  const flags = [];
  const selfDesc = layerA.self_description || '';
  const claimsIndependent =
    /独立|自己扛|不太在乎别人|自己说了算|一个人|不麻烦/.test(selfDesc) ||
    (tagMap.trait || []).some(t => /独立/.test(t));

  const q04 = getAnswer(answersObj, 'SH-Q04');
  const q09 = getAnswer(answersObj, 'SH-Q09');
  const relationHeavy = q04?.answer?.optionKey !== 'D';
  const seeksReassurance = q09?.answer?.optionKey === 'B';

  if (claimsIndependent && (relationHeavy || seeksReassurance)) {
    flags.push({
      type: 'self_report_vs_behavior',
      detail: '自述强调独立，但关系题与前夜行为指向外部依赖',
      note: '可能存在「我应该独立」的自我要求与真实需要之间的裂缝——Persona 应将此作为核心冲突。'
    });
  }

  const q06 = getAnswer(answersObj, 'SH-Q06');
  const q10 = getAnswer(answersObj, 'SH-Q10');
  if (Number(q06?.answer?.value) >= 76 && q10?.answer?.optionKey === 'D') {
    flags.push({
      type: 'persistence_vs_detachment',
      detail: '「再试一次」倾向很高，但自我形容选「随便吧」',
      note: '「假装无所谓」可能盖住真实的不甘心——叙事里应保留这层张力。'
    });
  }

  const q07 = getAnswer(answersObj, 'SH-Q07');
  if ((tagMap.value || []).includes('面子') && q07?.answer?.optionKey === 'B') {
    flags.push({
      type: 'value_conflict',
      detail: '标签与自述护住面子，但行为题选了「难看也要真实」',
      note: '面子与真实之间的裂缝——pivotal 年可用一次丢脸但真实的选择试探。'
    });
  }

  if ((tagMap.value || []).includes('真实') && q07?.answer?.optionKey === 'A') {
    flags.push({
      type: 'value_conflict',
      detail: '你说重视真实，但取舍时会先护住体面',
      note: '自我叙述与行为取舍不一致——Persona 应写出这层自我欺骗。'
    });
  }

  return flags;
}

function buildFullProfile({ session_id, layerA = {}, selectedTags = [], answersObj = {}, domainDetect = null, meta = {} }) {
  const tagMap = tagsByCategory(selectedTags);
  const questionAnswers = answersToArray(answersObj);

  const q10 = getAnswer(answersObj, 'SH-Q10');
  const archetypeMap = { A: 'the_endurer', B: 'the_doubter', C: 'the_pleaser', D: 'the_detached' };
  const archetype = archetypeMap[q10?.answer?.optionKey] || null;

  const scenario_weights = computeScenarioWeights(layerA, tagMap, answersObj, domainDetect);
  const baseline = computeBaseline(answersObj);
  const tension_flags = detectTensionFlags(layerA, tagMap, answersObj);

  const q03 = getAnswer(answersObj, 'SH-Q03');
  const defenseMap = { A: 'overwork', B: 'self_blame', C: 'suppression', D: 'external_regulation' };
  const defense_mechanism = defenseMap[q03?.answer?.optionKey] || null;

  const persist = Number(getAnswer(answersObj, 'SH-Q06')?.answer?.value ?? 50);
  const conflict = getAnswer(answersObj, 'SH-Q01')?.answer?.optionKey;
  let decision_tendency = persist >= 55
    ? '在「再努力一次」和「承认就这样」之间，结构性地选前者'
    : persist <= 45
      ? '在「再试一次」和「算了」之间，更常学会停下'
      : '在「再给自己一次机会」和「接受现状」之间，反复权衡';
  if (conflict === 'B') decision_tendency += '；冲突中倾向硬撑不低头';
  if (conflict === 'A') decision_tendency += '；冲突中倾向先妥协维持关系';

  const soft_spots = [];
  for (const f of tagMap.fear || []) soft_spots.push(f);
  if ((tagMap.value || []).includes('面子')) soft_spots.push('把体面看得比真实重');
  if ((tagMap.relation_pressure || []).includes('父母期待')) soft_spots.push('把父母期待当成自己的想要');
  if (Number(getAnswer(answersObj, 'SH-Q02')?.answer?.value) > 70) soft_spots.push('过度在意外部评价');

  const durs = Object.entries(answersObj).map(([id, v]) => [id, v.durationMs || 0]).sort((a, b) => b[1] - a[1]);

  return {
    session_id: session_id || `preview-${Date.now().toString(36)}`,
    raw: {
      choice_text: layerA.choice_text || layerA.choice || null,
      self_description: layerA.self_description || null,
      one_liner: layerA.one_liner || null,
      gender: layerA.gender || null,
      selected_tags: (selectedTags || []).map(t => t.label || t)
    },
    temporal: {
      birth_year: layerA.birth_year || null,
      fork_year: layerA.fork_year || null,
      age_at_fork: layerA.age_at_fork ?? layerA.age ?? null,
      gender: layerA.gender || null
    },
    scenario_weights,
    persona_signals: {
      core_traits: (tagMap.trait || []).slice(0, 4),
      archetype,
      decision_tendency,
      soft_spots: soft_spots.slice(0, 5),
      growth_seed: persist > 70
        ? '学会区分「我想要」和「我以为我应该想要」'
        : '学会在该停下时停下，而不总是再试一次',
      defense_mechanism
    },
    baseline,
    tension_flags,
    micro_questions: questionAnswers,
    meta: {
      ...meta,
      longest_dwell_question: durs[0]?.[0] || null,
      scenario_detected: domainDetect?.top || null,
      scenario_confidence: domainDetect?.conf != null
        ? +domainDetect.conf.toFixed(2)
        : domainDetect?.confidence != null
          ? +domainDetect.confidence.toFixed(2)
          : null,
      answered: Object.keys(answersObj).length
    }
  };
}

window.ShadowIntakeProfile = {
  buildFullProfile,
  tagsByCategory,
  SCENARIO_DOMAINS
};
