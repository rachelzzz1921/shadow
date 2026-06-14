'use strict';

const SCENARIO_DOMAINS = [
  'family',
  'love',
  'friendship',
  'academic',
  'career',
  'self_growth'
];

const SCENARIO_LABEL_TO_DOMAIN = {
  学业: 'academic',
  事业: 'career',
  爱情: 'love',
  亲情: 'family',
  友情: 'friendship',
  自我成长: 'self_growth'
};

const ARCHETYPE_DECISION = {
  the_endurer: '在「再努力一次」和「承认就这样」之间，结构性地选前者',
  the_doubter: '在「再试一次」和「退后一步」之间，常常先怀疑自己配不配',
  the_pleaser: '在「让别人满意」和「听自己的」之间，常常先选前者',
  the_detached: '在「认真选」和「假装无所谓」之间，常常用后者盖住前者'
};

function uniformScenarioWeights() {
  const w = 1 / SCENARIO_DOMAINS.length;
  return Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, w]));
}

function normalizeScenarioWeights(raw) {
  const out = {};
  let sum = 0;
  for (const d of SCENARIO_DOMAINS) {
    const v = Math.max(0, Number(raw[d]) || 0);
    out[d] = v;
    sum += v;
  }
  if (sum <= 0) return uniformScenarioWeights();
  for (const d of SCENARIO_DOMAINS) out[d] /= sum;
  return out;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function findQuestionAnswer(answers, id) {
  return (answers || []).find((a) => a.question_id === id || a.q_id === id);
}

function findOption(question, key) {
  return (question?.options || []).find((o) => o.key === key);
}

function tagsByCategory(selectedTags) {
  const map = {};
  for (const t of selectedTags || []) {
    const cat = t.category_id || t.category || 'trait';
    if (!map[cat]) map[cat] = [];
    map[cat].push(t.label || t);
  }
  return map;
}

function mergeTraitsFromTagsAndAnswers(tagMap, q10) {
  const traits = new Set();
  for (const label of tagMap.trait || []) traits.add(label);
  const opt = findOption(q10, q10?.answer?.optionKey);
  for (const t of opt?.maps_to?.core_traits || []) traits.add(t);
  return [...traits].slice(0, 5);
}

function computeBaselineSignals(answers, questionsById) {
  let initial_mood = 5;
  let initial_esteem = 5;

  const q02 = findQuestionAnswer(answers, 'SH-Q02');
  if (q02?.answer?.value != null) {
    const v = Number(q02.answer.value);
    initial_esteem = clamp(Math.round(10 - v / 12.5), 1, 10);
  }

  const q05 = findQuestionAnswer(answers, 'SH-Q05');
  const q05q = questionsById['SH-Q05'];
  const moodCell = q05q?.ui?.cells?.find((c) => c.key === q05?.answer?.optionKey);
  if (moodCell?.mood_value != null) {
    initial_mood = clamp(Number(moodCell.mood_value), 1, 10);
  }

  const q06 = findQuestionAnswer(answers, 'SH-Q06');
  if (q06?.answer?.value != null && q06.answer.value >= 76) {
    initial_mood = clamp(initial_mood - 1, 1, 10);
  }

  return { initial_mood, initial_esteem };
}

function computeScenarioWeights(layerA, tagMap, answers, questionsById, scenarioFromText) {
  const raw = Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, 1 / SCENARIO_DOMAINS.length]));

  if (scenarioFromText?.scenario_weights) {
    for (const d of SCENARIO_DOMAINS) {
      raw[d] += Number(scenarioFromText.scenario_weights[d]) || 0;
    }
  }

  for (const label of tagMap.scenario_hint || []) {
    const domain = SCENARIO_LABEL_TO_DOMAIN[label];
    if (domain) raw[domain] += 0.2;
  }

  for (const ans of answers || []) {
    const q = questionsById[ans.question_id || ans.q_id];
    if (!q) continue;
    let opt;
    if (ans.answer?.optionKey) opt = findOption(q, ans.answer.optionKey);
    if (ans.answer?.orderedKeys?.length && q.kind === 'rank') {
      const top = ans.answer.orderedKeys[0];
      opt = findOption(q, top);
      raw[opt?.maps_to?.scenario_weights?.love ? 'love' : 'self_growth'] += 0.05;
    }
    const maps = opt?.maps_to || {};
    for (const [k, v] of Object.entries(maps)) {
      if (k.startsWith('scenario_weights.')) {
        const domain = k.split('.')[1];
        if (SCENARIO_DOMAINS.includes(domain)) raw[domain] += Number(v) || 0;
      }
    }
  }

  const blob = `${layerA.choice_text || ''}${layerA.self_description || ''}`;
  if (/复读|考研|学业|学校|专业/.test(blob)) raw.academic += 0.25;
  if (/考公|工作|创业|就业|转行/.test(blob)) raw.career += 0.25;
  if (/分手|恋爱|异地|结婚|感情/.test(blob)) raw.love += 0.25;
  if (/父母|家里|家庭|期待/.test(blob)) raw.family += 0.25;
  if (/朋友|圈子|室友/.test(blob)) raw.friendship += 0.15;

  return normalizeScenarioWeights(raw);
}

