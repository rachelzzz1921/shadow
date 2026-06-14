# progress.md Schema Reference

This file defines the canonical format for `openspec/changes/<change-id>/progress.md`.

## File Location

```
openspec/changes/<change-id>/progress.md
```

Sits alongside `spec.md`, `design.md`, `test-cases.md`, `qa-test-cases.md`, `qa-audit.md`.

## YAML Frontmatter Fields

```yaml
---
change_id: FEAT-0023              # openspec change directory name (unique ID)
title: 用户分层推送功能              # human-readable title (from spec.md first heading)
phase: coding                     # current engineering phase (see valid values below)
blocked: false                    # whether this change is currently blocked
blocked_reason: ""                # reason string when blocked=true, empty otherwise
assignee: "@zhang-wei"            # primary owner (@username format, empty if unassigned)
exec_plan: "docs/exec-plans/active/2026Q2-push-platform.md"  # relative path to parent exec-plan, empty if none
created_at: 2026-04-10            # date progress.md was first created (YYYY-MM-DD)
updated_at: 2026-04-24            # date of most recent update (YYYY-MM-DD)
---
```

### Valid phase values

| Value | Description |
|-------|-------------|
| `requirements` | Requirement captured in openspec, not yet in design |
| `design` | design.md created and being worked on |
| `coding` | spec.md + tasks.md exist, implementation underway |
| `dev-testing` | test-cases.md created, unit/API tests running |
| `qa-testing` | qa-test-cases.md created and review-approved |
| `done` | qa-audit.md shows all scenarios passing |

`blocked` is not a phase value — it is a separate boolean flag.

## Full Template

Use this template when creating a new progress.md (replace `{...}` placeholders):

```markdown
---
change_id: {CHANGE_ID}
title: {TITLE}
phase: {PHASE}
blocked: false
blocked_reason: ""
assignee: ""
exec_plan: ""
created_at: {DATE}
updated_at: {DATE}
---

# 进度记录：{CHANGE_ID} {TITLE}

## 当前状态

| 字段 | 值 |
|------|---|
| 当前阶段 | {PHASE} |
| 是否阻塞 | 否 |
| 负责人 | — |
| 所属 exec-plan | — |
| 创建时间 | {DATE} |
| 最后更新 | {DATE} |

## 阶段历史

| 时间 | 阶段 | 操作 | 触发方式 | 操作人/脚本 |
|------|------|------|----------|------------|
| {DATETIME} | {PHASE} | 进入 | {TRIGGER} | {ACTOR} |

## 阻塞记录

| 时间 | 操作 | 原因 | 操作人 |
|------|------|------|--------|
| （暂无） | | | |

## 产物检查单

| 产物 | 文件路径 | 对应阶段 |
|------|---------|---------|
| Proposal | spec.md (proposal 部分) | requirements |
| Design | design.md | design |
| Spec + Tasks | spec.md + tasks.md | coding |
| 研发测试用例 | test-cases.md | dev-testing |
| QA 测试用例 | qa-test-cases.md | qa-testing |
| QA 审计日志 | qa-audit.md | done |
```

## Update Rules

### Phase transition (forward)
1. Update `phase` in frontmatter
2. Update `updated_at` in frontmatter
3. Update "当前阶段" row in 当前状态 table
4. Append new row to 阶段历史 table

### Block
1. Set `blocked: true`, `blocked_reason: [reason]`
2. Update `updated_at`
3. Update "是否阻塞" row: `是 — [reason]`
4. Append row to 阻塞记录 table: `操作=标记阻塞`

### Unblock
1. Set `blocked: false`, `blocked_reason: ""`
2. Update `updated_at`
3. Update "是否阻塞" row: `否`
4. Append row to 阻塞记录 table: `操作=解除阻塞`

## Idempotency

The `post-progress-update` hook checks `TARGET_IDX <= CURRENT_IDX` before writing.
Re-creating the same artifact does not append duplicate history rows.
