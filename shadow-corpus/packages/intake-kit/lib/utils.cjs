'use strict';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function findQuestionAnswer(answers, id) {
  return (answers || []).find((a) => a.question_id === id || a.q_id === id);
}

function findOption(question, key) {
  return (question?.options || []).find((o) => o.key === key);
}

function normalizeSelectedTags(selectedTags) {
  return (selectedTags || []).map((t) => {
    if (typeof t === 'string') return { label: t, category_id: 'trait' };
    return {
      label: t.label || String(t),
      category_id: t.category_id || t.category || t.cat || 'trait'
    };
  });
}

function tagsByCategory(selectedTags) {
  const map = {};
  for (const t of normalizeSelectedTags(selectedTags)) {
    const cat = t.category_id || 'trait';
    if (!map[cat]) map[cat] = [];
    map[cat].push(t.label);
  }
  return map;
}

function longestDwellQuestion(answers) {
  if (!answers?.length) return null;
  let best = answers[0];
  for (const a of answers) {
    if ((a.duration_ms || 0) > (best.duration_ms || 0)) best = a;
  }
  return best.question_id || best.q_id || null;
}

function topScenarioDomain(weights) {
  const domains = Object.keys(weights || {});
  if (!domains.length) return null;
  return domains.reduce(
    (best, d) => ((weights[d] || 0) > (weights[best] || 0) ? d : best),
    domains[0]
  );
}

module.exports = {
  clamp,
  findQuestionAnswer,
  findOption,
  normalizeSelectedTags,
  tagsByCategory,
  longestDwellQuestion,
  topScenarioDomain
};
