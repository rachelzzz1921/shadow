# Shadow 叙事反模式

更新时间：2026-06-14

坏例子清单。可用于人工 review、`lib/evaluator.js` 规则、prompt 迭代。

## Golden 字段对照（T-008）

机器验收源：[`fixtures/golden-stories/复读线.json`](../fixtures/golden-stories/复读线.json)

| 域 | 关键字段 | Eval |
|----|----------|------|
| 结构 | `beats`(7), `pivotal_years`(2–3) | `beats.*` |
| 年 | `event`, `intervention_prompt`, `memory_summary` | `year.*` |
| 记忆 | `memory_stream[].type`, `weight`, `content` | `year.memory_*` |
| 收尾 | `final.message`, `final.regret` | `final.cliche` |

完整映射见 [`05-qa-testing/03-eval-warn-decision-tree.md`](../05-qa-testing/03-eval-warn-decision-tree.md) 附录。

## 结构类

| 反模式 | 说明 | Eval code |
| --- | --- | --- |
| 每年都有大事 | pivotal >3 或 quiet 年 event 过长 | `beats.pivotal_count`, `year.quiet_length` |
| pivotal 连着来 | 两年 pivotal 相邻 | `beats.pivotal_spacing` |
| 首尾重锤 | 年 1 或年 7 为 pivotal | `beats.year1_quiet`, `beats.year7_quiet` |
| pivotal_years 漂移 | 与 beats 不一致 | `beats.pivotal_sync` |

## 文案类

| 反模式 | 说明 |
| --- | --- |
| 关键词照抄 | 用户写「要强、不甘」，剧情反复出现这两个词而无结构 |
| quiet 写成 pivotal | 平淡年 event 80+ 字、情绪剧变 |
| pivotal 写成摘要 | 大事件年只有一句话 |
| final 强行鸡汤 | 「另一条路也好」「都会好的」 | `final.cliche` |
| 影子像 AI | 「作为你的影子我建议…」 |
| reflection 复述 event | 没有领悟，只换说法 |

## 介入类

| 反模式 | 说明 | Eval code |
| --- | --- | --- |
| 假选择 | 两选项同义或无代价 | `year.intervention_distinct` |
| 介入不改变任何事 | Live 下一年忽略 user_intervention | `intervention.thread` |
| quiet 年有弹窗 | 破坏节奏 | `year.quiet_intervention` |

## Memory 类

| 反模式 | 说明 | Eval code |
| --- | --- | --- |
| memory 太抽象 | 「年3：继续努力」dialogue 无法引用 | `year.memory_abstract` |
| memory 太短 | 无具体瞬间 | `year.memory_short` |

## 视觉类

| 反模式 | 说明 |
| --- | --- |
| environment 与 event 无关 | 海边场景写办公室事件 |
| pose 永远 idle | 大事件年无姿态变化 |

## 使用方式

1. 写/改故事前读一遍。
2. `npm test` 跑 evaluator 测试。
3. Live 生成后查 `runs/*.json` 中 `eval` 字段。
