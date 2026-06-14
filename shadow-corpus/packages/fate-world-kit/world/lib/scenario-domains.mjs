'use strict';

/**
 * 六类场景 Agent — 命运侧重的基本域。
 * 与 Year / Beats 管线中的 Scenario 子 lens 对齐。
 */
export const SCENARIO_DOMAINS = [
  'family',
  'love',
  'friendship',
  'academic',
  'career',
  'self_growth'
];

export const SCENARIO_LABELS = {
  family: '亲情',
  love: '爱情',
  friendship: '友情',
  academic: '学业',
  career: '事业',
  self_growth: '自我成长'
};

export const SCENARIO_BRIEFS = {
  family: '家庭期待、父母关系、责任与愧疚',
  love: '分手复合、异地恋、亲密关系选择',
  friendship: '朋友疏远、圈子变化、陪伴与距离',
  academic: '复读、考研、换专业、留学',
  career: '就业、考公、创业、转行、城市机会',
  self_growth: '走出舒适区、身份认同、人生方向、长期遗憾'
};

/** micro category → 默认 scenario */
export const CATEGORY_SCENARIO = {
  family: 'family',
  school: 'academic',
  work: 'career',
  romance: 'love',
  money: 'career',
  health: 'self_growth',
  neighborhood: 'friendship',
  digital: 'friendship',
  policy_touch: 'career'
};

/** tag → scenario 加权（可多个） */
export const TAG_SCENARIO_HINTS = {
  spring: ['family'],
  marriage: ['family', 'love'],
  parent: ['family'],
  sibling: ['family'],
  gaokao: ['academic'],
  exam: ['academic'],
  postgrad: ['academic'],
  thesis: ['academic'],
  intern: ['career', 'academic'],
  layoff: ['career'],
  '996': ['career', 'self_growth'],
  job: ['career'],
  dating: ['love'],
  breakup: ['love'],
  crush: ['love'],
  peer: ['friendship', 'self_growth'],
  dorm: ['friendship', 'academic'],
  club: ['friendship'],
  mental: ['self_growth'],
  burnout: ['self_growth', 'career'],
  anxiety: ['self_growth'],
  covid: ['family', 'self_growth'],
  ai: ['career', 'self_growth']
};

/** macro category → 次要 scenario 提示（宏观事件也能推命运侧重） */
export const MACRO_SCENARIO_HINTS = {
  education: ['academic'],
  employment: ['career'],
  housing: ['family', 'career'],
  economy: ['career'],
  society: ['family', 'self_growth'],
  disaster_crisis: ['family', 'self_growth']
};

/** profile / persona 文本关键词 → scenario 加分 */
export const KEYWORD_SCENARIO = [
  { re: /复读|高考|考研|学业|学校|专业|留学|保研|四六级/, domain: 'academic', boost: 0.35 },
  { re: /父母|家里|母亲|父亲|亲情|愧疚|责任|期待/, domain: 'family', boost: 0.35 },
  { re: /分手|恋爱|喜欢|暧昧|相亲|异地|结婚|感情/, domain: 'love', boost: 0.35 },
  { re: /朋友|室友|圈子|孤独|合群|疏远/, domain: 'friendship', boost: 0.3 },
  { re: /工作|就业|实习|裁员|创业|考公|编制|996|转行/, domain: 'career', boost: 0.35 },
  { re: /迷茫|身份|成长|遗憾|自尊|要强|不甘|怕.*看穿/, domain: 'self_growth', boost: 0.35 }
];

/**
 * 推断 micro / macro 条目的 scenario 域（可多标签，取主域）
 * @returns {string}
 */
export function inferScenario(item) {
  const tags = item.tags || [];
  const votes = {};

  const cat = CATEGORY_SCENARIO[item.category];
  if (cat) votes[cat] = (votes[cat] || 0) + 2;

  for (const tag of tags) {
    for (const d of TAG_SCENARIO_HINTS[tag] || []) {
      votes[d] = (votes[d] || 0) + 1;
    }
  }

  if (item.category && MACRO_SCENARIO_HINTS[item.category]) {
    for (const d of MACRO_SCENARIO_HINTS[item.category]) {
      votes[d] = (votes[d] || 0) + 0.5;
    }
  }

  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  if (ranked.length) return ranked[0][0];
  return CATEGORY_SCENARIO[item.category] || 'self_growth';
}

export function uniformWeights() {
  const w = 1 / SCENARIO_DOMAINS.length;
  return Object.fromEntries(SCENARIO_DOMAINS.map((d) => [d, w]));
}

export function normalizeWeights(raw) {
  const out = {};
  let sum = 0;
  for (const d of SCENARIO_DOMAINS) {
    const v = Math.max(0, Number(raw[d]) || 0);
    out[d] = v;
    sum += v;
  }
  if (sum <= 0) return uniformWeights();
  for (const d of SCENARIO_DOMAINS) out[d] /= sum;
  return out;
}

export function topDomains(weights, n = 2) {
  return SCENARIO_DOMAINS
    .map((d) => ({ domain: d, weight: weights[d], label: SCENARIO_LABELS[d] }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, n);
}
