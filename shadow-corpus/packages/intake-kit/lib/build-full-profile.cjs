'use strict';

const { FULL_PROFILE_SCHEMA_VERSION } = require('./schema.cjs');
const {
  SCENARIO_DOMAINS,
  reduceMapsFromAnswers,
  findOption
} = require('./maps-to-reducer.cjs');
const { detectTensionFlags } = require('./tension-detectors.cjs');
const {
  clamp,
  findQuestionAnswer,
  normalizeSelectedTags,
  tagsByCategory,
  longestDwellQuestion,
  topScenarioDomain
} = require('./utils.cjs');

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

function mergeTraitsFromTagsAndAnswers(tagMap, q10, mapsAcc) {
  const traits = new Set();
  for (const label of tagMap.trait || []) traits.add(label);
  for (const t of mapsAcc?.personaSignals?.core_traits || []) traits.add(t);
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

function computeScenarioWeights(layerA, tagMap, answers, questionsById, scenarioFromText, mapsAcc) {
  const raw = Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, 1 / SCENARIO_DOMAINS.length]));

  for (const d of SCENARIO_DOMAINS) {
    raw[d] += Number(mapsAcc?.scenarioRaw?.[d]) || 0;
  }

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

function resolveArchetype(mapsAcc, q10ans, q10) {
  if (mapsAcc?.personaSignals?.archetype) return mapsAcc.personaSignals.archetype;
  const q10opt = findOption(q10, q10ans?.answer?.optionKey);
  return q10opt?.maps_to?.archetype || null;
}

function resolveDefenseMechanism(mapsAcc, answers, questionsById) {
  const parts = [];
  if (mapsAcc?.personaSignals?.defense_mechanism) {
    parts.push(mapsAcc.personaSignals.defense_mechanism);
  }
  const q03 = findQuestionAnswer(answers, 'SH-Q03');
  const q03opt = findOption(questionsById['SH-Q03'], q03?.answer?.optionKey);
  if (q03opt?.maps_to?.defense_mechanism) parts.push(q03opt.maps_to.defense_mechanism);
  return parts.filter(Boolean).join(' + ') || null;
}

/**
 * 聚合三层 intake → full_profile（喂 Persona / Fate / Story）
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
  const structuredTags = normalizeSelectedTags(selectedTags);
  const questionsById = Object.fromEntries((questions || []).map((q) => [q.id, q]));
  const tagMap = tagsByCategory(structuredTags);
  const mapsAcc = reduceMapsFromAnswers(questionAnswers, questionsById);

  const q10ans = findQuestionAnswer(questionAnswers, 'SH-Q10');
  const q10 = questionsById['SH-Q10'];
  const archetype = resolveArchetype(mapsAcc, q10ans, q10);

  const scenario_weights = computeScenarioWeights(
    layerA,
    tagMap,
    questionAnswers,
    questionsById,
    scenarioFromText,
    mapsAcc
  );

  const baseline = computeBaselineSignals(questionAnswers, questionsById);
  const core_traits = mergeTraitsFromTagsAndAnswers(tagMap, {
    answer: q10ans?.answer,
    ...q10
  }, mapsAcc);

  const topDomain = topScenarioDomain(scenario_weights);
  const profile = {
    choice: layerA.choice_text || '',
    description: layerA.self_description || '',
    quote: layerA.one_liner || '',
    age: layerA.age_at_fork,
    birth_year: layerA.birth_year,
    fork_year: layerA.fork_year,
    gender: layerA.gender || null,
    keywords: [
      ...(tagMap.trait || []).slice(0, 3),
      ...(tagMap.mood_at_fork || []).slice(0, 2)
    ],
    selected_tags: structuredTags,
    scenario_domain:
      scenarioFromText?.scenario_primary || scenarioFromText?.domain || topDomain,
    scenario_label: scenarioFromText?.label || null
  };

  const tension_flags = detectTensionFlags(layerA, tagMap, questionAnswers);

  return {
    session_id: session_id || null,
    raw: {
      choice_text: layerA.choice_text,
      self_description: layerA.self_description,
      one_liner: layerA.one_liner,
      gender: layerA.gender || null,
      selected_tags: structuredTags.map((t) => ({
        label: t.label,
        category_id: t.category_id
      }))
    },
    temporal: {
      birth_year: layerA.birth_year,
      fork_year: layerA.fork_year,
      age_at_fork: layerA.age_at_fork,
      gender: layerA.gender || null
    },
    scenario_weights,
    persona_signals: {
      core_traits,
      archetype,
      decision_tendency: buildDecisionTendency(questionAnswers, questionsById, archetype),
      soft_spots: buildSoftSpots(tagMap, questionAnswers, questionsById),
      growth_seed: buildGrowthSeed(tagMap, questionAnswers, questionsById),
      defense_mechanism: resolveDefenseMechanism(mapsAcc, questionAnswers, questionsById)
    },
    baseline,
    tension_flags,
    profile,
    micro_questions: questionAnswers,
    meta: {
      schema_version: FULL_PROFILE_SCHEMA_VERSION,
      longest_dwell_question: longestDwellQuestion(questionAnswers),
      scenario_user_corrected: Boolean(layerA.scenario_corrected),
      scenario_detected: scenarioFromText?.domain || scenarioFromText?.top || topDomain,
      scenario_confidence: scenarioFromText?.conf ?? scenarioFromText?.confidence ?? null,
      total_duration_ms: meta.total_duration_ms || 0,
      answered: questionAnswers?.length || meta.answered || 0
    }
  };
}

module.exports = {
  SCENARIO_DOMAINS,
  SCENARIO_LABEL_TO_DOMAIN,
  buildFullProfile,
  normalizeScenarioWeights,
  computeScenarioWeights,
  computeBaselineSignals
};
