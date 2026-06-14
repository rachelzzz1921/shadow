/**
 * Shadow Persona Agent — 规则版（对齐 persona_agent_prompt.md）
 * full_profile → persona JSON；行为题 > 标签 > 自我叙述
 */
'use strict';

const NAME_BY_ARCHETYPE = {
  the_endurer: ['阿岚', '沉舟', '陆远', '知晚'],
  the_doubter: ['林浅', '言默', '晚风', '未安'],
  the_pleaser: ['温言', '知予', '舒禾', '予安'],
  the_detached: ['闲云', '渡', '无名', '迟默']
};

const DEFENSE_LABELS = {
  overwork: 'overwork——用忙碌和高标准填满空隙，不给自我怀疑留缝隙',
  self_blame: 'self_blame——失败后先向内追责，用苛责维持「我还掌控着」的幻觉',
  suppression: 'suppression——用「没事」和照常过日子盖住真实感受',
  external_regulation: 'external_regulation——靠他人、聊天或刺激把焦虑转出去'
};

function ans(full, id) {
  const mq = full.micro_questions || [];
  const found = mq.find(a => a.question_id === id || a.q_id === id);
  return found?.answer || null;
}

function ansKey(full, id) {
  const a = ans(full, id);
  return a?.optionKey ?? a?.value ?? null;
}

