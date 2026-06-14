# 阶段二：技术方案

本阶段覆盖 Shadow Harness 架构、5-agent 管线、API 契约与运行时设计。

## 文章列表

| 序号 | 标题 | 状态 |
|------|------|------|
| 00 | [**Harness 框架示意图**](./00-harness-framework-diagram.md) | ✅ |
| 01 | [Shadow Harness 闭环](./01-shadow-harness-loop.md) | ✅ |
| 02 | [API 与 JSON 契约](./02-api-and-contract.md) | ✅ |
| 02b | [P0 迁移：Memory / Reflection / re-plan](./02-p0-memory-reflection-replan.md) | ✅ |
| 03 | [Demo 文件地图](./03-demo-file-map.md) | ✅ |
| 03c | [Demo UI 设计文档](../visual/05-ui-design-document.md) | ✅ draft |
| 03b | [命运 Agent 与 World DB](./03-fate-agent-and-world-db.md) | 📋 队友实现 |

## 两章关系

**Harness Loop 是全局架构；API/契约是具体接口。**

```
harness-init（CLAUDE.md + AGENTS.md）
        ↓
01-shadow-harness-loop（Goal / Actor / Feedback / Memory / Stop）
        ↓
02-api-and-contract（schemas + endpoints）
        ↓
example/shadow-demo/（实现）
```

## 核心工具

| 组件 | 路径 | 作用 |
|------|------|------|
| schemas | `example/shadow-demo/lib/schemas.js` | Zod 契约 |
| story-session | `example/shadow-demo/lib/story-session.js` | Live 编排 |
| evaluator | `example/shadow-demo/lib/evaluator.js` | 规则型 feedback |
| run-trace | `example/shadow-demo/lib/run-trace.js` | 可追溯 trace |

## 参考语料

通用 Harness 研究见 [`agent-harnass/`](../agent-harnass/README.md)（Context + Harness + Skill 元框架）。
