# 阶段一：需求引入

本阶段定义 Shadow 平行人生 demo 的产品目标、用户介入需求与验收参照。

## 文章列表

| 序号 | 标题 | 状态 |
|------|------|------|
| 01 | [产品需求与验收标准](./01-shadow-product-requirements.md) | ✅ |
| 02 | [Pivotal 介入需求](./02-intervention-requirements.md) | ✅ |
| 03 | [Golden 验收参照：复读线](../04-dev-testing/golden-stories/复读线.md) | ✅ |
| 04 | [命运 Agent 与时代语料库](./03-fate-agent-requirements.md) | ✅ |

## 核心原则

1. **Goal 明确** — 七年平行人生 + pivotal 介入 + 跨时空对话
2. **验收可测** — Zod schema + evaluator + golden JSON
3. **介入有边界** — 仅 pivotal 年弹窗，选项影响下一年上下文
4. **叙事有重量** — final 有 regret，不强行鸡汤

## 与 openspec 的对应

Shadow 当前用 markdown + JSON fixture 代替 openspec change 目录。新增功能时建议：

- 在 `01-requirements/` 写需求摘要
- 在 `02-technical-design/` 写方案
- 用 `06-task-progress/progress.md` 跟踪阶段（可选）