function buildSoftSpots(tagMap, answers, questionsById) {
  const spots = new Set();
  for (const label of tagMap.fear || []) spots.add(label);
  if ((tagMap.value || []).includes('面子')) spots.add('在乎别人的眼光，体面有时比真实更重');
  if ((tagMap.relation_pressure || []).includes('父母期待')) {
    spots.add('把父母期待当成自己的想要');
  }
  if ((tagMap.fear || []).includes('怕自己其实不想要')) {
    spots.add('靠近目标时怀疑自己是否真的想要它');
  }

  const q07 = findQuestionAnswer(answers, 'SH-Q07');
  if (q07?.answer?.optionKey === 'A') spots.add('怕被看穿');

  const q03 = findQuestionAnswer(answers, 'SH-Q03');
  const q03opt = findOption(questionsById['SH-Q03'], q03?.answer?.optionKey);
  if (q03opt?.maps_to?.defense_mechanism === 'suppression') {
    spots.add('用「没事」盖住真实感受');
  }

  return [...spots].slice(0, 5);
}

function buildDecisionTendency(answers, questionsById, archetype) {
  const q01 = findQuestionAnswer(answers, 'SH-Q01');
  const q06 = findQuestionAnswer(answers, 'SH-Q06');
  const q06v = q06?.answer?.value;

  if (q06v != null) {
    if (q06v >= 76) return '在「再努力一次」和「承认就这样」之间，结构性地选前者';
    if (q06v <= 25) return '在「再试一次」和「算了」之间，你更常学会停下';
    if (q06v >= 51) return '在「再给自己一次机会」和「接受现状」之间，倾向前者';
  }

  if (archetype && ARCHETYPE_DECISION[archetype]) return ARCHETYPE_DECISION[archetype];

  if (q01?.answer?.optionKey === 'B') {
    return '在冲突里先顶住，很少先低头';
  }
  if (q01?.answer?.optionKey === 'A') {
    return '在冲突里先圆场，倾向妥协以维持关系';
  }

  return '在岔路口，你常在「再撑一下」和「承认不确定」之间摇摆';
}

function buildGrowthSeed(tagMap, answers, questionsById) {
  const q07 = findQuestionAnswer(answers, 'SH-Q07');
  if (q07?.answer?.optionKey === 'B') {
    return '学会区分「我想要」和「我以为我应该想要」';
  }
  if ((tagMap.fear || []).includes('怕自己其实不想要')) {
    return '允许自己说「够了」，而不只是「再试一次」';
  }
  if ((tagMap.value || []).includes('面子')) {
    return '在体面与真实之间，找到不必二选一的方式';
  }
  return '在七年里慢慢看清，什么才是真正属于自己的想要';
}

function detectTensionFlags(layerA, tagMap, answers) {
  const flags = [];
  const selfDesc = layerA.self_description || '';
  const claimsIndependent =
    /独立|自己扛|不太在乎别人|自己说了算/.test(selfDesc) ||
    (tagMap.trait || []).some((t) => /独立/.test(t));

  const q04 = findQuestionAnswer(answers, 'SH-Q04');
  const q09 = findQuestionAnswer(answers, 'SH-Q09');
  const relationHeavy = q04?.answer?.optionKey !== 'D';
  const seeksReassurance = q09?.answer?.optionKey === 'B';

  if (claimsIndependent && (relationHeavy || seeksReassurance)) {
    flags.push({
      type: 'self_report_vs_behavior',
      detail: '自述强调独立，但关系题与前夜行为指向外部依赖',
      note:
        '可能存在「我应该独立」的自我要求与真实需要之间的裂缝——Persona 应将此作为核心冲突。'
    });
  }

  const q06 = findQuestionAnswer(answers, 'SH-Q06');
  const q10 = findQuestionAnswer(answers, 'SH-Q10');
  if (q06?.answer?.value >= 76 && q10?.answer?.optionKey === 'D') {
    flags.push({
      type: 'persistence_vs_detachment',
      detail: '「再试一次」倾向很高，但自我形容选「随便吧」',
      note: '「假装无所谓」可能盖住真实的不甘心——叙事里应保留这层张力。'
    });
  }

  return flags;
}

function longestDwellQuestion(answers) {
  if (!answers?.length) return null;
  let best = answers[0];
  for (const a of answers) {
    if ((a.duration_ms || 0) > (best.duration_ms || 0)) best = a;
  }
  return best.question_id || best.q_id || null;
}

