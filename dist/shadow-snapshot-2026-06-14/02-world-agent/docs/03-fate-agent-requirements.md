# 命运 Agent 与时代信息库 — 产品需求

更新时间：2026-06-14  
语料与后端：`shadow-corpus/world/`

## 产品目标

在 Shadow 平行人生叙事中引入 **第 6 个 agent — 命运 Agent**，基于 **2006–2026 中国大陆真实时代语料**，为每一年叙事注入可验证的宏观背景与可随机抽样的微观际遇；用户额外输入 **岔路口公历年份** 与 **出生年份**。

## 用户输入（profile 扩展）

| 字段 | 类型 | 说明 |
|------|------|------|
| `birth_year` | int | 出生公历年份，必填 |
| `fork_year` | int | 岔路口发生的公历年份（第 0 年），必填 |
| `age` | int | 保留；岔路口时年龄，应与 `fork_year - birth_year` 一致（允许 ±1，生日未过） |

校验：

- `birth_year` ∈ [1950, 2010]（可配置）
- `fork_year` ∈ [2006, 2019]（保证叙事第 1–7 年落在语料库 2006–2026 内）
- `fork_year - birth_year` 与 `age` 差值 ≤ 1

## 公历与叙事年映射

| 叙事阶段 | 公历 | 是否对用户可见 |
|----------|------|----------------|
| 第 0 年 | `fork_year` | **是** — 岔路口当年，单独展示「做出选择那一刻」 |
| 第 1–7 年 | `fork_year + 1` … `fork_year + 7` | 是 — 现有七年回放 |

## 命运 Agent 职责

**三层输出**（每年 Year agent 调用前各跑一次）：

1. **宏观层（macro）**：从 Supabase / 本地 JSON 读取该公历年的真实大事件、政策、经济文化指标、社会情绪。
2. **微观层（micro）**：从该年 `micro_events` 池按 **权重 + run_id 可复现随机** 抽取 3–5 条「个人可能遇上的际遇」。
3. **侧重层（scenario_weights）**：六域权重（亲情/爱情/友情/学业/事业/自我成长），由 profile + persona + 叙事年 + beat 类型计算，偏置抽样与 Year prompt。

**对主线影响（分层）**：

- **quiet 年**：时代信息主要作氛围、细节、对话钩子；不强制改 Beats。
- **pivotal 年**：允许将抽中的 `can_pivot=true` 微观事件升格为剧情 seed 候选，由 Year agent 与人格卡融合。

## 语料量级（验收）

每个公历年（2006–2026，共 21 年）：

| 类型 | 最低条数 | 要求 |
|------|----------|------|
| `macro_events` | **≥ 30** | 必须真实、可标注 `source_url`；含 politics / economy / education / tech / culture / disaster / policy / daily_life 等分类 |
| `micro_events` | **≥ 80** | 个人尺度际遇；带 `weight`、`tags`、`can_pivot`、**`scenario`（六域之一）** |
| **六域子池** | **每域 ≥ 30 / 年** | `world/lib/scenario-pools/{family,love,...}.mjs` 专属 micro，合并进 `micro_events` |
| `atmosphere` | **≥ 15 个量化/定性字段** | GDP、CPI、高考人数、网民规模、房价体感、流行语、 dominant_anxiety 等 |
| `pop_culture` | **≥ 10** | 影视、综艺、游戏、神曲、梗 |
| `sources` | **≥ 5** | 采集依据 URL |

敏感事件（地震、疫情、事故等）：**允许进入语料，必须真实**，标注 `sensitivity: high|medium|low`；pivotal 升格时仍服从叙事协议（不消费灾难、不鸡汤）。

## 随机性

- 加权抽样：`weight` 越高越常被抽到。
- **六域侧重**：`scenario_weights` 偏置 micro/macro 抽样（见 [`02-technical-design/04-scenario-weight-system.md`](../02-technical-design/04-scenario-weight-system.md)）。
- 可复现：`hash(run_id + calendar_year + narrative_year)` 作 PRNG seed。
- 每次 Fate 调用输出写入 session `fate_contexts[]`，供 Year / trace 只读。

## 存储

- **主库**：Supabase Postgres（`world/` 下 schema + seed 脚本）
- **本地**：`world/data/years/{year}.json` 为冻结快照与离线 fallback
- **路径**：独立 `shadow-corpus/world/`，不放入 `fixtures/`

## 管线位置

```
Profile(+birth_year, +fork_year)
  → Persona
  → Beats
  → [展示第 0 年 / fork_year 场景]
  → loop 叙事年 1..7:
       Fate(calendar_year) → Year → ...
  → Final → Dialogue
```

## 验收标准

- [ ] 21 个公历年语料均达上述量级下限
- [ ] 每条 macro 有 `source_url` 或权威出处说明
- [ ] `npm run world:validate` 通过 schema 与计数检查
- [ ] `npm run world:seed` 可写入 Supabase（需环境变量）
- [ ] Fate agent 输出 Zod schema 与 `02-technical-design/03-fate-agent-and-world-db.md` 一致
- [ ] 第 0 年（fork_year）在前端/契约中可展示
- [ ] golden 复读线 eval 不因 Fate 层降级（Fate 为增强，非破坏）

## 非目标

- 不做全球多国语料（仅中国大陆为主，可含少量国际事件对中国青年影响）
- 不做实时新闻抓取（语料版本冻结，定期人工/脚本批量更新）

## 相关文档

- 技术方案：[`02-technical-design/03-fate-agent-and-world-db.md`](../02-technical-design/03-fate-agent-and-world-db.md)
- **六域权重**：[`02-technical-design/04-scenario-weight-system.md`](../02-technical-design/04-scenario-weight-system.md)
- 叙事协议扩展：[`03-coding/01-narrative-prompt-protocol.md`](../03-coding/01-narrative-prompt-protocol.md)（待增 Fate 节）
- 语料目录：[`world/README.md`](../world/README.md)
