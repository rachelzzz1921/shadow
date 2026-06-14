/**
 * Shadow Demo — 六域场景 Agent UI 主题
 * 对齐 shadow-corpus/world/lib/scenario-domains.mjs · 04-scenario-weight-system.md
 */
'use strict';

const SCENARIO_THEMES = {
  family: {
    id: 'family',
    label: '亲情',
    brief: '家庭期待 · 父母关系 · 责任与愧疚',
    transition: 'door',
    walkLine: '……门开了，先别说话。',
    walkLineBack: '（把门轻轻带上）',
    sprite: 'assets/kenney/tiles/tile_0105.png',
    colors: {
      paper: '#f8ede4',
      paperDeep: '#edd9c8',
      accent: '#c97b5a',
      accentBright: '#e8a080',
      accentDeep: '#8a5038',
      glow: 'rgba(201, 123, 90, 0.32)',
      wipe: '#b86848',
      sage: '#a8b888'
    }
  },
  love: {
    id: 'love',
    label: '爱情',
    brief: '分手复合 · 异地 · 亲密关系选择',
    transition: 'pulse',
    walkLine: '你发的那条消息，还在输入框里。',
    walkLineBack: '……算了，不发了。',
    sprite: 'assets/kenney/tiles/tile_0098.png',
    colors: {
      paper: '#f9eef2',
      paperDeep: '#efdce6',
      accent: '#c86b88',
      accentBright: '#f0a0b8',
      accentDeep: '#8a4058',
      glow: 'rgba(200, 107, 136, 0.28)',
      wipe: '#c87898',
      sage: '#d8a8b8'
    }
  },
  friendship: {
    id: 'friendship',
    label: '友情',
    brief: '朋友分流 · 圈子变化 · 陪伴与疏远',
    transition: 'wave',
    walkLine: '群里又有人退群了，你没点进去看。',
    walkLineBack: '原来一个人吃饭，也没那么糟。',
    sprite: 'assets/kenney/tiles/tile_0104.png',
    colors: {
      paper: '#eef6f0',
      paperDeep: '#dcebe0',
      accent: '#5a9878',
      accentBright: '#88c8a0',
      accentDeep: '#386850',
      glow: 'rgba(90, 152, 120, 0.28)',
      wipe: '#68a888',
      sage: '#7da87a'
    }
  },
  academic: {
    id: 'academic',
    label: '学业',
    brief: '复读 · 考研 · 换专业 · 留学',
    transition: 'walk',
    walkLine: '书包很沉。最后一排，靠窗。',
    walkLineBack: '试卷还在夹层里，先走吧。',
    sprite: 'assets/kenney/tiles/tile_0096.png',
    colors: {
      paper: '#f7f0e3',
      paperDeep: '#ebe3d1',
      accent: '#c8863a',
      accentBright: '#f0b85c',
      accentDeep: '#9a6328',
      glow: 'rgba(200, 134, 58, 0.28)',
      wipe: '#c8863a',
      sage: '#7da87a'
    }
  },
  career: {
    id: 'career',
    label: '事业',
    brief: '就业 · 考公 · 创业 · 转行 · 城市机会',
    transition: 'commute',
    walkLine: '简历改到第三版，还是不太像自己。',
    walkLineBack: '下一站，先把自己交出去。',
    sprite: 'assets/kenney/tiles/tile_0122.png',
    colors: {
      paper: '#eef0f4',
      paperDeep: '#dce0e8',
      accent: '#4a6888',
      accentBright: '#78a0c0',
      accentDeep: '#2a4058',
      glow: 'rgba(74, 104, 136, 0.25)',
      wipe: '#506880',
      sage: '#88a8b8'
    }
  },
  self_growth: {
    id: 'self_growth',
    label: '自我成长',
    brief: '舒适区 · 身份认同 · 人生方向 · 长期遗憾',
    transition: 'step',
    walkLine: '够了——这句话，练了很多年。',
    walkLineBack: '在低处，也可以很稳。',
    sprite: 'assets/kenney/tiles/tile_0097.png',
    colors: {
      paper: '#f4f0ea',
      paperDeep: '#e8e0d4',
      accent: '#8a78a8',
      accentBright: '#b8a8d0',
      accentDeep: '#5a4878',
      glow: 'rgba(138, 120, 168, 0.28)',
      wipe: '#9888b0',
      sage: '#7da87a'
    }
  }
};

/** @param {string} key */
function getTheme(key) {
  return SCENARIO_THEMES[key] || SCENARIO_THEMES.academic;
}

/** 写入 CSS 变量 + body[data-scenario] */
function applyScenario(key) {
  const t = getTheme(key);
  const root = document.documentElement;
  const c = t.colors;
  root.style.setProperty('--paper', c.paper);
  root.style.setProperty('--paper-deep', c.paperDeep);
  root.style.setProperty('--amber', c.accent);
  root.style.setProperty('--amber-bright', c.accentBright);
  root.style.setProperty('--amber-deep', c.accentDeep);
  root.style.setProperty('--amber-glow', c.glow);
  root.style.setProperty('--scenario-wipe', c.wipe);
  root.style.setProperty('--scenario-wipe-deep', c.accentDeep || c.wipe);
  root.style.setProperty('--sage', c.sage);
  root.style.setProperty('--sprite-char', `url('${t.sprite}')`);
  document.body.dataset.scenario = t.id;
  return t;
}

/** @param {number} pageIdx @param {object} story STORY */
function scenarioForPage(pageIdx, story) {
  const LANDING = 0;
  const YEAR_START = 1;
  const finalPage = 1 + story.years.length;

  if (pageIdx === LANDING) {
    return story.scenario_primary || 'academic';
  }
  if (pageIdx >= YEAR_START && pageIdx < finalPage) {
    const y = story.years[pageIdx - YEAR_START];
    return y?.scenario || story.scenario_primary || 'academic';
  }
  if (pageIdx === finalPage) {
    return story.scenario_secondary || 'self_growth';
  }
  return 'academic';
}

window.ShadowScenarios = {
  SCENARIO_THEMES,
  getTheme,
  applyScenario,
  scenarioForPage
};
