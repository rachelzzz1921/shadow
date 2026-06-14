# 命运 Agent 与 World 语料库 — 技术方案

更新时间：2026-06-14

## 目录

```
shadow-corpus/world/
├── README.md
├── package.json
├── .env.example
├── schema/
│   ├── 001_world_era_library.sql    # Supabase migration
│   └── era-year.schema.json         # 本地 JSON 校验
├── lib/
│   ├── scenario-domains.mjs         # 六域定义 + inferScenario
│   ├── fate-weights.mjs             # computeFateWeights
│   ├── sample-fate.mjs              # 加权 + 可复现抽样
│   └── era-corpus/
├── scripts/
│   ├── generate-era-draft.mjs       # 生成本地 JSON
│   └── seed-supabase.mjs            # JSON → Supabase
└── data/years/
    └── {2006..2026}.json
```

## Supabase 表设计

### `world_years`

| 列 | 类型 | 说明 |
|----|------|------|
| `calendar_year` | int PK | 2006–2026 |
| `summary` | text | 年度一句话 |
| `social_mood` | text | 社会总体情绪 |
| `atmosphere` | jsonb | 量化/定性氛围包 |
| `pop_culture` | jsonb | 数组 |
| `sources` | jsonb | URL 数组 |
| `version` | text | 语料版本号 |
| `updated_at` | timestamptz | |

### `world_macro_events`

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | uuid PK | |
| `calendar_year` | int FK | |
| `category` | text | 见 enum |
| `title` | text | 短标题 |
| `detail` | text | 2–4 句具体描述 |
| `source_url` | text | 必填 |
| `weight` | float | 默认 1.0 |
| `sensitivity` | text | low / medium / high |
| `tags` | text[] | |

`category` enum：`politics_policy` | `economy` | `education` | `tech_internet` | `culture_entertainment` | `disaster_crisis` | `society` | `urban_life` | `employment` | `housing`

### `world_micro_events`

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | uuid PK | |
| `calendar_year` | int FK | |
| `category` | text | family / school / work / romance / money / health / neighborhood / digital / policy_touch |
| `text` | text | 际遇描述，20–60 字 |
| `weight` | float | |
| `can_pivot` | boolean | pivotal 年可升格 |
| `tags` | text[] | |
| `sensitivity` | text | |

### RLS

- 匿名 / 服务端：`SELECT` 开放（只读语料）
- `INSERT/UPDATE`：仅 `service_role`（seed 脚本）

## Fate Agent 输出 Schema（Zod 草案）

```javascript
FateContextSchema = z.object({
  calendar_year: z.number().int(),
  narrative_year: z.number().int().min(0).max(7), // 0 = fork
  macro_sample: z.array(z.object({
    category: z.string(),
    title: z.string(),
    detail: z.string(),
    source_url: z.string().url().optional()
  })).min(5).max(12),
  micro_sample: z.array(z.object({
    text: z.string(),
    can_pivot: z.boolean(),
    category: z.string()
  })).min(3).max(5),
  atmosphere_slice: z.record(z.unknown()),
  pop_culture_slice: z.array(z.string()).min(2).max(5),
  scenario_weights: z.record(z.number()).describe('六域权重，和为1'),
  scenario_primary: z.enum(['family','love','friendship','academic','career','self_growth']),
  scenario_secondary: z.enum(['family','love','friendship','academic','career','self_growth']),
  emphasis_line: z.string().max(60),
  era_line: z.string().max(120)
});
```

详见 [`04-scenario-weight-system.md`](./04-scenario-weight-system.md)。

## 抽样算法

```javascript
function sampleFate({ runId, calendarYear, narrativeYear, beatType, pool, profile, persona_card }) {
  const weights = computeFateWeights({ profile, persona_card, narrativeYear, beatType });
  const seed = hash(`${runId}:${calendarYear}:${narrativeYear}`);
  return {
    scenario_weights: weights.weights,
    macro_sample: weightedSample(pool.macro, macroN, seed, weights.weights),
    micro_sample: weightedSample(pool.micro, microN, seed + 1, weights.weights),
    emphasis_line: weights.emphasis_line,
    ...
  };
}
```

旧版（无侧重）：

```javascript
function sampleFateLegacy({ runId, calendarYear, narrativeYear, beatType, pool, rng }) {
  const seed = hash(`${runId}:${calendarYear}:${narrativeYear}`);
  const macroN = beatType === 'pivotal' ? 10 : 6;
  const microN = beatType === 'pivotal' ? 5 : 3;
  return {
    macro_sample: weightedSample(pool.macro, macroN, seed),
    micro_sample: weightedSample(
      beatType === 'pivotal'
        ? pool.micro
        : pool.micro.filter(m => !m.can_pivot || m.weight < 0.5),
      microN,
      seed + 1
    ),
    ...
  };
}
```

## API（后续实现）

| 端点 | 说明 |
|------|------|
| `GET /api/world/year/:calendarYear` | 读整年语料（缓存） |
| `POST /api/story/fate` | 对 session 某叙事年抽样，写 `fate_contexts` |

初期：归档 demo 可直接读 `world/data/years/*.json`；Supabase 为生产源。

## 环境变量

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # 仅 seed 脚本，勿提交
WORLD_CORPUS_VERSION=2026.06.14-v1
```

## Profile 契约扩展

```jsonc
{
  "profile": {
    "choice": "...",
    "birth_year": 2000,
    "fork_year": 2018,
    "age": 18,
    "keywords": []
  }
}
```

## 实现顺序

1. ✅ 需求 + schema + 生成器 + 本地 JSON
2. seed Supabase
3. `lib/sample-fate.mjs` 单元测试
4. 归档 demo：`runFate` + profile 字段 + 第 0 年 UI
5. `03-coding/01-narrative-prompt-protocol.md` 增 Fate 节
