# 阶段五：QA 测试

本阶段从用户视角验证 Shadow 完整业务流程，story-review 作为人工评审门禁。

## 文章列表

| 序号 | 标题 | 状态 |
|------|------|------|
| 01 | [Story Review 门禁](./01-story-review-gate.md) | ✅ |
| 02 | [E2E 场景清单](./02-e2e-scenarios.md) | ✅ |

## 与研发自测的差异

| 维度 | 研发自测（阶段四） | QA（本阶段） |
|------|-------------------|-------------|
| 视角 | 契约 / eval 规则 | 用户旅程 / 叙事质量 |
| 粒度 | TC（字段、规则） | 场景（完整回放） |
| 工具 | npm test + evaluator | 浏览器 + story-review skill |
| 人工评审 | 可选 | **强制**（warn / 敏感内容） |

## 核心 Skill

[`skills/story-review/SKILL.md`](../skills/story-review/SKILL.md)

## Subagent

[`.claude/agents/story-reviewer.md`](../.claude/agents/story-reviewer.md) — 结构化 narrative QA
