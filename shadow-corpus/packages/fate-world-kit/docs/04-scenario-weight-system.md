# 命运 Agent — 六域权重与场景细分

更新时间：2026-06-14

命运 Agent 不是均匀撒事件，而是每叙事年输出 **六类场景侧重**，再据此偏置语料抽样。

## 六类场景 Agent

| 域 `scenario` | 中文 | 负责的问题 |
|---------------|------|------------|
| `family` | 亲情 | 家庭期待、父母关系、责任与愧疚 |
| `love` | 爱情 | 分手复合、异地恋、亲密关系选择 |
| `friendship` | 友情 | 朋友疏远、圈子变化、陪伴与距离 |
| `academic` | 学业 | 复读、考研、换专业、留学 |
| `career` | 事业 | 就业、考公、创业、转行、城市机会 |
| `self_growth` | 自我成长 | 走出舒适区、身份认同、人生方向、长期遗憾 |

实现：`world/lib/scenario-domains.mjs`

## 权重怎么算

`computeFateWeights()`（`world/lib/fate-weights.mjs`）：

1. **基线**：六域均匀 1/6  
2. **Profile**：`choice`、`keywords`、`quote` 关键词匹配加分  
3. **Persona**：`soft_spots`、`growth_seed`、`decision_tendency` 加分  
4. **Prior interventions**：已发生选择文本加分  
5. **叙事年 nudge**：第 0 年（岔路口）偏 `academic` + `family` + `self_growth`；第 4/6 年偏 `career` 等  
6. **Beat 类型**：`pivotal` 时将 Top3 域再放大 25% 后归一化  

输出：

```jsonc
{
  "scenario_weights": { "family": 0.22, "academic": 0.31, ... },
  "scenario_primary": "academic",
  "scenario_secondary": "self_growth",
  "emphasis_line": "本年命运侧重：学业（31%）· 自我成长（24%）"
}
```

## 权重如何影响抽样

`sampleFateContext()` 对 micro / macro 条目：

```
effective_weight = item.weight × scenario_weights[item.scenario]
```

同 seed 下可复现；**复读线**（choice 含「复读」）应稳定偏 **学业 + 自我成长**。

## 语料标注

每条 `micro_events[]` 增加 `scenario` 字段（生成器自动 `inferScenario()`）。  
Supabase：`world_micro_events.scenario`（见 `schema/002_scenario_domain.sql`）。

## Fate 输出扩展

在原有 `fate_context` 上增加：

- `scenario_weights`
- `scenario_primary` / `scenario_secondary`
- `emphasis_line`
- `micro_sample[].scenario`

Year agent prompt 应读 `emphasis_line`，让 quiet 年细节、pivotal 年冲突 **落在侧重域内**，但不排斥其他域作背景。

## 六域专属子池

```
world/lib/scenario-pools/
├── index.mjs          # expandScenarioMicros(year)
├── family.mjs         # 35 条
├── love.mjs           # 35 条
├── friendship.mjs     # 35 条
├── academic.mjs       # 36 条
├── career.mjs         # 36 条
└── self-growth.mjs    # 35 条
```

生成时与 `micro-expand.mjs` 通用层合并；校验要求**每个公历年、每个 scenario ≥ 30 条**。

## 后续：六场景子 Agent

当前为 **单 Fate Orchestrator + 六域子池 + 权重透镜**；下一步可拆为各 lens 独立 prompt / 候选合并（见 [`04-scenario-weight-system.md`](./04-scenario-weight-system.md)）。

## 本地试跑

```bash
cd shadow-corpus/world
node scripts/demo-fate-weights.mjs
```
