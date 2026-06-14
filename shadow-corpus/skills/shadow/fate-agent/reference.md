# Fate Agent — Reference

## 文件地图

```
shadow-corpus/world/
├── lib/
│   ├── scenario-domains.mjs    # SCENARIO_DOMAINS, inferScenario, KEYWORD_SCENARIO
│   ├── fate-weights.mjs        # computeFateWeights()
│   ├── sample-fate.mjs       # sampleFateContext() — 编排入口
│   ├── micro-expand.mjs        # 通用 micro 模板层（~97/年）
│   ├── helpers.mjs             # macro(), micro(), scenarioMicro()
│   ├── scenario-pools/         # 六域专属子池（各 35+）
│   └── era-corpus/
│       ├── year-specific.mjs   # 2006–2026 宏观种子
│       └── universal-macros.mjs
├── data/years/{2006..2026}.json
├── schema/
│   ├── era-year.schema.json
│   ├── 001_world_era_library.sql
│   └── 002_scenario_domain.sql
└── scripts/
    ├── generate-era-draft.mjs
    ├── validate-era.mjs
    ├── seed-supabase.mjs
    ├── import-notebooklm-patch.mjs
    ├── query-corpus.mjs          # 本地结构化检索
    └── demo-fate-weights.mjs
```

NotebookLM 合并：`notebooklm/00-如何使用.md` → `data/notebooklm-import/*.patch.json` → `import-notebooklm-patch.mjs`。  
架构图：`world/docs/ARCHITECTURE.md`。语义检索：`packages/rag-kit/scripts/query.mjs`。

文档：

- `01-requirements/03-fate-agent-requirements.md`
- `02-technical-design/03-fate-agent-and-world-db.md`
- `02-technical-design/04-scenario-weight-system.md`

## computeFateWeights 算法

输入：`profile`, `persona_card`, `narrativeYear` (0–7), `beatType`, `priorInterventions[]`

1. `raw = uniform(1/6)`
2. `scanText(profile.choice|keywords|quote|description)` → KEYWORD_SCENARIO 加分
3. `fromPersona(soft_spots, growth_seed, …)` → 加分；soft_spots 存在则 `self_growth += 0.15`
4. `priorInterventions` 文本加分
5. `narrativeYear === 0` → FORK_YEAR0_BOOST（academic/family/self_growth）
6. `NARRATIVE_YEAR_NUDGE[n]` 表
7. `normalizeWeights`
8. `beatType === 'pivotal'` → Top3 域 ×1.25 再归一化

输出：`weights`, `primary`, `secondary`, `emphasis_line`, `rationale[]`

## sampleFateContext 算法

1. `fateWeights = computeFateWeights(...)`
2. `macroN = pivotal ? 10 : 6`；`microN = pivotal ? 5 : 3`
3. quiet 年过滤高 weight 的 `can_pivot` micro（weight ≥ 0.85）
4. `weightedSample(pool, n, seed, fateWeights.weights)`  
   `effective = item.weight × scenario_weights[item.scenario]`
5. 组装 `FateContext`（含 `scenario_weights`, `emphasis_line`, `era_line`）

## FateContext 字段（契约）

```typescript
{
  calendar_year: number;
  narrative_year: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  scenario_weights: Record<ScenarioDomain, number>; // sum ≈ 1
  scenario_primary: ScenarioDomain;
  scenario_secondary: ScenarioDomain;
  emphasis_line: string;          // 注入 Year prompt 首行
  macro_sample: Array<{ category, title, detail, source_url, scenario? }>;
  micro_sample: Array<{ text, can_pivot, category, scenario }>;
  atmosphere_slice: object;
  pop_culture_slice: string[];
  era_line: string;               // ≤120 字摘要
}
```

## 语料量级门槛

| 项 | 最低 |
|----|------|
| macro_events / 年 | 30 |
| micro_events / 年 | 80 |
| micro per scenario / 年 | 30 |
| atmosphere keys | 15 |
| pop_culture | 10 |
| sources | 5 |

## inferScenario 规则

1. `CATEGORY_SCENARIO[category]` +2 票
2. 每个 tag 按 `TAG_SCENARIO_HINTS` +1
3. macro category 按 `MACRO_SCENARIO_HINTS` +0.5
4. 最高票域胜出；默认 `self_growth`

## Supabase 表

- `world_years(calendar_year PK, summary, social_mood, atmosphere jsonb, …)`
- `world_macro_events(…, category, title, detail, source_url, weight, sensitivity, tags)`
- `world_micro_events(…, category, text, weight, can_pivot, sensitivity, tags, scenario)`

RLS：SELECT 公开；写入仅 service_role。

## 扩展指南

### 新加一条 academic micro

`world/lib/scenario-pools/academic.mjs` → `scenarioMicro('academic', 'school', '…', weight, can_pivot, sensitivity, tags)`

### 新加宏观事件

`year-specific.mjs` 对应年 `macros.push(macro(...))` — 须真实 + source_url。

### 新关键词 → 域

`scenario-domains.mjs` → `KEYWORD_SCENARIO.push({ re, domain, boost })`

### 叙事年 nudge

`fate-weights.mjs` → `NARRATIVE_YEAR_NUDGE`

## 环境变量

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
WORLD_CORPUS_VERSION=2026.06.14-v1
```
