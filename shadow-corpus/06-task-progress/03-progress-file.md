# Progress 文件规范

可选。多需求并行时，每个 change 目录放一份 `progress.md`。

## 模板

```yaml
---
change_id: FEAT-0001
title: 新增第三条本地故事线
current_stage: coding   # requirements | design | coding | dev-test | qa | done
blocked: false
blocked_reason: ""
updated_at: 2026-06-14
---

## 阶段历史

| 阶段 | 进入时间 | 触发产物 |
|------|----------|----------|
| requirements | 2026-06-10 | 01-shadow-product-requirements.md |
| design | 2026-06-11 | 02-api-and-contract.md |
| coding | 2026-06-12 | lib/prompts.js |

## 阻塞记录

（无）
```

## 阶段枚举

| stage | 含义 |
|-------|------|
| `requirements` | 01-requirements 文档就绪 |
| `design` | 02-technical-design 方案就绪 |
| `coding` | lib/prompts 或 lib/agents 变更 |
| `dev-test` | npm test + golden pass |
| `qa` | story-review pass |
| `done` | 已合并 / 可演示 |

## Hook 映射

见 [`hooks/scripts/post-progress-update.sh`](../hooks/scripts/post-progress-update.sh)
