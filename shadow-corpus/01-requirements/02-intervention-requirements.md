# Shadow 介入设计规则

更新时间：2026-06-16

Pivotal 介入是 Shadow 核心体验。本文档定义何时介入、如何写、选择如何影响后续。

## 何时必须出现 intervention

- 仅 **pivotal 年**（beats.type = pivotal）。
- quiet 年禁止 intervention。
- 一年最多一个 intervention 弹窗（在当年叙事 reveal 后弹出）。
- **Generate / Live**：逐年 SSE 在 pivotal 年生成完成后暂停弹窗，用户选择后写入 `pendingIntervention`，下一年请求携带。

## 好的 intervention question

- 20-30 字，让用户面对影子**此刻**的抉择。
- 与当年 event、decision_made 直接相关。
- 两个选项都「像这个人会纠结的真实选择」，不是明显正确答案。

**示例（复读线年 1）**

> 告诉父母自己其实不想复读，还是继续撑下去？

## 两个 option 的规则

- 恰好 2 个，每个 4-8 字。
- **互斥**：选 A 就不能同时选 B 的路径。
- **都有代价**：不能一个是「完美结局」、一个是「明显愚蠢」。
- 禁止假选择：「继续 / 不继续」若语义相同则无效。

## 禁止的假选择

- 「努力 / 不努力」
- 「坚持 / 放弃」过于抽象
- 选项不影响下一年叙事实质
- 两个选项指向同一后果

## 用户选择之后

Live / Generate mode 流程：

1. 用户在 pivotal 年弹窗选择 → 规范化 `user_intervention`（`from_year` + `question` + `choice`）。
2. 写入 pivotal 年对象；`memory_stream` 追加 `type: decision` 条目。
3. 调用 **LLM re-plan** 修订后续 beat seed（失败回退规则占位）。
4. 下一年 Year prompt 含 **介入因果硬约束** + **累积 intervention_history**。
5. 下一年 `event` **第一段**须写选择的即时后果；`decision_made` 体现后果驱动的下一步。

本地预生成故事：若 session 已含 `user_intervention`，Demo 展示「已选」不再重复弹窗。

## 用户不选时

- 弹窗可关闭；不阻塞「下一年」按钮。
- Live mode：`user_intervention` 为 null，下一年按 persona + memory 自然推演。
- 不在 UI 层伪造默认选择。

## 验收

- 规则 eval（v2 / live）：`intervention.thread` 为 **error**——下一年 event 前 80 字须承接选择。
- 规则 eval：`year.event_volume` 全年 160–240 字；`visual_anchor` / `key_props` 必填。
- 自动：`intervention-replan.test.js` mock A/B 分叉；`未复读线-阿岚.json` v2 eval 无 error。
- 人工：读标杆 `docs/stories/未复读线-阿岚.json` 与 generate 全流程对照。
