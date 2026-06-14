'use strict';

/**
 * Intake 预设 — 与 demo-stories.js STORY_CATALOG / Golden fixture 对齐
 */
(function exportIntakePresets(global) {
  const SCENARIO_LABELS = {
    family: '亲情',
    love: '爱情',
    friendship: '友情',
    academic: '学业',
    career: '事业',
    self_growth: '自我成长'
  };

  const PRESETS = [
    {
      id: 'fuxduxian',
      line_name: '复读线',
      shadow_name: '阿岚',
      scenario_primary: 'academic',
      blurb: '再坐一年，教室最后一排',
      layerA: {
        choice_text: '如果当年我去复读了，而不是直接上了那所大专',
        self_description: '我习惯用成绩证明自己，但每次靠近一个目标，又会怀疑自己是不是真的想要它。',
        one_liner: '我宁愿后悔做过，也不后悔没做。',
        birth_year: 2001,
        fork_year: 2019,
        age_at_fork: 18,
        gender: 'female'
      },
      tags: {
        trait: ['要强', '习惯藏话'],
        mood_at_fork: ['不甘'],
        fear: ['怕被看穿'],
        value: ['成就'],
        relation_pressure: ['父母期待'],
        scenario_hint: ['学业']
      }
    },
    {
      id: 'linwan',
      line_name: '出国读研线',
      shadow_name: '林晚',
      scenario_primary: 'academic',
      blurb: '瞒着所有人买了机票',
      layerA: {
        choice_text: '如果当年我没有考公，而是自己攒钱出国读研',
        self_description: '我从小听话，但听话从来不是因为我真的觉得那条路对。我只是不知道怎么开口说我想要别的。',
        one_liner: '那张机票我存了两年。',
        birth_year: 2000,
        fork_year: 2022,
        age_at_fork: 22,
        gender: 'female'
      },
      tags: {
        trait: ['独立', '习惯藏话'],
        mood_at_fork: ['愧疚'],
        fear: ['怕被看穿', '怕让父母失望'],
        value: ['成就', '自由'],
        relation_pressure: ['父母期待'],
        scenario_hint: ['学业']
      }
    },
    {
      id: 'heartbeat_line',
      line_name: '心动爱情线',
      shadow_name: '许星遥',
      scenario_primary: 'love',
      blurb: '选了心动的人',
      layerA: {
        choice_text: '如果当年我选择了那个让我心动的人，而不是父母说的「合适」',
        self_description: '现实里的她嫁给了合适的人，影子里的她选择了那个让她心动的人。我知道代价，但还是想走一次。',
        one_liner: '我不是想重来一次，我只是想知道当时没走的那条路。',
        birth_year: 1998,
        fork_year: 2023,
        age_at_fork: 25,
        gender: 'female'
      },
      tags: {
        trait: ['敏感', '冲动'],
        mood_at_fork: ['怕后悔'],
        fear: ['怕不稳定', '怕自己其实不想要'],
        value: ['关系优先', '真实'],
        relation_pressure: ['伴侣期待'],
        scenario_hint: ['爱情']
      }
    },
    {
      id: 'zhoudran',
      line_name: '插画师线',
      shadow_name: '周染',
      scenario_primary: 'career',
      blurb: '志愿表上没填计算机',
      layerA: {
        choice_text: '如果当年我没有选计算机，而是去做自由插画师',
        self_description: '我填志愿的时候没有犹豫，因为所有人都说计算机好就业。但我其实知道自己想要什么，只是没说出口。',
        one_liner: '那两百块是我画的，不是代码跑出来的。',
        birth_year: 2002,
        fork_year: 2020,
        age_at_fork: 18,
        gender: 'female'
      },
      tags: {
        trait: ['讨好型', '晚熟'],
        mood_at_fork: ['迷茫'],
        fear: ['怕不稳定', '怕自己其实不想要'],
        value: ['自由', '真实'],
        relation_pressure: ['父母期待'],
        scenario_hint: ['事业']
      }
    }
  ];

  function byId(id) {
    return PRESETS.find((p) => p.id === id) || null;
  }

  function resolveTags(preset, tagsData) {
    if (!preset?.tags || !tagsData?.tags) return [];
    const selected = [];
    for (const [catId, labels] of Object.entries(preset.tags)) {
      for (const label of labels) {
        const tag = tagsData.tags.find((t) => t.category_id === catId && t.label === label);
        if (tag) {
          selected.push({ ...tag, category_id: catId });
        } else {
          selected.push({
            id: `preset-${catId}-${label}`,
            category_id: catId,
            label,
            is_custom: true
          });
        }
      }
    }
    return selected;
  }

  function scenarioFromPreset(preset) {
    const domain = preset.scenario_primary || 'self_growth';
    const weights = Object.fromEntries(
      Object.keys(SCENARIO_LABELS).map((d) => [d, d === domain ? 0.42 : 0.116])
    );
    return {
      top: domain,
      conf: 0.86,
      domain,
      label: SCENARIO_LABELS[domain] || domain,
      scenario_primary: domain,
      confidence: 0.86,
      scenario_weights: weights
    };
  }

  function mockHref(presetId) {
    if (!presetId || presetId === 'fuxduxian') return 'demo.html?from=intake';
    return `demo.html?from=intake&story=${encodeURIComponent(presetId)}`;
  }

  global.ShadowIntakePresets = {
    PRESETS,
    SCENARIO_LABELS,
    byId,
    resolveTags,
    scenarioFromPreset,
    mockHref
  };
})(window);
