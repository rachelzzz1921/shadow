/**
 * Shadow Demo — 多故事 catalog + Golden JSON → Demo STORY 适配
 */
'use strict';

const STORY_CATALOG = [
  {
    id: 'wufuxdu',
    line_name: '未复读线',
    shadow_name: '阿岚',
    scenario_primary: 'self_growth',
    scenario_secondary: 'friendship',
    file: 'stories/未复读线-阿岚.json'
  },
  {
    id: 'fuxduxian',
    line_name: '旧复读线',
    shadow_name: '阿岚',
    scenario_primary: 'academic',
    file: 'stories/复读线.json'
  },
  {
    id: 'linwan',
    line_name: '出国读研线',
    shadow_name: '林晚',
    scenario_primary: 'academic',
    scenario_secondary: 'self_growth',
    file: 'stories/出国读研线-林晚.json'
  },
  {
    id: 'heartbeat_line',
    line_name: '心动爱情线',
    shadow_name: '许星遥',
    scenario_primary: 'love',
    scenario_secondary: 'self_growth',
    file: 'stories/心动爱情线-许星遥.json'
  },
  {
    id: 'zhoudran',
    line_name: '插画师线',
    shadow_name: '周染',
    scenario_primary: 'career',
    scenario_secondary: 'self_growth',
    file: 'stories/插画师线-周染.json'
  }
];

/** environment → 六域 scenario */
const ENV_SCENARIO = {
  classroom: 'academic',
  dorm_night: 'academic',
  cafeteria: 'friendship',
  stage: 'career',
  trainstation: 'self_growth',
  postoffice: 'family',
  office: 'career',
  home: 'family',
  hospital: 'family',
  studio: 'career',
  'old-street': 'love',
  'rental-house': 'love',
  wedding: 'love',
  birthday: 'love',
  'phone-light': 'self_growth',
  'rain-dusk': 'love',
  apartment: 'love',
  'home-room': 'self_growth',
  restaurant: 'love',
  hotel: 'friendship',
  road: 'self_growth'
};

/** 缺 visual 字段时的默认（按 scenario） */
const SCENARIO_VISUAL = {
  academic: { environment: 'classroom', pose: 'wait', prop: 'desk', city: 'city2', scene: 'rain' },
  love: { environment: 'home', pose: 'phone', prop: 'phone', city: 'city5', scene: 'night' },
  friendship: { environment: 'cafeteria', pose: 'wait', prop: 'desk', city: 'city5', scene: 'city' },
  career: { environment: 'office', pose: 'doing', prop: 'laptop', city: 'city6', scene: 'office' },
  family: { environment: 'home', pose: 'phone', prop: 'phone', city: 'city1', scene: 'night' },
  self_growth: { environment: 'home', pose: 'wait', prop: 'desk', city: 'city7', scene: 'night' }
};

/** 按故事 id + 年序 override scenario */
const YEAR_SCENARIO_HINTS = {
  linwan: [1, 2, 3, 4, 5, 6, 7].map((y, i) =>
    ['academic', 'family', 'career', 'career', 'self_growth', 'friendship', 'family'][i]
  ),
  heartbeat_line: ['love', 'love', 'love', 'love', 'love', 'self_growth', 'love'],
  zhoudran: ['career', 'family', 'career', 'career', 'self_growth', 'career', 'family']
};

