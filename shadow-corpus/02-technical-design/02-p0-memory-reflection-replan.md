# P0 三项迁移 — 技术方案

更新时间：2026-06-14  
任务：**T-011** · Gate **G2**

Memory 检索 · Reflection 写入 · Intervention re-plan（re-plan 的 **prompt 人写**，见 T-016，本文只定义接口与数据流）。

## 1. 背景

Harness 闭环要求：

- `memory_stream` 支撑 Final / Dialogue 跨时空引用（[`01-shadow-harness-loop.md`](./01-shadow-harness-loop.md)）
- pivotal 介入后下一年须承接选择（[`01-requirements/02-intervention-requirements.md`](../01-requirements/02-intervention-requirements.md)）
- Eval 不降级（[`fixtures/golden-stories/复读线.json`](../fixtures/golden-stories/复读线.json)）

## 2. Memory 检索（T-014）

### 问题

Live 模式下 `memory_stream` 逐年增长；Final / Dialogue prompt 若全量注入，噪声大、超 context。

### 方案

新增 `lib/memory-retrieval.js`：

```javascript
selectMemories(memory_stream, {
  limit: 5,           // Final 用 5，Dialogue 用 3
  at_year: 7,         // 当前叙事位置
  query: ''           // Dialogue 用户问句（可选）
})
```

**打分**（确定性，无 LLM）：

1. `weight`（pivotal 决策更高）
2. 时间邻近：`at_year - memory.year` 越小越高
3. 关键词重叠：`query` 与 `content` 字符 bigram 交集（Dialogue）

**接线**：

- `agents.runFinal` → 检索后再 `buildFinalPrompt`
- `agents.runDialogue` → 检索后再 `buildDialoguePrompt`
- 全量 stream 仍存 session / trace，仅 **prompt 裁剪**

### 验收

- 单元测试：7 条 memory 输入，limit=3 必含 weight 最高项
- Golden eval 仍 0 error

## 3. Reflection 步骤（T-015）

### 问题

Year agent 产出 `reflection`（领悟）与 `memory_summary`（入库句）可能不同；golden 中 quiet 年 3/7 的 memory `type=reflection`。

### 方案

扩展 `story-contract.js`：

```javascript
memoryFromYear(year) → { id, year, type, content, weight }
```

**type 规则**：

| 条件 | type |
|------|------|
| `is_pivotal` | `decision` |
| quiet 且 reflection 含「接受/够了/安静」等收束语义 | `reflection` |
| 其他 quiet | `event` |

weight：pivotal 0.85，reflection 0.55–0.75，event 0.5–0.7（与 golden 对齐）。

`generateNextYear` 仍 **每年 1 条** memory 入库（不翻倍），避免 eval 结构漂移。

### 验收

- `memoryFromYear` 对 golden 7 年 type 与 id 一致
- `npm test` 全绿

## 4. Intervention re-plan（T-016 边界）

**本文不定义 prompt 文案**（P2 人写 + Codex 接线）。

### 数据流

```text
user_intervention { year, choice }
  → recordIntervention(trace)
  → generateNextYear({ user_intervention })
  → Year agent prompt 含「用户选择了：…」
  → （可选）Beats agent 不重新跑；Fate agent（队友）可读 beats + intervention
```

### 接口预留

```javascript
// story-session.js — 已有
recordIntervention(trace, user_intervention)

// 队友：intervention 后更新后续 seed（Live only）
// replanBeats({ beats, intervention }) → beats'  // T-016
```

Mock / LOCAL_STORIES：**不**重新生成，仅 UI 标注选择（`docs/demo-engine.js` 已实现）。

## 5. 与命运 Agent 的边界

- **Beats**：七年节奏 seed（已有）
- **Fate Agent**（队友）：读 `beats` + `world_years`，产出 overlay / 际遇层；**不在 UI 展示 Beats**
- **Shadow Dialogue**（队友）：`ShadowAgents.dialogue` 接线 `docs/demo-data.js`

## 6. 文件清单

| 文件 | 变更 |
|------|------|
| `archive/demo-v0.2/lib/memory-retrieval.js` | 新增 |
| `archive/demo-v0.2/lib/story-contract.js` | memory type |
| `archive/demo-v0.2/lib/agents.js` | 检索接线 |
| `archive/demo-v0.2/test/memory-retrieval.test.js` | 新增 |
| `archive/demo-v0.2/lib/prompts.js` | **T-016 才改 re-plan** |

## 7. Gate

- **G2**：P3+P1 评审本文 + [`docs/plans/2026-06-14-p0-implementation.md`](../docs/plans/2026-06-14-p0-implementation.md)
- **G3**：T-014/T-015 合并 + `npm test`
