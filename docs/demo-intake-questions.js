/**
 * Shadow Intake — 十道精准小问 + 域检测
 * 与 files/ShadowIntake.jsx 对齐
 */
'use strict';

const INTAKE_SECTIONS = ['岔路口', '性格', '关系', '价值'];

const INTAKE_DOMAINS = {
  study: { zh: '学业', kw: ['复读', '考研', '考公', '高考', '上学', '读书', '学校', '专业', '学位', '毕业', '考试', '升学', '退学', '保研', '考博'] },
  career: { zh: '事业', kw: ['工作', '职场', '创业', '跳槽', '升职', '公司', '行业', '赚钱', 'offer', '辞职', '上班', '项目', '生意', '裁员', '转行'] },
  love: { zh: '爱情', kw: ['恋爱', '结婚', '分手', '异地', '对象', '男友', '女友', '喜欢的人', '表白', '在一起', '感情', '离婚', '暗恋', '相亲'] },
  family: { zh: '亲情', kw: ['父母', '爸妈', '家里', '老家', '回家', '尽孝', '家人', '母亲', '父亲', '奶奶', '爷爷', '照顾', '家庭'] },
  friendship: { zh: '友情', kw: ['朋友', '同学', '闺蜜', '兄弟', '圈子', '室友', '同伴', '发小'] },
  self_growth: { zh: '自我成长', kw: ['自己', '活成', '成长', '内心', '独立', '疗愈', '认识自己', '改变', '重新开始', '放过自己'] }
};

const INTAKE_TAG_DOMAIN = {
  父母期待: 'family', 照顾家人: 'family', 被寄予厚望: 'family', 长辈催促: 'family', 家庭经济: 'family',
  伴侣异地: 'love', 感情新生: 'love', 关系破裂: 'love', 怕不被爱: 'love', 怕亲密: 'love',
  朋友分流: 'friendship', 同辈比较: 'friendship', 社交回避: 'friendship', 怕被抛下: 'friendship',
  上进: 'career', 成就: 'career', 卓越: 'career'
};

const INTAKE_EXAMPLES = [
  { tag: '复读', choice: '如果当年我去复读了，而不是直接上了那所大专', desc: '我那时候就是不甘心，觉得一次没考好不代表我不行。可真要再来一年，我又怕万一还是考不好，那才是彻底证明了我就这水平。' },
  { tag: '考公', choice: '如果当年我留在老家考公，而不是一个人去了深圳', desc: '我妈一直说稳定最重要，我嘴上不服，可每次深夜加班我都在想，是不是她才是对的。我不确定我想要的，到底是闯出来，还是只是不想认输。' },
  { tag: '异地', choice: '如果当年我为他留在了那座城市，而不是去读那个研究生', desc: '我们都说会等，可我心里清楚异地撑不久。我选了自己，然后用了很多年说服自己这是对的——其实我到现在都不知道。' }
];

