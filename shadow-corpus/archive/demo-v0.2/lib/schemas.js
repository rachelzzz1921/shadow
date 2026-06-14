'use strict';

const { z } = require('zod');

const SCENES = ['city', 'home', 'office', 'nature', 'night', 'rain'];
const ENVIRONMENTS = [
  'office', 'home', 'hospital', 'seaside', 'stage', 'studio',
  // v2 additions
  'classroom', 'dorm_night', 'trainstation', 'postoffice', 'cafeteria'
];
const POSES = [
  'idle', 'run', 'sit', 'phone', 'type', 'write', 'tired', 'celebrate', 'carry',
  // v2 additions (mapped through Sunnyside actions)
  'doing', 'wait', 'hurt', 'cast', 'reel', 'walk', 'think', 'read'
];
const PROPS = ['desk', 'laptop', 'phone', 'hospital', 'suitcase', 'stage'];
const CITIES = ['city1', 'city2', 'city3', 'city4', 'city5', 'city6', 'city7', 'city8'];
const MEMORY_TYPES = ['event', 'reflection', 'relation', 'decision'];

const PersonaCardSchema = z.object({
  name: z.string().min(1).max(4)
    .describe('影子的名字，2-3 个汉字，名字要暗合性格，不要叫"影子"本身'),
  core_traits: z.array(z.string()).min(2).max(4)
    .describe('核心特质，每条 4-6 字，从用户输入透视到的底层结构'),
  soft_spots: z.array(z.string()).min(2).max(3)
    .describe('软肋或防御机制，每条 8-15 字。这是七年命运推演的命门'),
  decision_tendency: z.string().min(10).max(40)
    .describe('做决定时的倾向，一句话。要能解释他为何会在岔路口选某一边'),
  growth_seed: z.string().min(10).max(40)
    .describe('七年里他需要面对的成长课题，埋在叙事里慢慢浮上来')
});

const BeatSchema = z.object({
  year: z.number().int().min(1).max(7),
  type: z.enum(['pivotal', 'quiet'])
    .describe('pivotal=改变命运的大事件年；quiet=平淡掠过的年份'),
  seed: z.string().min(8).max(40)
    .describe('这一年的基调或将发生什么的一句话种子')
});

const BeatsSchema = z.object({
  beats: z.array(BeatSchema).length(7),
  pivotal_years: z.array(z.number().int().min(1).max(7)).min(2).max(3)
    .describe('2-3 个 pivotal 年的 year 数字，必须与 beats 中 type=pivotal 的项一致')
});

const InterventionPromptSchema = z.object({
  question: z.string().min(10).max(40)
    .describe('给用户的介入问题，20-30 字。让用户面对影子此刻的抉择'),
  options: z.array(z.string().min(2).max(12)).length(2)
    .describe('两个互斥选项，每个 4-8 字')
});

const YearSchema = z.object({
  year: z.number().int().min(1).max(7),
  age: z.number().int().min(12).max(90),
  is_pivotal: z.boolean()
    .describe('与 beat_type 严格对应：pivotal=true, quiet=false'),
  title: z.string().min(2).max(8)
    .describe('6 字以内的小标题，要有画面感'),
  scene: z.enum(SCENES),
  environment: z.enum(ENVIRONMENTS),
  pose: z.enum(POSES),
  prop: z.enum(PROPS),
  city: z.enum(CITIES)
    .describe('city1..city8 之一，按当年环境氛围选'),
  event: z.string()
    .describe('quiet 年：30 字以内一句话掠过；pivotal 年：80-120 字，完整场景+感官细节+情绪锚点。第二人称"你"叙述'),
  decision_made: z.string().min(8).max(40)
    .describe('影子这一年的关键选择 + 人格动因，一句话'),
  intervention_prompt: InterventionPromptSchema.nullable()
    .describe('仅 is_pivotal=true 时填写，否则为 null'),
  emotion: z.object({
    label: z.string().min(1).max(4).describe('主导情绪，单词'),
    value: z.number().int().min(1).max(10)
  }),
  new_mood: z.number().int().min(1).max(10)
    .describe('本年结束后的情绪值。quiet 年与上一年差距 ≤1，pivotal 年可大幅变动'),
  new_esteem: z.number().int().min(1).max(10)
    .describe('本年结束后的自我认同值。规则同 new_mood'),
  reflection: z.string().min(6).max(45)
    .describe('影子第一人称内心独白，40 字内，说领悟不复述事件，主题不与其他年份重复'),
  shadow_dialogue: z.string().min(6).max(35)
    .describe('七年后的影子对"现在的你"说的一句话，30 字内，有钩子有情绪'),
  memory_summary: z.string().min(6).max(30)
    .describe('这一年压成一句话存进 memory_stream，写关键转折不写细节')
});

const FinalSchema = z.object({
  title: z.string().min(4).max(12)
    .describe('这条平行人生的标题，6-10 字'),
  message: z.string().min(20).max(80)
    .describe('影子隔着七年对现在的你说的最后一段话，60 字内。要像走过的人说话，不要鸡汤'),
  regret: z.string().min(8).max(30)
    .describe('这条平行路真实存在的遗憾，一句话 25 字内'),
  scene: z.enum(SCENES).describe('收尾画面'),
  emotion_arc: z.string().min(10).max(40)
    .describe('一句话概括七年的情绪弧线，给前端绘制曲线时做注脚')
});

const DialogueSchema = z.object({
  reply: z.string().min(20).max(80)
    .describe('影子的回答，40-60 字，第一人称，必须含一个具体的细节（物件/瞬间/别人说过的话）'),
  cite_memory_ids: z.array(z.string()).min(1).max(3)
    .describe('引用的 memory_stream 条目 id 数组，至少一条'),
  mood_after: z.string().min(1).max(4)
    .describe('回答后影子的情绪状态，单词')
});

const MemoryEntrySchema = z.object({
  id: z.string(),
  year: z.number().int().min(1).max(7),
  type: z.enum(MEMORY_TYPES),
  content: z.string(),
  weight: z.number().min(0).max(1)
    .describe('记忆权重，影响后续被引用的概率。pivotal 年的事件权重应该高于 quiet 年')
});

const ProfileSchema = z.object({
  choice: z.string(),
  age: z.number().int().min(12).max(90),
  mbti: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  quote: z.string().optional(),
  description: z.string().optional(),
  photo_context: z.string().optional()
});

module.exports = {
  PersonaCardSchema,
  BeatSchema,
  BeatsSchema,
  InterventionPromptSchema,
  YearSchema,
  FinalSchema,
  DialogueSchema,
  MemoryEntrySchema,
  ProfileSchema,
  enums: { SCENES, ENVIRONMENTS, POSES, PROPS, CITIES, MEMORY_TYPES }
};
