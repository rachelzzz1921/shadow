/**
 * Shadow Demo — 复读线 Mock 数据 + Agent 接线口
 *
 * 契约参照：shadow-corpus/archive/demo-v0.2/lib/contract.example.json
 *
 * 队友接线：
 *   ShadowAgents.dialogue  — 主 Shadow 对话 agent（prompt + 生成）
 *   ShadowAgents.fate      — 命运 agent（独立；可读取 beats，不展示 Beats UI）
 */
'use strict';

const STORY = {
  profile: {
    choice: '如果当年我去复读了',
    age: 18,
    mbti: 'INFJ',
    keywords: ['要强', '怕被看穿', '不甘'],
    quote: '我宁愿后悔做过，也不后悔没做。',
    description: '我习惯用成绩证明自己，但每次靠近一个目标，又会怀疑自己是不是真的想要它。'
  },

  persona_card: {
    name: '阿岚',
    core_traits: ['要强', '习惯藏话', '迟到的自我'],
    soft_spots: ['把父母的期待当成自己的想要', '被否定时第一反应是再加倍努力'],
    decision_tendency: "在'再努力一次'和'承认就这样'之间永远选前者",
    growth_seed: "她需要一次允许自己说'够了'"
  },

  shadow: {
    character: 'Amelia',
    palette: 'amber',
    trait_tags: ['要强', '晚熟']
  },

  premise: '你又坐回到教室最后一排。七年后才知道，那年决定的不只是分数。',

  beats: [
    { year: 1, type: 'pivotal', seed: '复读班开学，雨天' },
    { year: 2, type: 'quiet', seed: '二战分数比一战低 7 分' },
    { year: 3, type: 'quiet', seed: '上了不甘心的二本' },
    { year: 4, type: 'pivotal', seed: '被推选当学生会主席' },
    { year: 5, type: 'quiet', seed: '开始失眠' },
    { year: 6, type: 'pivotal', seed: '考研复试被刷' },
    { year: 7, type: 'quiet', seed: '县城邮局' }
  ],

  pivotal_years: [1, 4, 6],

  /** 六域侧重 — 对齐 fate scenario_weights */
  scenario_primary: 'academic',
  scenario_secondary: 'self_growth',

  /** v2 视觉侧车 — 与 shadow-corpus/visual/stories/fuxduxian/v2-fields.json 同步 */
  _visual_v2: true,

  memory_stream: [
    { id: 'm1', year: 1, type: 'decision', content: '复读班坐到最后一排，没告诉父母自己想直接走', weight: 0.85 },
    { id: 'm2', year: 2, type: 'event', content: '二战分数比一战低 7 分，撕了准考证', weight: 0.7 },
    { id: 'm3', year: 3, type: 'reflection', content: '一个人吃饭，开始接受不是最好的那个', weight: 0.5 },
    { id: 'm4', year: 4, type: 'decision', content: '接下学生会主席，第一次试着让自己被看见', weight: 0.9 },
    { id: 'm5', year: 5, type: 'event', content: '连续三个月失眠，没告诉任何人', weight: 0.6 },
    { id: 'm6', year: 6, type: 'decision', content: '考研复试被刷，没再战', weight: 0.95 },
    { id: 'm7', year: 7, type: 'reflection', content: "邮局窗口听到一句'你字真好看'，第一次说够了", weight: 0.75 }
  ],

  years: [
    {
      year: 1, age: 19, is_pivotal: true, scenario: 'academic',
      title: '再坐一年',
      scene: 'rain', environment: 'classroom', pose: 'wait', prop: 'desk', city: 'city2',
      event: '复读班开学那天下雨。你提前半小时到，把书包放在最后一排靠窗的位置，心想这样没人能从背后看见你。同桌是去年坐你后面那个男生的弟弟，他看见你愣了一下，没说话。下课你去走廊喝水，听见两个老师说：今年这批又来一个二战的。你低头笑了一下，那个笑你自己都听不见。',
      decision_made: '选了最后一排，因为不想让任何人看见自己又坐回来了',
      intervention_prompt: { question: '告诉父母自己其实不想复读，还是继续撑下去？', options: ['告诉父母', '继续撑'] },
      emotion: '退缩', emotion_value: 4, new_mood: 4, new_esteem: 5,
      reflection: '原来我怕的不是失败，是被看见还在原地。',
      shadow_dialogue: '你看，我还是坐回来了。',
      memory_summary: '复读班坐到最后一排，没告诉父母自己想直接走'
    },
    {
      year: 2, age: 20, is_pivotal: false, scenario: 'academic',
      title: '低 7 分',
      scene: 'night', environment: 'dorm_night', pose: 'hurt', prop: 'desk', city: 'city4',
      event: '二战分数下来那个晚上，你撕了准考证。撕的时候没哭。',
      decision_made: '撕的时候没哭，是因为早就预感到了',
      intervention_prompt: null,
      emotion: '麻木', emotion_value: 3, new_mood: 3, new_esteem: 4,
      reflection: '再努力一次不一定有用，我第一次知道。',
      shadow_dialogue: '有些纸，撕了反而轻。',
      memory_summary: '二战分数比一战低 7 分，撕了准考证'
    },
    {
      year: 3, age: 21, is_pivotal: false, scenario: 'friendship',
      title: '一个人吃饭',
      scene: 'city', environment: 'cafeteria', pose: 'wait', prop: 'desk', city: 'city5',
      event: '你上了那所听都没听过的二本，开始一个人吃饭。',
      decision_made: '没去加任何社团，因为不想再被推到前面',
      intervention_prompt: null,
      emotion: '钝', emotion_value: 4, new_mood: 4, new_esteem: 4,
      reflection: "我开始接受'我不是最好的那个'。",
      shadow_dialogue: '食堂角落的灯光，原来也挺好。',
      memory_summary: '一个人吃饭，开始接受不是最好的那个'
    },
    {
      year: 4, age: 22, is_pivotal: true, scenario: 'career',
      title: '推上主席',
      scene: 'office', environment: 'stage', pose: 'cast', prop: 'stage', city: 'city8',
      event: "辅导员把你叫到办公室，说你'稳重'。你其实想说我不擅长，但还是点了头。第一次开会，你把发言稿改了五遍，临上台前发现领带打反了。台下有人笑，你也笑了，那一刻你忽然想——原来被看见也不是死。",
      decision_made: '因为不忍心拒绝而接下主席，第一次试着让自己被看见',
      intervention_prompt: { question: "让阿岚现在就说'我不擅长'，还是硬撑到任期结束？", options: ['承认不擅长', '硬撑到底'] },
      emotion: '试探', emotion_value: 6, new_mood: 6, new_esteem: 6,
      reflection: '原来不擅长，也可以站到那里。',
      shadow_dialogue: '你也偷偷喜欢过被看见，对吧。',
      memory_summary: '接下学生会主席，第一次试着让自己被看见'
    },
    {
      year: 5, age: 23, is_pivotal: false, scenario: 'family',
      title: '整宿不睡',
      scene: 'night', environment: 'dorm_night', pose: 'wait', prop: 'desk', city: 'city4',
      event: '连续三个月凌晨四点醒来，没告诉任何人。',
      decision_made: '把失眠藏起来，因为不想被父母看见自己撑不住',
      intervention_prompt: null,
      emotion: '压', emotion_value: 3, new_mood: 3, new_esteem: 4,
      reflection: "我把'还行'练得太熟了。",
      shadow_dialogue: '夜里那盏灯，我留给你了。',
      memory_summary: '连续三个月失眠，没告诉任何人'
    },
    {
      year: 6, age: 24, is_pivotal: true, scenario: 'academic',
      title: '复试被刷',
      scene: 'rain', environment: 'trainstation', pose: 'hurt', prop: 'suitcase', city: 'city6',
      event: "考研复试出来下雨。导师在走廊里说了一句'你眼神不在'，没回头。你坐在回程的火车上，对面一个穿校服的小孩睡得很沉。你想：是不是该停一停了。可行李夹层里还塞着第二年要用的政治真题。",
      decision_made: "复试被刷后，第一次认真考虑'不再战'",
      intervention_prompt: { question: '让阿岚再考一年，还是接受这个结果？', options: ['再战一年', '接受结果'] },
      emotion: '崩', emotion_value: 2, new_mood: 3, new_esteem: 3,
      reflection: "原来'停下来'比'再来一次'更难说出口。",
      shadow_dialogue: '你想问我后悔吗？我想问你呢。',
      memory_summary: '考研复试被刷，没再战'
    },
    {
      year: 7, age: 25, is_pivotal: false, scenario: 'self_growth',
      title: '邮局窗口',
      scene: 'city', environment: 'postoffice', pose: 'doing', prop: 'desk', city: 'city7',
      event: '你回到县城，在邮局窗口写汇款单。一个老太太说你字真好看。',
      decision_made: '没再回学校。挑了一份能安静写字的工作',
      intervention_prompt: null,
      emotion: '稳', emotion_value: 5, new_mood: 5, new_esteem: 5,
      reflection: '够了。这句话我学了七年。',
      shadow_dialogue: '你的字也很好看。',
      memory_summary: "邮局窗口听到一句'你字真好看'，第一次说够了"
    }
  ],

  final: {
    title: '阿岚的七年',
    message: '我没有变成你想象的样子。但有一天我在邮局窗口给一个老太太写汇款单，她说我字真好看。那一刻我突然觉得，够了。',
    regret: "没有早一点告诉自己'不想要也可以'。",
    scene: 'home',
    emotion_arc: '从撑着的高位一路下落，最后在低处找到一种安静的平稳'
  }
};