function normalizeKeywords(kw) {
  if (Array.isArray(kw)) return kw;
  if (typeof kw === 'string') {
    return kw.split(/[、,，\s]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function adaptYear(year, storyId, storyPrimary, yearIdx, pivotalSet) {
  const hints = YEAR_SCENARIO_HINTS[storyId];
  const scenario =
    year.scenario ||
    (hints && hints[yearIdx]) ||
    ENV_SCENARIO[year.environment] ||
    storyPrimary;

  const vis = SCENARIO_VISUAL[scenario] || SCENARIO_VISUAL.self_growth;
  const mood = year.new_mood ?? year.emotion_value ?? 5;
  const esteem = year.new_esteem ?? Math.max(3, Math.min(8, mood));

  return {
    ...vis,
    ...year,
    scenario,
    is_pivotal: year.is_pivotal ?? pivotalSet.has(year.year),
    new_mood: typeof mood === 'number' ? mood : 5,
    new_esteem: typeof esteem === 'number' ? esteem : 5
  };
}

/**
 * Golden fixture → Demo STORY 契约
 * @param {object} raw
 * @param {object} [catalogEntry]
 */
function adaptGoldenStory(raw, catalogEntry = {}) {
  const meta = raw._meta || {};
  const profileSrc = raw.profile || meta.profile || {};
  const storyId = catalogEntry.id || meta.story_id || 'unknown';

  const profile = {
    choice: profileSrc.choice || '',
    age: profileSrc.age ?? 20,
    mbti: profileSrc.mbti,
    keywords: normalizeKeywords(profileSrc.keywords),
    quote: profileSrc.quote || raw.quote,
    description: profileSrc.description || ''
  };

  const memory_stream =
    raw.memory_stream || raw.memory_stream_template || [];

  const pivotal_years =
    raw.pivotal_years ||
    (raw.beats || []).filter(b => b.type === 'pivotal').map(b => b.year);

  const pivotalSet = new Set(pivotal_years);

  const primary = catalogEntry.scenario_primary || meta.scenario_primary || 'self_growth';
  const secondary = catalogEntry.scenario_secondary || meta.scenario_secondary || 'self_growth';

  const years = (raw.years || []).map((y, i) => adaptYear(y, storyId, primary, i, pivotalSet));

  const shadowName = raw.shadow_name || meta.shadow_name || raw.persona_card?.name || 'Shadow';

  const final =
    raw.final ||
    ({
      title: `${shadowName}的七年`,
      message: raw.final_message || raw.premise || '',
      regret: raw.growth_seed || '—',
      scene: years[years.length - 1]?.scene || 'night',
      emotion_arc: raw.growth_seed || ''
    });

  return {
    id: storyId,
    line_name: catalogEntry.line_name || meta.line_name || storyId,
    profile,
    persona_card: raw.persona_card,
    shadow: raw.shadow || { character: shadowName, palette: 'amber' },
    premise: raw.premise,
    beats: raw.beats || [],
    pivotal_years,
    memory_stream,
    years,
    final,
    scenario_primary: primary,
    scenario_secondary: secondary,
    _visual_v2: true
  };
}

/**
 * 解析 ?story= — 兼容错误编码 ?story%3Dheartbeat_line（部分浏览器/工具会把 = 再 encode 一次）
 * @returns {string}
 */
function resolveStoryIdFromLocation() {
  const params = new URLSearchParams(location.search);
  const direct = params.get('story');
  if (direct) return direct;

  for (const [key] of params.keys()) {
    const embedded = /^story(?:=|%3[Dd])(.+)$/i.exec(key);
    if (embedded) return decodeURIComponent(embedded[1]);
  }

  const fromSearch = location.search.match(/[?&]story(?:=|%3[Dd])([^&+#]+)/i);
  if (fromSearch) return decodeURIComponent(fromSearch[1]);

  return 'wufuxdu';
}

/**
 * @param {string} storyId
 * @returns {Promise<object>}
 */
async function loadStory(storyId) {
  const entry = STORY_CATALOG.find(s => s.id === storyId);
  if (!entry) {
    throw new Error(`未知故事线 "${storyId}"，可选：${STORY_CATALOG.map(s => s.id).join(', ')}`);
  }

  if (!entry.file) {
    if (window.ShadowDemo?.STORY_FUXDUXIAN) {
      const story = { ...window.ShadowDemo.STORY_FUXDUXIAN, id: entry.id, line_name: entry.line_name };
      if (window.ShadowStoryVisuals) {
        story.protagonist_sprite = window.ShadowStoryVisuals.getProtagonist(story.id);
      }
      return story;
    }
    throw new Error('复读线内嵌数据未就绪');
  }

  const res = await fetch(entry.file);
  if (!res.ok) throw new Error(`无法加载 ${entry.file}: ${res.status}`);
  const raw = await res.json();
  const story = adaptGoldenStory(raw, entry);
  if (window.ShadowStoryVisuals) {
    story.protagonist_sprite = window.ShadowStoryVisuals.getProtagonist(story.id);
  }
  return story;
}

/**
 * 启动 Demo：解析 ?story= → 写入 ShadowDemo.STORY
 */
async function bootstrapDemoStory() {
  const params = new URLSearchParams(location.search);
  const storyId = resolveStoryIdFromLocation();
  const story = await loadStory(storyId);

  if (window.ShadowDemo) {
    window.ShadowDemo.STORY = story;
    window.ShadowDemo._activeStoryId = storyId;
    // Golden 故事 (?story=linwan 等) 保持 fixture 人格；Intake 只覆盖默认线或 ?from=intake
    const explicitGoldenStory = storyId !== 'wufuxdu' && storyId !== 'fuxduxian' && (
      params.has('story') ||
      /[?&]story(?:=|%3[Dd])/i.test(location.search)
    );
    const allowIntake =
      !explicitGoldenStory &&
      (params.get('from') === 'intake' ||
        params.get('from') === 'generate' ||
        storyId === 'wufuxdu' ||
        storyId === 'fuxduxian');
    if (allowIntake && typeof window.ShadowDemo.applyIntakeFromSession === 'function') {
      window.ShadowDemo.applyIntakeFromSession();
    }
    if (params.get('live') === '1' && typeof window.ShadowDemo.applyLiveFromSession === 'function') {
      window.ShadowDemo.applyLiveFromSession();
    }
    if (params.get('live') === '1' && params.get('job_id')
      && !window.ShadowDemo.STORY._from_live
      && typeof window.ShadowDemo.applyLiveFromJobQuery === 'function') {
      await window.ShadowDemo.applyLiveFromJobQuery();
    }
    if (params.get('from') === 'generate' && params.get('live') === '1') {
      showGenerateWelcomeStrip();
    }
  }

  return story;
}

function showGenerateWelcomeStrip() {
  try {
    if (sessionStorage.getItem('shadow_welcome_dismissed')) return;
  } catch (_) { /* ignore */ }
  if (document.getElementById('demo-live-welcome')) return;
  const bar = document.createElement('div');
  bar.id = 'demo-live-welcome';
  bar.className = 'demo-live-welcome';
  bar.innerHTML = '<div><strong>你的七年已就绪</strong>点「开始」进入第 1 年；顶部圆点可跳年，pivotal 年可介入。</div>'
    + '<button type="button" class="demo-live-welcome-dismiss" aria-label="关闭提示">知道了</button>';
  document.body.appendChild(bar);
  bar.querySelector('.demo-live-welcome-dismiss')?.addEventListener('click', () => {
    bar.remove();
    try { sessionStorage.setItem('shadow_welcome_dismissed', '1'); } catch (_) { /* ignore */ }
  });
}

function renderStoryPicker(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const current = resolveStoryIdFromLocation();

  el.innerHTML = STORY_CATALOG.map(s => {
    const active = s.id === current ? ' is-active' : '';
    const href = s.id === 'wufuxdu' ? 'demo.html' : `demo.html?story=${encodeURIComponent(s.id)}`;
    return `<a class="story-chip${active}" href="${href}" data-story="${s.id}">
      <span class="story-chip-line">${s.line_name}</span>
      <span class="story-chip-name">影 · ${s.shadow_name}</span>
    </a>`;
  }).join('');
}

window.ShadowStories = {
  STORY_CATALOG,
  adaptGoldenStory,
  loadStory,
  resolveStoryIdFromLocation,
  bootstrapDemoStory,
  renderStoryPicker
};
