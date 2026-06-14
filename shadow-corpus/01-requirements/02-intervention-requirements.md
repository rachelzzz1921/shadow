# Shadow 介入设计规则

更新时间：2026-06-14

Pivotal 介入是 Shadow 核心体验。本文档定义何时介入、如何写、选择如何影响后续。

## 何时必须出现 intervention

- 仅 **pivotal 年**（beats.type = pivotal）。
- quiet 年禁止 intervention。
- 一年最多一个 intervention 弹窗（在当年叙事 reveal 后弹出）。

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

Live mode 流程：

1. 用户在 pivotal 年弹窗选择 → 写入 `user_intervention`。
2. 用户点「下一年」→ `POST /api/story/year` 携带 `user_intervention`。
3. Year agent prompt 必须包含：`用户选择了：「…」`。
4. 下一年 `event` / `decision_made` 须从该选择后果展开。

本地预生成故事：选择仅标注在 story 对象上，不重新生成（演示用）。

## 用户不选时

- 弹窗可关闭；不阻塞「下一年」按钮。
- Live mode：`user_intervention` 为 null，下一年按 persona + memory 自然推演。
- 不在 UI 层伪造默认选择。

## 验收

- 规则 eval：`intervention.thread` 检查下一年是否承接选择（warn）。
- 人工：读 golden story `04-dev-testing/golden-stories/复读线.md` 对照。