/** 场景 environment → 简 UI 标签 */
const ENV_LABELS = {
  classroom: '教室',
  dorm_night: '宿舍夜',
  cafeteria: '食堂',
  stage: '舞台',
  trainstation: '火车站',
  postoffice: '邮局',
  office: '办公室',
  home: '家',
  hospital: '医院',
  studio: '工作室'
};

const V2_VISUAL = {
  1: { visual_anchor: '雨天，最后一排靠窗，书包在空桌', key_props: ['书包', '窗雨'], mood_visual: '灰、冷、窄画幅', daily_micro: '翻书、望窗' },
  2: { visual_anchor: '查分夜，桌上有撕碎准考证', key_props: ['准考证碎片', '台灯'], mood_visual: '灰、冷、窄画幅', daily_micro: '撕纸、静止' },
  3: { visual_anchor: '食堂最里角，双份餐盘只有一个有人', key_props: ['餐盘', '空椅'], mood_visual: '灰、冷、窄画幅', daily_micro: '慢吃 loop' },
  4: { visual_anchor: '舞台侧幕，领带打反，稿纸五叠', key_props: ['领带', '稿纸', '麦'], mood_visual: '略暖、舞台光', daily_micro: '改稿' },
  5: { visual_anchor: '凌晨 4 点，手机 4:03，窗帘缝光', key_props: ['手机', '床', '窗帘'], mood_visual: '低饱和、夜', daily_micro: '睁眼 loop' },
  6: { visual_anchor: '出站雨棚，行李箱，对面校服小孩睡', key_props: ['行李箱', '雨', '小孩'], mood_visual: '低饱和、雨', daily_micro: '抱箱蹲坐' },
  7: { visual_anchor: '邮局小窗，信封与笔，老太太半脸', key_props: ['信封', '笔', '窗口'], mood_visual: '留白大、小窗高光', daily_micro: '写字 loop' }
};