/**
 * Rule-based「影子初读」预览（非最终 Persona）
 */
function buildShadowPreview(layerA, selectedTags) {
  const tagMap = tagsByCategory(selectedTags);
  const traits = tagMap.trait || [];
  const fears = tagMap.fear || [];
  const values = tagMap.value || [];
  const relations = tagMap.relation_pressure || [];

  const lines = [];
  if (traits.length) {
    lines.push(
      `你像是那种${traits.slice(0, 2).join('、')}的人。`
    );
  } else if (layerA.self_description) {
    lines.push('你在文字里已经露出一点轮廓了。');
  }

  if (fears.includes('怕被看穿') || values.includes('面子')) {
    lines.push('被看见对你不是小事——你可能更习惯先撑住，再慢慢消化。');
  }

  if (relations.includes('父母期待')) {
    lines.push(
      '父母的期待你扛着——但我们还不确定，那到底是你的目标，还是你以为是自己的目标。'
    );
  } else if (fears.includes('怕自己其实不想要')) {
    lines.push('靠近目标时，你有时会怀疑：这到底是我想要的，还是我应该想要的。');
  }

  if (!lines.length) {
    lines.push('影子还在听你说话——再多选几个词，或把岔路口说具体一点。');
  }

  return lines.join('\n');
}

/**
 * 聚合三层 intake → full_profile（喂 Persona / Fate）
 */
function buildFullProfile({
  session_id,
  layerA = {},
  selectedTags = [],
  questionAnswers = [],
  questions = [],
  scenarioFromText = null,
  meta = {}
}) {
  const questionsById = Object.fromEntries((questions || []).map((q) => [q.id, q]));
  const tagMap = tagsByCategory(selectedTags);

  const q10ans = findQuestionAnswer(questionAnswers, 'SH-Q10');
  const q10 = questionsById['SH-Q10'];
  const q10opt = findOption(q10, q10ans?.answer?.optionKey);
  const archetype = q10opt?.maps_to?.archetype || null;

  const scenario_weights = computeScenarioWeights(
    layerA,
    tagMap,
    questionAnswers,
    questionsById,
    scenarioFromText
  );

  const baseline = computeBaselineSignals(questionAnswers, questionsById);
  const core_traits = mergeTraitsFromTagsAndAnswers(tagMap, {
    answer: q10ans?.answer,
    ...q10
  });

  const defenseParts = [];
  const q03 = findQuestionAnswer(questionAnswers, 'SH-Q03');
  const q03opt = findOption(questionsById['SH-Q03'], q03?.answer?.optionKey);
  if (q03opt?.maps_to?.defense_mechanism) defenseParts.push(q03opt.maps_to.defense_mechanism);

  const profile = {
    choice: layerA.choice_text || '',
    description: layerA.self_description || '',
    quote: layerA.one_liner || '',
    age: layerA.age_at_fork,
    birth_year: layerA.birth_year,
    fork_year: layerA.fork_year,
    keywords: [
      ...(tagMap.trait || []).slice(0, 3),
      ...(tagMap.mood_at_fork || []).slice(0, 2)
    ],
    scenario_domain: scenarioFromText?.scenario_primary || scenarioFromText?.domain,
    scenario_label: scenarioFromText?.label
  };

  const tension_flags = detectTensionFlags(layerA, tagMap, questionAnswers);

  return {
    session_id: session_id || null,
    raw: {
      choice_text: layerA.choice_text,
      self_description: layerA.self_description,
      one_liner: layerA.one_liner,
      selected_tags: selectedTags.map((t) => t.label || t)
    },
    temporal: {
      birth_year: layerA.birth_year,
      fork_year: layerA.fork_year,
      age_at_fork: layerA.age_at_fork
    },
    scenario_weights,
    persona_signals: {
      core_traits,
      archetype,
      decision_tendency: buildDecisionTendency(questionAnswers, questionsById, archetype),
      soft_spots: buildSoftSpots(tagMap, questionAnswers, questionsById),
      growth_seed: buildGrowthSeed(tagMap, questionAnswers, questionsById),
      defense_mechanism: defenseParts.join(' + ') || null
    },
    baseline,
    tension_flags,
    profile,
    micro_questions: questionAnswers,
    meta: {
      longest_dwell_question: longestDwellQuestion(questionAnswers),
      scenario_user_corrected: Boolean(layerA.scenario_corrected),
      total_duration_ms: meta.total_duration_ms || 0
    }
  };
}

module.exports = {
  SCENARIO_DOMAINS,
  buildShadowPreview,
  buildFullProfile,
  detectTensionFlags,
  normalizeScenarioWeights
};
