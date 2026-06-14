'use strict';

/** 浏览器端场景域分类（与 world/lib/scenario-domains.mjs 规则同步） */
(function exportScenarioClassify() {
  const LABELS = {
    family: '亲情',
    love: '爱情',
    friendship: '友情',
    academic: '学业',
    career: '事业',
    self_growth: '自我成长'
  };

  const BRIEFS = {
    family: '家庭期待、父母关系、责任与愧疚',
    love: '分手复合、异地恋、亲密关系选择',
    friendship: '朋友疏远、圈子变化、陪伴与距离',
    academic: '复读、考研、换专业、留学',
    career: '就业、考公、创业、转行、城市机会',
    self_growth: '走出舒适区、身份认同、人生方向、长期遗憾'
  };

  const RULES = [
    [/复读|高考|考研|学业|学校|专业|留学|保研|四六级|转专业|出国读书|出国/, 'academic', 0.35],
    [/父母|家里|母亲|父亲|亲情|愧疚|责任|期待|家庭/, 'family', 0.35],
    [/分手|复合|恋爱|喜欢|暧昧|相亲|异地|结婚|感情|亲密关系/, 'love', 0.35],
    [/朋友|室友|圈子|孤独|合群|疏远|分流|陪伴/, 'friendship', 0.3],
    [/工作|就业|实习|裁员|创业|考公|编制|996|转行|城市机会/, 'career', 0.35],
    [/迷茫|身份|成长|遗憾|自尊|要强|不甘|舒适区|人生方向|长期遗憾/, 'self_growth', 0.35]
  ];

  const DOMAINS = Object.keys(LABELS);

  function classify(text, opts = {}) {
    const keywords = Array.isArray(opts.keywords) ? opts.keywords : [];
    const blob = [text, keywords.join('、'), opts.description || ''].filter(Boolean).join('\n');
    const raw = Object.fromEntries(DOMAINS.map(d => [d, 1 / DOMAINS.length]));
    const matched = [];

    for (const [re, domain, boost] of RULES) {
      if (re.test(blob)) {
        raw[domain] = (raw[domain] || 0) + boost;
        matched.push({ domain, label: LABELS[domain] });
      }
    }

    let sum = 0;
    for (const d of DOMAINS) sum += raw[d];
    const weights = Object.fromEntries(DOMAINS.map(d => [d, raw[d] / sum]));

    const ranked = DOMAINS
      .map(d => ({ domain: d, weight: weights[d], label: LABELS[d] }))
      .sort((a, b) => b.weight - a.weight);

    const top = ranked[0];
    const second = ranked[1];
    return {
      domain: top.domain,
      label: top.label,
      agent: `${top.label} Agent`,
      brief: BRIEFS[top.domain],
      confidence: Math.max(0, top.weight - (second?.weight || 0)),
      scenario_primary: top.domain,
      scenario_secondary: second?.domain || null,
      scenario_weights: weights,
      matched
    };
  }

  window.ShadowScenarioClassify = {
    classify,
    classifyProfile(profile) {
      const keywords = Array.isArray(profile?.keywords)
        ? profile.keywords
        : String(profile?.keywords || '').split(/[、,，\s]+/).filter(Boolean);
      return classify(profile?.choice || '', {
        keywords,
        description: profile?.description || ''
      });
    }
  };
})();