function ansNum(full, id, fallback) {
  const v = ans(full, id)?.value;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function tagMapFromRaw(full) {
  const tags = full.raw?.selected_tags || [];
  const map = { trait: [], fear: [], value: [], relation_pressure: [], mood_at_fork: [] };
  for (const label of tags) {
    if (/^怕/.test(label) || ['怕被看穿', '怕不被爱', '怕选错'].some(x => label.includes(x))) {
      /* heuristic won't work well - tags are flat strings */
    }
  }
  /* Re-categorize from flat selected_tags using seed hints if available */
  const seed = window.__shadowSeedTags;
  if (seed?.tags) {
    for (const label of tags) {
      const row = seed.tags.find(t => t.label === label);
      const cat = row?.category_id || 'trait';
      if (!map[cat]) map[cat] = [];
      map[cat].push(label);
    }
  } else {
    map.trait = tags.slice(0, 4);
  }
  return map;
}

function topScenarioDomain(weights) {
  if (!weights) return null;
  return Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function deriveCoreTraits(full, tagMap, archetype, extSens, conflictKey) {
  const traits = [];
  const rawTraits = tagMap.trait || [];

  if (archetype === 'the_endurer' || rawTraits.some(t => /要强|执拗|上进/.test(t))) {
    traits.push('用尽全力地要强');
  }
  if (rawTraits.includes('好强又自卑') || (tagMap.fear || []).includes('怕被看穿')) {
    traits.push('把脆弱藏得很深');
  }
  if (archetype === 'the_doubter' || rawTraits.includes('敏感')) {
    traits.push('靠近目标时会先怀疑自己配不配');
  }
  if (archetype === 'the_pleaser' || rawTraits.includes('讨好型')) {
    traits.push('习惯先看别人的脸色再决定自己的表情');
  }
  if (archetype === 'the_detached' || rawTraits.includes('钝感')) {
    traits.push('用「无所谓」隔开自己和真实感受');
  }
  if (extSens > 70) traits.push('别人的评价会在心里停很久');
  if (conflictKey === 'B') traits.push('对自己比对任何人都狠');
  if (conflictKey === 'A') traits.push('宁可委屈自己也要把场面圆回来');

  if (!traits.length && full.raw?.self_description) {
    traits.push('在岔路口已经露出一点轮廓，但还不想被完全读懂');
  }
  if (!traits.length) traits.push('尚未被标签定义，行为题里才有真相');

  return [...new Set(traits)].slice(0, 4);
}

function deriveSoftSpots(full, tagMap, flags, extSens, faceFirst, topDomain) {
  const spots = [];
  const fears = tagMap.fear || [];
  const values = tagMap.value || [];
  const rels = tagMap.relation_pressure || [];

  if (fears.includes('怕被看穿') || values.includes('面子') || faceFirst) {
    spots.push(
      '怕被看穿底子不够好，所以从不在人前露怯，代价是她也没法在任何人面前真正松一口气'
    );
  }

  if (rels.includes('父母期待') || rels.includes('被寄予厚望') || ansKey(full, 'SH-Q04') === 'A') {
    spots.push(
      '把「被寄予厚望」当成了自己的渴望，分不清是父母要她好，还是她自己要——代价是赢了也不快乐，因为不确定那是不是自己想要的'
    );
  }

  if (fears.includes('怕不被爱') || values.includes('被认可')) {
    spots.push(
      '把「做到」当成做人的底线——因为她暗自怀疑，如果不做到，自己就一无是处；要强是盔甲，不是底色'
    );
  }

  if (fears.includes('怕自己其实不想要') || fears.includes('怕选错')) {
    spots.push(
      '靠近目标时会怀疑这到底是自己想要的，还是只是不想认输——代价是选完路仍不确定'
    );
  }

  if (extSens > 70 && !faceFirst) {
    spots.push(
      '过度在意外部评价，所以先表演出一个「还可以」的版本——代价是真实需要被推迟到没人看见的时候'
    );
  }

  if (ansKey(full, 'SH-Q09') === 'B') {
    spots.push(
      '做决定前需要某个人在场或某段对话来确认——代价是独自承担时更容易摇摆'
    );
  }

  if (topDomain === 'family' && !spots.some(s => s.includes('父母'))) {
    spots.push(
      '家庭相关的期待仍压在决策底层——代价是「为自己选」时常带着愧疚'
    );
  }

  for (const flag of flags || []) {
    if (flag.type === 'self_report_vs_behavior') {
      spots.push(
        '她需要别人，却羞于承认这份需要——独立是自我要求，不是真实结构，代价是关系里总在演「我可以」'
      );
    }
    if (flag.type === 'persistence_vs_detachment') {
      spots.push(
        '嘴上说「随便吧」，身体却在「再试一次」那边——假装无所谓是最后一层遮羞布，代价是连自己都搞不清到底在不在乎'
      );
    }
    if (flag.type === 'value_conflict') {
      spots.push(
        '在面子与真实之间反复横跳——嘴上想要真实，行为却先护体面，代价是 pivotal 年很难做「难看但正确」的选择'
      );
    }
  }

  if (!spots.length) {
    spots.push(
      '在岔路口已经做了选择，但尚未允许自己承认代价——这本身可能就是最深的软肋'
    );
  }

  return [...new Set(spots)].slice(0, 4);
}

function deriveCoreTension(full, tagMap, archetype, persist, flags) {
  if ((flags || []).some(f => f.type === 'self_report_vs_behavior')) {
    return '她拼命想证明「我可以独自扛」，可真正做决定时，仍在等某个人的确认或脸色——独立是表演，需要才是结构。';
  }
  if (archetype === 'the_endurer' && persist >= 55) {
    return '她拼命想用一个好结果证明「我行」，可她真正怕的，是万一证明了也还是不够——那她就再没有退路了。';
  }
  if (archetype === 'the_doubter') {
    return '她总在「再试一次」和「也许我不配」之间来回——不是不敢努力，是不敢相信努力会落到自己身上。';
  }
  if (archetype === 'the_pleaser') {
    return '她习惯先让别人满意，再问自己要不要——久而久之，连「我想要什么」都变成了需要推理的题目。';
  }
  if (archetype === 'the_detached') {
    return '她用「随便吧」把不甘心隔开，可越隔开，越要在别的地方加倍用力——假装无所谓本身就很用力。';
  }
  if ((tagMap.fear || []).includes('怕让父母失望')) {
    return '她嘴上说为自己选，心里仍背着「不能让他们失望」——这条岔路像是自己的，重量却是全家的。';
  }
  const choice = full.raw?.choice_text || '';
  if (choice) {
    return `站在「${choice.slice(0, 24)}${choice.length > 24 ? '…' : ''}」这个岔路口，她选的不只是路，而是选要成为哪一种被看见的人。`;
  }
  return '她以为自己在选一条路，其实是在选一种被看见、被认可、被允许存在的方式。';
}

function deriveDecisionTendency(full, archetype, persist, conflictKey, faceFirst) {
  const parts = [];

  if (persist >= 76) {
    parts.push(
      '在「再努力一次」和「承认就这样」之间，结构性地选前者——因为「承认就这样」对她等于承认自己不行，而那是她无法面对的。所以哪怕在该放手的路口，她也会再赌一次。'
    );
  } else if (persist >= 51) {
    parts.push(
      '在「再给自己一次机会」和「接受现状」之间，倾向前者——她会先算成本，但算完往往还是不甘心。'
    );
  } else if (persist <= 25) {
    parts.push(
      '在「再试一次」和「算了」之间，她更常学会停下——但这不意味着没有遗憾，只是怕再赌一次的代价更大。'
    );
  } else {
    parts.push(
      '在「再撑一下」和「承认不确定」之间反复权衡——没有固定答案，取决于当时谁在看、什么面子挂不住。'
    );
  }

  if (conflictKey === 'B') parts.push('冲突里先顶住，很少先低头。');
  if (conflictKey === 'A') parts.push('冲突里先圆场，倾向用妥协换关系不断。');
  if (faceFirst) parts.push('取舍时先护住体面，哪怕内心已经动摇。');

  if (archetype === 'the_pleaser') {
    parts.push('若 pivotal 年涉及「让别人失望」与「听自己的」，她往往先选前者。');
  }

  return parts.join('');
}

function deriveGrowthSeed(full, softSpots, persist, faceFirst) {
  if (faceFirst || (full.raw?.selected_tags || []).includes('面子')) {
    return '也许有一天她会发现，「丢脸但真实」不等于「整个人失败」——但这颗种子可能七年都不发芽，她也可能到最后都没学会在人前露怯。';
  }
  if (persist >= 70) {
    return '也许有一天她会发现，「承认这次就这样」不等于「我这个人不行」——但这颗种子可能七年都不发芽，她也可能到最后都没学会停下来。';
  }
  if (softSpots.some(s => s.includes('父母') || s.includes('被寄予厚望'))) {
    return '也许有一天她能分清「他们要的」和「我要的」——但这可能很慢、很反复，甚至不发生。';
  }
  return '也许有一天她能在不确定里仍站得住——不保证会发生，Shadow 允许这条线一直悬着。';
}

function deriveValueHierarchy(full, tagMap, faceFirst, extSens) {
  const hierarchy = [];
  const values = tagMap.value || [];

  if (faceFirst || values.includes('面子')) hierarchy.push('面子');
  if (values.includes('被认可') || extSens > 65) hierarchy.push('被认可');
  if (values.includes('成就') || values.includes('卓越')) hierarchy.push('成就');
  if (values.includes('关系优先')) hierarchy.push('关系');
  if (values.includes('稳定')) hierarchy.push('稳定');
  if (values.includes('自由')) hierarchy.push('自由');
  if (values.includes('真实') && !faceFirst) hierarchy.push('真实');

  const rankMap = { A: '关系', B: '成就', C: '自由', D: '被理解' };
  const q08 = ans(full, 'SH-Q08');
  const topRank = Array.isArray(q08?.orderedKeys) ? q08.orderedKeys[0] : null;
  if (topRank && rankMap[topRank] && !hierarchy.includes(rankMap[topRank])) {
    hierarchy.unshift(rankMap[topRank]);
  }

  if (!hierarchy.includes('自己真正想要什么')) {
    hierarchy.push('（很靠后才是）自己真正想要什么');
  }

  return [...new Set(hierarchy)].slice(0, 6);
}

function deriveVoiceNotes(full, archetype) {
  const one = full.raw?.one_liner || '';
  const desc = full.raw?.self_description || '';
  const bits = [];

  if (one) bits.push(`习惯说「${one.replace(/[「」]/g, '')}」`);
  if (/撑|没事|可以/.test(one + desc)) bits.push('报喜不报忧，被关心时会下意识转移话题');
  if (archetype === 'the_endurer') bits.push('硬气，但硬气里藏着累');
  if (archetype === 'the_doubter') bits.push('句子常带问号，或在句尾留半句不说');
  if (archetype === 'the_pleaser') bits.push('先确认对方舒不舒服，再表达自己的意思');
  if (archetype === 'the_detached') bits.push('语气平，常用「随便」「都行」把话题关掉');

  if (!bits.length) bits.push('话不多，关键处会用一句短句盖住长情绪');

  return bits.join('；');
}

function deriveNarrativeWarnings(full, tagMap, archetype, relPressure) {
  const warnings = [
    '别把缺点重写成优点——写出代价，不写励志闪光点',
    '禁止强行和解、强行成长、强行圆满；允许七年后的遗憾原样存在'
  ];

  if (archetype === 'the_endurer' || (tagMap.trait || []).some(t => /要强/.test(t))) {
    warnings.push('别让她轻易想通、轻易和父母和解——成长如果发生，也会很慢、很反复、甚至不发生');
    warnings.push('她赢的时候不该是纯粹的爽，要带着「然后呢」的空');
  }

  if (relPressure) {
    warnings.push('别让她和父母（或重要他人）轻易达成理解——这不一定是这条线的真实终点');
  }

  if ((tagMap.fear || []).includes('怕被看穿')) {
    warnings.push('别在 pivotal 年让她突然「想开了」——被看穿的恐惧需要多次试探才会松动一点');
  }

  warnings.push('严禁「每条路都有意义」「一切都是最好的安排」类鸡汤');

  return [...new Set(warnings)].slice(0, 5);
}

function pickShadowName(full, archetype) {
  const pool = NAME_BY_ARCHETYPE[archetype] || NAME_BY_ARCHETYPE.the_endurer;
  const birth = full.temporal?.birth_year;
  const idx = birth ? birth % pool.length : Math.floor(Math.random() * pool.length);
  return pool[idx];
}

function analyze(fullProfile) {
  if (!fullProfile || !fullProfile.raw) {
    throw new Error('ShadowPersonaAgent.analyze: full_profile 无效');
  }

  const tagMap = tagMapFromRaw(fullProfile);
  const signals = fullProfile.persona_signals || {};
  const archetype = signals.archetype || null;
  const flags = fullProfile.tension_flags || [];

  const persist = ansNum(fullProfile, 'SH-Q06', 50);
  const extSens = ansNum(fullProfile, 'SH-Q02', 50);
  const conflictKey = ansKey(fullProfile, 'SH-Q01');
  const faceFirst = ansKey(fullProfile, 'SH-Q07') === 'A';
  const topDomain = topScenarioDomain(fullProfile.scenario_weights);
  const relPressure = (tagMap.relation_pressure || []).length > 0 || ansKey(fullProfile, 'SH-Q04') === 'A';

  const soft_spots = deriveSoftSpots(fullProfile, tagMap, flags, extSens, faceFirst, topDomain);
  const defenseKey = signals.defense_mechanism || null;

  return {
    shadow_name: pickShadowName(fullProfile, archetype),
    core_traits: deriveCoreTraits(fullProfile, tagMap, archetype, extSens, conflictKey),
    core_tension: deriveCoreTension(fullProfile, tagMap, archetype, persist, flags),
    soft_spots,
    decision_tendency: deriveDecisionTendency(fullProfile, archetype, persist, conflictKey, faceFirst),
    defense_mechanism: DEFENSE_LABELS[defenseKey] || defenseKey || '尚未完全暴露的自我保护方式',
    growth_seed: deriveGrowthSeed(fullProfile, soft_spots, persist, faceFirst),
    value_hierarchy: deriveValueHierarchy(fullProfile, tagMap, faceFirst, extSens),
    voice_notes: deriveVoiceNotes(fullProfile, archetype),
    narrative_warnings: deriveNarrativeWarnings(fullProfile, tagMap, archetype, relPressure),
    _meta: {
      agent: 'rule-based-v1',
      source: 'persona_agent_prompt.md',
      generated_at: new Date().toISOString()
    }
  };
}

window.ShadowPersonaAgent = {
  VERSION: '1.0.0-rule',
  analyze
};
