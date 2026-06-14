---
name: story-authoring
description: Use when writing or extending Shadow local stories, golden fixtures, or narrative beats for the parallel-life demo. Covers persona, seven-year rhythm, pivotal interventions, memory_stream, and acceptance checks against 01-04 stage docs and lib/evaluator.js.
---

# Story Authoring

为 Shadow 平行人生 demo 编写或扩展**本地故事 / golden fixture**。

## 何时使用

- 新增 `LOCAL_STORIES` 条目或 `04-dev-testing/golden-stories/*`。
- 扩展 `example/shadow-demo/lib/contract.example.json`。
- 人工撰写 beats / years / memory，不依赖 live LLM。

## 先读

1. `02-technical-design/01-shadow-harness-loop.md`
2. `03-coding/01-narrative-prompt-protocol.md`
3. `01-requirements/02-intervention-requirements.md`
4. `04-dev-testing/01-narrative-eval-rubric.md`
5. `04-dev-testing/golden-stories/复读线.md`（参照）

## 好故事标准

**戳人**：soft_spots 命中用户未说出口的防御；读到 pivotal 年有具体场景细节。

**像真人**：reflection / shadow_dialogue 短、有钩子；不是总结句。

**不是鸡汤**：final 有 regret；允许未完全和解；禁止「另一条路也好」。

## 七年结构

- 7 年，2-3 pivotal，其余 quiet。
- pivotal 间隔 ≥1 年；年 1、年 7 优先 quiet。
- 情绪弧：起 → 撞墙 → 低处或平稳（可升可降，勿一路向上）。

## 介入点

- 仅 pivotal 年写 `intervention_prompt`。
- question 20-30 字；两个互斥 option，都有代价。
- 若写 branching 说明：下一年应如何承接（live 由 agent 生成，local 可写注释）。

## 禁止

- 照抄用户 keywords 当剧情。
- 爽文逆袭、强行治愈。
- quiet 年写长 event 或大情绪跳变。
- memory_summary 只有「继续努力」类抽象句。

## 工作流

1. 写 `profile`（choice, age, keywords, description）。
2. 写 `persona_card`（见 narrative-prompt-protocol Persona 段）。
3. 写 `beats` + `pivotal_years`。
4. 写 7 × `years[]`（含 staging 字段）。
5. 写 `memory_stream`（与 years 对齐，含 weight）。
6. 写 `final`。
7. 对照 `04-dev-testing/golden-stories/复读线.json` 结构。
8. 运行验收（见下）。

## 验收清单

- [ ] JSON 可被 `normalizeStory` 消费（7 years）。
- [ ] `npm test` 通过；对新故事跑同等 `evaluateStory` 无 error。
- [ ] 人工读一遍：pivotal 是否重、quiet 是否留白、final 是否有重量。
- [ ] 视觉字段 environment/pose 与 event 一致。
- [ ] intervention 选项互斥、非假选择。
- [ ] 用 `skills/story-review/SKILL.md` 做第二人 review（或自审隔日）。

## 输出

- 故事 JSON（本地故事或 golden fixture）。
- 可选：`04-dev-testing/golden-stories/<name>.md` 说明「为何好、不可退让标准」。
