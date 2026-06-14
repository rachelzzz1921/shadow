---
name: fate-agent
description: >-
  Operates Shadow's Fate Agent and 2006–2026 China era world corpus — scenario
  weights (family/love/friendship/academic/career/self_growth), six domain micro
  pools, Supabase seed, sampleFateContext, and Year-agent injection. Use when
  building or extending 命运 agent, world/ era library, fork_year/birth_year,
  scenario_weights, scenario-pools, fate_context, or wiring era backdrop into
  parallel-life narrative.
---

# Fate Agent — 命运与时代语料

Shadow 第 6 个 agent：**在真实时代背景上，按六域侧重抽样命运际遇**，注入 Year agent。

与 `story-authoring` 分工：story-authoring 写**七年叙事正文**；fate-agent 管**时代库 + 侧重权重 + 抽样契约**，不代替叙事师写 event。

## 何时 invoke（触发词）

- 命运 agent、时代语料、world 库、2006–2026、fork_year、birth_year
- scenario_weights、六域、亲情/爱情/友情/学业/事业/自我成长
- scenario-pools、fate_context、emphasis_line、Supabase world_*
- 扩充 micro 子池、校验语料量级、seed 后端

**不要**用本 skill 替代：`story-authoring`（写 golden）、`story-review`（审叙事质量）、纯 UI 改版。

## 第一步：选任务类型

```
用户要什么？
├─ 新需求 / 改契约 ──────────→ 读 01-requirements/03-fate-agent-requirements.md
├─ 扩语料 / 加 micro 子池 ───→ § 语料工作流 + lib/scenario-pools/
├─ 调权重 / 抽样行为 ────────→ lib/fate-weights.mjs + demo-fate-weights.mjs
├─ 接 API / demo / Year prompt → § 集成 + 02-technical-design/03-*.md
├─ Supabase 建表/seed ───────→ world/schema/ + npm run seed
└─ 验收 / 抽检某年 ──────────→ § 验收清单 + npm run validate
```

## 第二步：必读（按顺序）

| 顺序 | 文件 | 何时 |
|------|------|------|
| 1 | `01-requirements/03-fate-agent-requirements.md` | 改契约或验收标准 |
| 2 | `02-technical-design/04-scenario-weight-system.md` | 动权重或六域 |
| 3 | `02-technical-design/03-fate-agent-and-world-db.md` | API / Supabase / schema |
| 4 | `world/README.md` | 命令与目录 |
| 5 | [`reference.md`](reference.md) | 实现细节、文件地图、算法 |
| 6 | [`examples.md`](examples.md) | 复读线端到端示例 |

叙事协议扩展（Fate 注入 Year prompt）待写：`03-coding/01-narrative-prompt-protocol.md` Fate 节 — 改 prompt 时同步更新。

## 核心概念（必记）

### 公历映射

| 叙事年 | 公历 | 说明 |
|--------|------|------|
| 0 | `fork_year` | 岔路口，**对用户可见** |
| 1–7 | `fork_year+1 … +7` | 七年回放 |

Profile 必填：`birth_year`、`fork_year`、`age`（与 `fork_year - birth_year` 差 ≤1）。

### 六域 Scenario

| `scenario` | 中文 | 子池文件 |
|------------|------|----------|
| `family` | 亲情 | `world/lib/scenario-pools/family.mjs` |
| `love` | 爱情 | `love.mjs` |
| `friendship` | 友情 | `friendship.mjs` |
| `academic` | 学业 | `academic.mjs` |
| `career` | 事业 | `career.mjs` |
| `self_growth` | 自我成长 | `self-growth.mjs` |

每域 **≥30 条/公历年**（子池 35+ 模板 + 通用层合并后校验）。

### 三层输出

1. **macro** — 真实大事件（带 `source_url`）
2. **micro** — 个人际遇（带 `scenario`、`can_pivot`）
3. **scenario_weights** — 六域侧重，`emphasis_line` 注入 Year prompt

