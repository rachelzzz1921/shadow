# 阶段七：Debug 与自我纠错

> AI 分析，人决策，AI 执行。禁止 AI 自由修复绕过人工判断。

## 文章列表

| 序号 | 标题 | 状态 |
|------|------|------|
| 01 | [Stop 与 Escalation](./01-stop-and-escalation.md) | ✅ |
| 02 | [Trace 复盘工作流](./02-trace-review-workflow.md) | ✅ |
| 03 | [测试失败工作流](./03-test-failure-workflow.md) | ✅ |

## 三个纠错节点

| 节点 | 触发 | 动作 |
|------|------|------|
| 编码后 | Lint/test fail | 修 test → story-review |
| 自测失败 | evaluator error | debug-analyst → 人工确认 |
| QA 失败 | E2E / review fail | debug-analyst + trace |

## Subagent

[`.claude/agents/debug-analyst.md`](../.claude/agents/debug-analyst.md)
