/**
 * Layout Agent 专用字段 — extended-scenes-v1 39 条
 * 由 build-extended-scenes-pack.mjs 合并进 enriched CSV
 */
export const EXTENDED_AGENT_FIELDS = {
  'PX-EXT-001': {
    visual_anchor_template: '{season}时节，{character}在{location}，天空叠雪/雨/落叶',
    default_layer_stack: 'background>fx>character',
    parallax_suggest: '0.08',
    animation_keys: 'snow_light,snow_heavy,rain_light,rain_heavy,leaves,lightning',
    domain_fit: 'shared,academic,family,self_growth',
    year_phase_fit: 'transition,quiet,pivotal',
    combo_id: 'mana_seed_four_seasons',
    reject_if_mood: 'celebration,节庆'
  },
  'PX-EXT-002': {
    visual_anchor_template: '{season}午后，{character}走在落叶{location}，脚下金黄',
    default_layer_stack: 'PX-EXT-002>PX-EXT-001>PX-EXT-021',
    parallax_suggest: '0.12',
    animation_keys: 'idle,walk',
    domain_fit: 'love,friendship,self_growth,academic',
    year_phase_fit: 'quiet,transition,pivotal',
    combo_id: 'mana_seed_four_seasons',
    reject_if_mood: 'celebration'
  },
  'PX-EXT-003': {
    visual_anchor_template: '{season}冬夜，{character}站在雪地{location}，枯树剪影',
    default_layer_stack: 'PX-EXT-003>PX-EXT-001>PX-EXT-021',
    parallax_suggest: '0.15',
    animation_keys: 'idle,walk',
    domain_fit: 'family,academic,self_growth,career',
    year_phase_fit: 'quiet,final,transition',
    combo_id: 'mana_seed_four_seasons',
    reject_if_mood: 'celebration,暑热'
  },
  'PX-EXT-004': {
    visual_anchor_template: '{season}夏日，{character}在茂密绿林{location}，暑气可见',
    default_layer_stack: 'PX-EXT-004>PX-EXT-021',
    parallax_suggest: '0.12',
    animation_keys: 'idle,walk',
    domain_fit: 'academic,self_growth,love',
    year_phase_fit: 'quiet,transition',
    combo_id: 'mana_seed_four_seasons',
    reject_if_mood: '寒冷,孤立'
  },
  'PX-EXT-005': {
    visual_anchor_template: '{season}春日，{character}在新绿{location}，萌动初开',
    default_layer_stack: 'PX-EXT-005>PX-EXT-017>PX-EXT-021',
    parallax_suggest: '0.12',
    animation_keys: 'idle,walk',
    domain_fit: 'love,self_growth,academic',
    year_phase_fit: 'quiet,transition,pivotal',
    combo_id: 'mana_seed_four_seasons',
    reject_if_mood: '凋零,萧条'
  },
  'PX-EXT-006': {
    visual_anchor_template: '极寒{season}，{character}在荒芜雪林{location}，几乎无生命',
    default_layer_stack: 'PX-EXT-006>PX-EXT-001>PX-EXT-021',
    parallax_suggest: '0.18',
    animation_keys: 'idle',
    domain_fit: 'self_growth',
    year_phase_fit: 'pivotal,special',
    combo_id: 'mana_seed_extreme',
    reject_if_mood: 'celebration,温暖'
  },
  'PX-EXT-007': {
    visual_anchor_template: '{season}户外，{character}在模块化森林{location}',
    default_layer_stack: 'PX-EXT-007>PX-EXT-021',
    parallax_suggest: '0.12',
    animation_keys: 'idle',
    domain_fit: 'shared',
    year_phase_fit: 'transition',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-008': {
    visual_anchor_template: '{season}秋日，{character}走在公园落叶路{location}',
    default_layer_stack: 'PX-EXT-008>PX-EXT-021',
    parallax_suggest: '0.14',
    animation_keys: 'walk,idle',
    domain_fit: 'love,friendship',
    year_phase_fit: 'quiet,pivotal',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-009': {
    visual_anchor_template: '冬夜城市，{character}在积雪街道{location}，街灯稀疏',
    default_layer_stack: 'PX-EXT-009>PX-EXT-001>PX-EXT-021',
    parallax_suggest: '0.1',
    animation_keys: 'walk,idle',
    domain_fit: 'career,love,self_growth',
    year_phase_fit: 'special,final',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-010': {
    visual_anchor_template: '{season}白天，{character}在村镇{location}，烟囱与土路',
    default_layer_stack: 'PX-EXT-012>PX-EXT-010>PX-EXT-022',
    parallax_suggest: '0.14',
    animation_keys: 'idle,walk',
    domain_fit: 'family,self_growth',
    year_phase_fit: 'quiet,pivotal,transition',
    combo_id: 'rural_hometown',
    reject_if_mood: ''
  },
  'PX-EXT-011': {
    visual_anchor_template: '{character}在村镇街道{location}，邻居小院安静',
    default_layer_stack: 'PX-EXT-011>PX-EXT-022',
    parallax_suggest: '0.12',
    animation_keys: 'idle,walk',
    domain_fit: 'family',
    year_phase_fit: 'quiet',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-012': {
    visual_anchor_template: '{season}田野，{character}在泥路{location}，远处是家',
    default_layer_stack: 'PX-EXT-012>PX-EXT-010>PX-EXT-021',
    parallax_suggest: '0.16',
    animation_keys: 'idle,walk',
    domain_fit: 'family,self_growth',
    year_phase_fit: 'quiet,transition',
    combo_id: 'rural_hometown',
    reject_if_mood: ''
  },
  'PX-EXT-013': {
    visual_anchor_template: '{season}午后，{character}坐在公园长椅{location}，喷泉无声',
    default_layer_stack: 'PX-EXT-013>PX-EXT-021',
    parallax_suggest: '0.12',
    animation_keys: 'idle,sit',
    domain_fit: 'love,friendship,self_growth',
    year_phase_fit: 'quiet,pivotal',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-014': {
    visual_anchor_template: '深夜，{character}在星空下{location}，内省距离感',
    default_layer_stack: 'interior>PX-EXT-014>PX-EXT-029',
    parallax_suggest: '0.2',
    animation_keys: 'parallax_scroll',
    domain_fit: 'self_growth,love',
    year_phase_fit: 'quiet,special',
    combo_id: 'introspection_overlay',
    reject_if_mood: 'celebration'
  },
  'PX-EXT-015': {
    visual_anchor_template: '深夜，{character}在{location}，窗外六层夜空',
    default_layer_stack: 'interior>PX-EXT-015>PX-EXT-029',
    parallax_suggest: '0.22',
    animation_keys: 'parallax_scroll',
    domain_fit: 'love,self_growth',
    year_phase_fit: 'quiet,special',
    combo_id: 'introspection_overlay',
    reject_if_mood: 'celebration'
  },
  'PX-EXT-016': {
    visual_anchor_template: '{season}天空，{character}剪影在{location}，云量暗示心情',
    default_layer_stack: 'PX-EXT-016>character',
    parallax_suggest: '0.25',
    animation_keys: 'cloud_drift',
    domain_fit: 'shared',
    year_phase_fit: 'transition',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-017': {
    visual_anchor_template: '{season}春日，{character}在{location}，脚边落樱/春花',
    default_layer_stack: 'background>PX-EXT-017>character',
    parallax_suggest: '0.08',
    animation_keys: 'bloom,petal_fall',
    domain_fit: 'love,friendship,self_growth',
    year_phase_fit: 'quiet,transition',
    combo_id: 'spring_festival',
    reject_if_mood: '凋零'
  },
  'PX-EXT-018': {
    visual_anchor_template: '节庆夜，{character}在{location}，灯笼暖光摇曳',
    default_layer_stack: 'PX-UNI-002>PX-EXT-018>character',
    parallax_suggest: '0.06',
    animation_keys: 'lantern_swing',
    domain_fit: 'family',
    year_phase_fit: 'special,quiet',
    combo_id: 'spring_festival',
    reject_if_mood: '冷漠,分离'
  },
  'PX-EXT-019': {
    visual_anchor_template: '{character}在温馨书店{location}，台灯照着书页',
    default_layer_stack: 'PX-EXT-019>character',
    parallax_suggest: '0.1',
    animation_keys: 'read_idle',
    domain_fit: 'academic,self_growth',
    year_phase_fit: 'quiet',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-020': {
    visual_anchor_template: '{character}在地铁车厢{location}，窗外隧道光掠过',
    default_layer_stack: 'PX-EXT-020>PX-EXT-034>character',
    parallax_suggest: '0.08',
    animation_keys: 'door_open,door_close,idle',
    domain_fit: 'career,love',
    year_phase_fit: 'quiet,transition,pivotal',
    combo_id: 'commute_interior',
    reject_if_mood: ''
  },
  'PX-EXT-021': {
    visual_anchor_template: '{season}，{character}在{location}，Mana Seed 统一主角',
    default_layer_stack: 'background>prop>PX-EXT-021>fx',
    parallax_suggest: '0',
    animation_keys: 'idle,walk,run,sleep',
    domain_fit: 'shared',
    year_phase_fit: 'quiet,pivotal,final,transition',
    combo_id: 'mana_seed_protagonist',
    reject_if_mood: ''
  },
  'PX-EXT-022': {
    visual_anchor_template: '{character}在田间{location}，劳作或驻足',
    default_layer_stack: 'PX-EXT-012>PX-EXT-022',
    parallax_suggest: '0',
    animation_keys: 'idle,walk,pickup,throw',
    domain_fit: 'family,self_growth',
    year_phase_fit: 'quiet',
    combo_id: 'rural_hometown',
    reject_if_mood: ''
  },
  'PX-EXT-023': {
    visual_anchor_template: '对话框，{character}表情{emotion}，头像特写',
    default_layer_stack: 'ui_overlay',
    parallax_suggest: '0',
    animation_keys: 'emotion_7pack',
    domain_fit: 'shared',
    year_phase_fit: 'quiet,pivotal',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-024': {
    visual_anchor_template: '童年回忆，{character}年幼头像在{location}',
    default_layer_stack: 'ui_overlay',
    parallax_suggest: '0',
    animation_keys: 'portrait_expressions',
    domain_fit: 'family',
    year_phase_fit: 'special,pivotal',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-025': {
    visual_anchor_template: '{character}占位角色在{location}',
    default_layer_stack: 'character',
    parallax_suggest: '0',
    animation_keys: 'generated',
    domain_fit: 'shared',
    year_phase_fit: 'quiet',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-026': {
    visual_anchor_template: 'HUD：第{year}年 · {domain}进度',
    default_layer_stack: 'ui_top',
    parallax_suggest: '0',
    animation_keys: 'bar_fill',
    domain_fit: 'shared',
    year_phase_fit: 'daily',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-027': {
    visual_anchor_template: '{character}手边{prop}图标提示行动',
    default_layer_stack: 'ui_prop',
    parallax_suggest: '0',
    animation_keys: 'static',
    domain_fit: 'shared',
    year_phase_fit: 'daily,pivotal',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-028': {
    visual_anchor_template: '转折瞬间，{character}在{location}，粒子爆发',
    default_layer_stack: 'background>character>PX-EXT-028',
    parallax_suggest: '0',
    animation_keys: 'burst,sparkle',
    domain_fit: 'shared',
    year_phase_fit: 'pivotal,special',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-029': {
    visual_anchor_template: '浓雾中，{character}在{location}，方向不明',
    default_layer_stack: 'background>character>PX-EXT-029',
    parallax_suggest: '0.05',
    animation_keys: 'fog_scroll',
    domain_fit: 'self_growth',
    year_phase_fit: 'quiet,pivotal,special',
    combo_id: 'introspection_overlay',
    reject_if_mood: 'celebration,清晰'
  },
  'PX-EXT-030': {
    visual_anchor_template: '深夜星空，{character}在{location}窗边剪影',
    default_layer_stack: 'PX-UNI-002>PX-EXT-030>PX-EXT-029>character',
    parallax_suggest: '0.18',
    animation_keys: 'stars_twinkle',
    domain_fit: 'self_growth,love',
    year_phase_fit: 'quiet,special',
    combo_id: 'introspection_overlay',
    reject_if_mood: 'celebration'
  },
  'PX-EXT-031': {
    visual_anchor_template: '{character}在通用俯视{location}（占位）',
    default_layer_stack: 'PX-EXT-031>character',
    parallax_suggest: '0.1',
    animation_keys: 'idle',
    domain_fit: 'shared',
    year_phase_fit: 'quiet',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-032': {
    visual_anchor_template: '回忆滤镜，{character}在风格化室内{location}',
    default_layer_stack: 'PX-EXT-032>character',
    parallax_suggest: '0.1',
    animation_keys: 'idle',
    domain_fit: 'family,love,friendship',
    year_phase_fit: 'special,pivotal',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-033': {
    visual_anchor_template: '第{year}年 → 第{next_year}年，像素擦黑转场',
    default_layer_stack: 'transition_fullscreen',
    parallax_suggest: '0',
    animation_keys: 'wipe_black,curtain',
    domain_fit: 'shared',
    year_phase_fit: 'transition',
    combo_id: 'year_transition',
    reject_if_mood: ''
  },
  'PX-EXT-034': {
    visual_anchor_template: '城市路上，{prop}驶过{location}',
    default_layer_stack: 'background>PX-EXT-034',
    parallax_suggest: '0.06',
    animation_keys: 'drive_by',
    domain_fit: 'career,family,friendship',
    year_phase_fit: 'daily,transition',
    combo_id: 'commute_interior',
    reject_if_mood: ''
  },
  'PX-EXT-035': {
    visual_anchor_template: '春日，{character}在樱花树{location}',
    default_layer_stack: 'background>PX-EXT-035>PX-EXT-017',
    parallax_suggest: '0.1',
    animation_keys: 'petal_fall',
    domain_fit: 'love,self_growth',
    year_phase_fit: 'quiet,transition',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-036': {
    visual_anchor_template: '{character}在健身房{location}，器械可见',
    default_layer_stack: 'PX-EXT-036>character',
    parallax_suggest: '0.08',
    animation_keys: 'exercise_idle',
    domain_fit: 'self_growth,career',
    year_phase_fit: 'quiet,pivotal',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-037': {
    visual_anchor_template: '深夜，{character}在居酒屋{location}，台灯暖光',
    default_layer_stack: 'PX-EXT-037>character',
    parallax_suggest: '0.08',
    animation_keys: 'sit_talk',
    domain_fit: 'friendship,career,self_growth',
    year_phase_fit: 'special,quiet',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  },
  'PX-EXT-038': {
    visual_anchor_template: '{season}，{character}在 Mana Seed 起步{location}',
    default_layer_stack: 'PX-EXT-038>PX-EXT-021',
    parallax_suggest: '0.12',
    animation_keys: 'idle,walk',
    domain_fit: 'shared',
    year_phase_fit: 'quiet,transition',
    combo_id: 'mana_seed_starter',
    reject_if_mood: ''
  },
  'PX-EXT-039': {
    visual_anchor_template: '{character}在室内{location}（合集候选）',
    default_layer_stack: 'background>character',
    parallax_suggest: '0.1',
    animation_keys: 'idle',
    domain_fit: 'shared',
    year_phase_fit: 'quiet',
    combo_id: 'candidate_only',
    reject_if_mood: ''
  }
};

export const AGENT_EXTRA_HEADERS = [
  'visual_anchor_template',
  'default_layer_stack',
  'parallax_suggest',
  'animation_keys',
  'domain_fit',
  'year_phase_fit',
  'combo_id',
  'reject_if_mood'
];