const INTAKE_QUESTIONS = [
  { id: 'SH-Q01', section: '岔路口', kind: 'binary',
    text: '和人起冲突时，你的身体先做哪件事？', subtitle: '不是你想做什么，是你实际会做什么',
    note: '这题帮系统理解你在压力下的默认反应——decision_tendency 的根。',
    options: [
      { key: 'A', text: '先退一步，把场面圆回来', sub: '冲突回避型，倾向妥协维持关系' },
      { key: 'B', text: '先顶住，绝不先低头', sub: '对抗坚持型，倾向硬撑维护立场' }
    ] },
  { id: 'SH-Q02', section: '性格', kind: 'slider',
    text: '别人怎么看你，对你有多重要？', subtitle: '诚实一点，没人在记分',
    note: '外在评价敏感度 → soft_spots 与 initial_esteem 脆弱度。',
    min: 0, max: 100, left: '我活我的', right: '几乎是我的标尺',
    tiers: [[0, 20, '我活我的'], [21, 45, '听听就算'], [46, 70, '会在意'], [71, 90, '很在意'], [91, 100, '几乎是我的标尺']],
    feedback: [[0, 30, '你似乎有一套自己的秤。'], [31, 70, '你在自己和别人之间来回。'], [71, 100, '别人的眼光，可能比你以为的更重。']] },
  { id: 'SH-Q03', section: '性格', kind: 'scenario', scene: '失败的第二天清晨',
    text: '一件事彻底搞砸了。第二天醒来，你做的第一件事是——',
    note: '失败后第一反应，暴露防御机制类型。',
    options: [
      { key: 'A', text: '立刻列计划，想怎么补救', sub: '行动型防御：用忙碌掩盖失控', maps_to: { defense_mechanism: 'overwork' } },
      { key: 'B', text: '反复回想哪里错了，怪自己', sub: '内归因：高自我苛责，esteem 易塌', maps_to: { defense_mechanism: 'self_blame' } },
      { key: 'C', text: '假装没事，照常过日子', sub: '压抑型：回避情绪，怕被看穿', maps_to: { defense_mechanism: 'suppression' } },
      { key: 'D', text: '找人吐槽，或干脆出去玩', sub: '外部调节：依赖关系或刺激转移', maps_to: { defense_mechanism: 'external_regulation' } }
    ] },
  { id: 'SH-Q04', section: '关系', kind: 'choice',
    text: '做大决定时，谁的脸会先浮现在你脑子里？', subtitle: '不是你想听谁的，是谁先出现',
    note: '关系压力源 → 六域 family/love/friendship 权重。',
    options: [
      { key: 'A', text: '父母', sub: '家庭期待主导', maps_to: { 'scenario_weights.family': 0.3 } },
      { key: 'B', text: '伴侣 / 喜欢的人', sub: '亲密关系主导', maps_to: { 'scenario_weights.love': 0.3 } },
      { key: 'C', text: '朋友 / 同辈', sub: '同辈比较主导', maps_to: { 'scenario_weights.friendship': 0.3 } },
      { key: 'D', text: '几乎只有我自己', sub: '高自主，可能无支持', maps_to: { 'scenario_weights.self_growth': 0.2 } }
    ] },
  { id: 'SH-Q05', section: '岔路口', kind: 'mood',
    text: '岔路口那天晚上，主导你的是哪种情绪？', subtitle: '点最接近的那一格',
    note: '岔路口当晚主导情绪 → 初始 mood 基线。',
    cells: [
      { key: 'A', label: '不甘 / 赌气', q: '向外 · 激烈', mood: 4 },
      { key: 'D', label: '麻木 / 装无所谓', q: '向内 · 激烈', mood: 4 },
      { key: 'C', label: '松一口气', q: '向外 · 低沉', mood: 6 },
      { key: 'B', label: '迷茫 / 空', q: '向内 · 低沉', mood: 3 }
    ] },
  { id: 'SH-Q06', section: '价值', kind: 'slider',
    text: '「算了」和「再试一次」之间，你的指针停在哪？', subtitle: '这一题，影子会记很久',
    note: 'decision_tendency 核心——决定影子在 pivotal 年往哪走。',
    min: 0, max: 100, left: '算了，就这样', right: '再试一次',
    tiers: [[0, 25, '学会放手'], [26, 50, '会权衡'], [51, 75, '倾向再拼一次'], [76, 100, '几乎永远不甘心']],
    feedback: [[0, 25, '你懂得什么时候停下。'], [26, 50, '你会算成本。'], [51, 75, '你倾向再给自己一次机会。'], [76, 100, '『再撑一下』，可能是本能，也可能是陷阱。']] },
  { id: 'SH-Q07', section: '价值', kind: 'binary',
    text: '如果只能保住一个——', subtitle: '面子，还是真实的自己？',
    note: '面子 vs 真实，核心价值冲突。',
    options: [
      { key: 'A', text: '体面地撑住', sub: '面子优先，esteem 依赖外部' },
      { key: 'B', text: '难看也要做真的自己', sub: '真实优先，自我一致高于认可' }
    ] },
  { id: 'SH-Q08', section: '价值', kind: 'rank',
    text: '往后七年，你最怕失去哪一样？', subtitle: '按怕的程度，从上往下排',
    note: '恐惧排序 → soft_spots 主轴 + 六域微调。',
    items: [
      { key: 'A', text: '重要的关系', sub: '丧失焦虑 → 亲密/家庭' },
      { key: 'B', text: '做成事的成就', sub: '丧失焦虑 → 事业/学业' },
      { key: 'C', text: '自己的自由', sub: '丧失焦虑 → 自主' },
      { key: 'D', text: '被人真正理解', sub: '丧失焦虑 → 被看见' }
    ] },
  { id: 'SH-Q09', section: '岔路口', kind: 'scenario', scene: '决定的前夜',
    text: '岔路口的前一夜，你大概率在干嘛？', subtitle: '凭直觉选',
    note: '前夜行为模式，暴露应对焦虑的真实方式。',
    options: [
      { key: 'A', text: '反复查资料、列利弊，睡不着', sub: '焦虑性过度准备，控制感缺失' },
      { key: 'B', text: '和某个人聊到很晚', sub: '依赖外部确认来下决心' },
      { key: 'C', text: '假装这事不存在，刷手机睡了', sub: '回避型，推迟面对' },
      { key: 'D', text: '其实早就决定了，很平静', sub: '决心已定，或事后合理化' }
    ] },
  { id: 'SH-Q10', section: '性格', kind: 'choice',
    text: '用一句话形容那时候的自己，哪句最像？', subtitle: '选最扎心的那个',
    note: 'core_traits archetype 锚定 + Persona voice 校准。',
    options: [
      { key: 'A', text: '「再撑一下，撑过去就好了」', sub: 'archetype 硬撑者 · 要强+怕认输', maps_to: { archetype: 'the_endurer' } },
      { key: 'B', text: '「我是不是根本不该来」', sub: 'archetype 怀疑者 · 自我否定+迷茫', maps_to: { archetype: 'the_doubter' } },
      { key: 'C', text: '「只要别人觉得我可以就行」', sub: 'archetype 取悦者 · 外部驱动', maps_to: { archetype: 'the_pleaser' } },
      { key: 'D', text: '「随便吧，反正也没差」', sub: 'archetype 抽离者 · 假装无所谓', maps_to: { archetype: 'the_detached' } }
    ] }
];

function intakeDetectDomain(text, tags) {
  const score = Object.fromEntries(Object.keys(INTAKE_DOMAINS).map(k => [k, 0]));
  const t = (text || '').toLowerCase();
  for (const [k, v] of Object.entries(INTAKE_DOMAINS)) {
    for (const w of v.kw) {
      if (t.includes(w.toLowerCase())) score[k] += 1;
    }
  }
  for (const tag of tags || []) {
    if (INTAKE_TAG_DOMAIN[tag]) score[INTAKE_TAG_DOMAIN[tag]] += 0.6;
  }
  const entries = Object.entries(score).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const top = entries[0];
  const conf = total > 0 ? Math.min(0.95, 0.35 + top[1] / Math.max(total, 1) * 0.6) : 0;
  return { top: top[0], conf, dist: score, total };
}

window.ShadowIntakeQuestions = {
  SECTIONS: INTAKE_SECTIONS,
  DOMAINS: INTAKE_DOMAINS,
  EXAMPLES: INTAKE_EXAMPLES,
  QUESTIONS: INTAKE_QUESTIONS,
  TAG_DOMAIN: INTAKE_TAG_DOMAIN,
  detectDomain: intakeDetectDomain
};