抽样：`effective_weight = item.weight × scenario_weights[item.scenario]`，seed = `hash(run_id:calendar_year:narrative_year)`。

## 语料工作流

改子池或时代种子后**必须**跑：

```bash
cd shadow-corpus/world
npm run generate    # 合并 → data/years/{year}.json
npm run validate    # schema + 量级 + 六域≥30
```

扩子池：

1. 编辑 `world/lib/scenario-pools/{domain}.mjs`，用 `scenarioMicro(scenario, category, text, …)`。
2. 保持文本 **20–60 字**、第二人称或中性叙述、可 pivot 的标 `can_pivot: true`。
3. 敏感事件 **必须真实**，标 `sensitivity: high|medium`。
4. `generate` + `validate` 直到六域全绿。

宏观事件改 `world/lib/era-corpus/year-specific.mjs` 或 `universal-macros.mjs`。

## 权重调试

```bash
cd shadow-corpus/world
node scripts/demo-fate-weights.mjs
```

改权重逻辑：`world/lib/fate-weights.mjs`（关键词、叙事年 nudge、pivotal sharpen）。

改完用复读线 profile 目测：`academic` + `self_growth` 应高于 `love`（除非 choice 含感情关键词）。

## Supabase

```bash
cp world/.env.example world/.env   # SUPABASE_URL + SERVICE_ROLE_KEY
# SQL Editor 执行 schema/001_*.sql 与 002_scenario_domain.sql
cd shadow-corpus/world && npm run seed
```

## 集成 Year agent（编码阶段）

1. Session 增加 `fate_contexts[]`；每年 Year 前调用 `sampleFateContext({ runId, calendarYear, narrativeYear, beatType, pool, profile, persona_card })`。
2. Year prompt 注入：`emphasis_line`、`macro_sample`、`micro_sample`、`era_line`。
3. **quiet 年**：micro 作氛围；**pivotal 年**：允许 `can_pivot` 升格为 event seed。
4. 第 0 年 UI 展示 fork 场景 + 当年 `fate_context`（narrative_year=0）。

实现入口：`world/lib/sample-fate.mjs`；读库可先 `data/years/{y}.json`，生产 `GET /api/world/year/:y` 或 Supabase。

## 验收清单

见 [`checklist.md`](checklist.md)。摘要：

- [ ] `npm run validate` 21 年全 OK，每域 ≥30 micro
- [ ] 敏感条目有 `sensitivity`，macro 有 `source_url`
- [ ] 复读线 demo：`emphasis_line` 含学业或自我成长靠前
- [ ] 同 `run_id` 两次抽样结果一致
- [ ] 未破坏 golden 复读线 eval（Fate 为增强层）
- [ ] 改权重/子池后更新 `06-task-progress/02-prompt-experiments-log.md`（若影响 live 叙事）

## 与 sibling skill 协作

| 场景 | Skill |
|------|-------|
| 写七年故事正文 / golden | `story-authoring` |
| 审 narrative 质量 | `story-review` |
| Fate 语料 / 权重 / seed | **fate-agent**（本 skill） |
| 改 prompts.js + test | `tdd` |
| 需求尚模糊 | `brainstorming` → 再回本 skill |

## 不要

- 不要编造宏观事件 — 必须可溯源；2025–2026 外推需标注。
- 不要均匀抽样 — 必须走 `scenario_weights`。
- 不要在 quiet 年强制 pivotal 级灾难消费。
- 不要改 `skills/pool/` — Shadow 领域 skill 只改 `skills/shadow/fate-agent/`。
- 不要跳过 `validate` 就 claim 语料完成。

## 维护本 skill

- 架构变更 → 同步 `reference.md` + `02-technical-design/04-*.md`
- 新增第七域 → 改 `scenario-domains.mjs`、schema、子池、manifest 描述（Rare）
- 新 skill 后跑：`./shadow-corpus/skills/sync-cursor-links.sh`