/**
 * 归一化 year.emotion（golden JSON 用扁平字段，契约用 { label, value }）
 * @param {object} year
 */
function normalizeYear(year) {
  if (!year) return year;
  let out = year;
  if (!(year.emotion && typeof year.emotion === 'object')) {
    out = {
      ...year,
      emotion: { label: year.emotion, value: year.emotion_value ?? 5 }
    };
  }
  const v2 = V2_VISUAL[year.year];
  return v2 ? { ...out, ...v2 } : out;
}

/**
 * Agent 接线口 — 队友实现后设 enabled: true 并覆盖方法。
 *
 * @typedef {object} DialogueContext
 * @property {object} story — 完整 STORY
 * @property {object} year — 当前年（已 normalize）
 * @property {string} [userQuestion] — 用户输入（Live 模式）
 * @property {Array<{year:number,choice:string}>} interventions
 *
 * @typedef {object} DialogueResult
 * @property {string} reply
 * @property {string[]} cite_memory_ids
 * @property {string} mood_after
 *
 * @typedef {object} FateContext
 * @property {object} story
 * @property {object} year
 * @property {object[]} beats — Beats agent 产出（只作输入，不在 UI 展示）
 * @property {number} yearIndex — 0-based
 * @property {{year:number,choice:string}|null} [lastIntervention]
 *
 * @typedef {object} FateResult
 * @property {string} [overlay] — 命运层 overlay 文案（可选）
 * @property {string} [hint] — 轻提示
 */
const ShadowAgents = {
  /** 主 Shadow 对话 agent — @teammate 替换 enabled + ask */
  dialogue: {
    enabled: true,
    async ask(ctx) {
      const year = ctx.year;
      const memIds = getMemoriesForYear(year.year).map(m => m.id).slice(0, 1);
      return {
        reply: year.shadow_dialogue,
        cite_memory_ids: memIds.length ? memIds : [`m${year.year}`],
        mood_after: typeof year.emotion === 'object' ? year.emotion.label : year.emotion,
        _placeholder: true
      };
    }
  },

  /** 命运 agent — @teammate 替换；默认读 demo-era-snippets.json */
  fate: {
    enabled: true,
    _snippets: null,
    async _loadSnippets() {
      if (this._snippets) return this._snippets;
      try {
        const r = await fetch('demo-era-snippets.json');
        this._snippets = await r.json();
      } catch {
        this._snippets = {};
      }
      return this._snippets;
    },
    _calendarYear(narrativeYear) {
      return 2018 + narrativeYear;
    },
    async onYearEnter(ctx) {
      const snippets = await this._loadSnippets();
      const cal = this._calendarYear(ctx.year.year);
      const snip = snippets[String(cal)];
      if (!snip) return { hint: '命运层 · 语料加载中', _placeholder: true };
      return {
        overlay: snip.era_line,
        hint: `时代 ${cal} · placeholder`,
        _placeholder: true
      };
    },
    async onIntervention(ctx) {
      const base = await this.onYearEnter(ctx);
      return {
        ...base,
        overlay: base.overlay
          ? `${base.overlay} · 你选了「${ctx.choice}」`
          : `你选了「${ctx.choice}」`
      };
    }
  }
};

/** @param {number} yearNum */
function getBeatForYear(yearNum) {
  return STORY.beats.find(b => b.year === yearNum) ?? null;
}

/** @param {number} yearNum */
function getMemoriesForYear(yearNum) {
  return STORY.memory_stream.filter(m => m.year === yearNum);
}

function shadowDisplayName() {
  return `影 · ${STORY.persona_card.name}`;
}

/** 若 intake.html 已写入 sessionStorage，覆盖 landing 人格卡预览 */
function applyIntakeFromSession() {
  try {
    const rawPersona = sessionStorage.getItem('shadow_persona');
    const rawProfile = sessionStorage.getItem('shadow_full_profile');
    if (!rawPersona) return false;

    const persona = JSON.parse(rawPersona);
    const full = rawProfile ? JSON.parse(rawProfile) : null;

    STORY.persona_card = {
      name: persona.shadow_name || STORY.persona_card.name,
      core_traits: persona.core_traits || STORY.persona_card.core_traits,
      soft_spots: persona.soft_spots || STORY.persona_card.soft_spots,
      decision_tendency: persona.decision_tendency || STORY.persona_card.decision_tendency,
      growth_seed: persona.growth_seed || STORY.persona_card.growth_seed,
      core_tension: persona.core_tension,
      voice_notes: persona.voice_notes,
      narrative_warnings: persona.narrative_warnings,
      value_hierarchy: persona.value_hierarchy,
      defense_mechanism: persona.defense_mechanism,
      _from_intake: true
    };

    if (full?.raw) {
      STORY.profile = {
        ...STORY.profile,
        choice: full.raw.choice_text || STORY.profile.choice,
        description: full.raw.self_description || STORY.profile.description,
        quote: full.raw.one_liner || STORY.profile.quote,
        age: full.temporal?.age_at_fork ?? STORY.profile.age,
        keywords: (full.raw.selected_tags || []).slice(0, 5)
      };
    }

    if (full?.scenario_weights) {
      STORY.scenario_weights = full.scenario_weights;
      const top = Object.entries(full.scenario_weights).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        STORY.scenario_primary = top[0];
        const secondary = Object.entries(full.scenario_weights).sort((a, b) => b[1] - a[1])[1];
        if (secondary) STORY.scenario_secondary = secondary[0];
      }
    }

    if (full?.raw?.choice_text) {
      STORY.premise = `影子走这条路：${full.raw.choice_text.slice(0, 36)}${full.raw.choice_text.length > 36 ? '…' : ''}`;
    }

    return true;
  } catch (_) {
    return false;
  }
}

applyIntakeFromSession();

/** Live 全链生成结果注入（demo-live.html → demo.html?live=1） */
function applyLiveFromSession() {
  try {
    const raw = sessionStorage.getItem('shadow_live_session');
    if (!raw) return false;
    const live = JSON.parse(raw);
    const session = live.session;
    if (!session?.years?.length) return false;

    STORY.years = session.years;
    STORY.beats = session.beats || STORY.beats;
    STORY.pivotal_years = session.pivotal_years || STORY.pivotal_years;
    STORY.memory_stream = session.memory_stream || [];
    STORY.persona_card = session.persona_card || STORY.persona_card;
    STORY.shadow = session.shadow || STORY.shadow;
    if (live.profile) STORY.profile = { ...STORY.profile, ...live.profile };
    if (live.final) STORY.final = live.final;
    if (session.scenario) {
      STORY.scenario_primary = session.scenario?.domain || STORY.scenario_primary;
    }
    STORY.premise = live.final?.message?.slice(0, 48) || STORY.premise;
    STORY._from_live = true;
    STORY._live_run_id = session.run_id || null;
    return true;
  } catch (_) {
    return false;
  }
}

if (typeof URLSearchParams !== 'undefined' && new URLSearchParams(location.search).get('live') === '1') {
  applyLiveFromSession();
}

window.ShadowDemo = {
  STORY,
  ENV_LABELS,
  ShadowAgents,
  normalizeYear,
  getBeatForYear,
  getMemoriesForYear,
  shadowDisplayName,
  applyIntakeFromSession,
  applyLiveFromSession
};
