---
name: progress-tracker
description: Track and visualize the engineering phase progress of openspec changes across the full SDLC pipeline. Use when the user asks to check progress, show a board, update a phase, list changes in a phase, or wants to know "where is change X now" or "what's in coding/QA right now". Commands: show [change-id], board, board --plan [plan-id], update [change-id] [phase], list [phase], block [change-id] [reason], unblock [change-id], sync-plan [plan-id]. Triggers on: "show progress", "查看进度", "progress board", "what phase is", "update phase", "move to coding", "what's blocked", "哪个阶段", "进度看板", "阻塞", "谁在负责".
---

# Progress Tracker

Track the engineering phase of every openspec change as it moves through the full development lifecycle.

## Overview

Each openspec change has a `progress.md` file in `openspec/changes/<change-id>/` that records the current phase, assignee, history, and links to the parent exec-plan. This skill reads and writes those files to provide a unified view of all in-flight work.

Key principle: the `post-progress-update` hook drives phase transitions automatically when key artifacts are created. This skill provides manual querying and override capabilities.

## Phase Model

Valid phases (in order):

```
requirements → design → coding → dev-testing → qa-testing → done
```

`blocked` is an overlay flag (not a standalone phase). Any phase can additionally have `blocked: true`.

Phase → triggering artifact mapping:

| Phase | Artifact that triggers auto-advance |
|-------|-------------------------------------|
| requirements | (initial state when change dir is created) |
| design | design.md created |
| coding | spec.md + tasks.md both exist |
| dev-testing | test-cases.md created |
| qa-testing | qa-test-cases.md created |
| done | qa-audit.md with no FAIL/PENDING lines |

## Commands

### `show [change-id]`

Display the full progress detail for a single change.

**Steps:**
1. Build path: `openspec/changes/[change-id]/progress.md`
2. If file does not exist but directory exists:
   - Infer current phase from existing artifacts (see artifact-to-phase inference below)
   - Create a minimal `progress.md` using the template in `references/progress-schema.md`
   - Report: "progress.md not found — created with inferred phase=[phase]"
3. If neither file nor directory exists: report "Change [change-id] not found in openspec/changes/"
4. Parse and display:
   - Header line: `Phase`, `Blocked`, `Assignee`, `Plan`, `Days in current phase`
   - Artifact checklist (6 items, ✅ if file exists, ⬜ if not)
   - Recent history (last 5 rows from the history table)

**Output format:**
```
## Progress: FEAT-0023 — 用户分层推送功能

Phase:    coding  (since 2026-04-18, 6 days)
Blocked:  No
Assignee: @zhang-wei
Plan:     2026Q2-push-platform

Artifacts:
  ✅ spec.md         (requirements / design / coding)
  ✅ design.md       (design)
  ✅ tasks.md        (coding)
  ⬜ test-cases.md   (dev-testing)
  ⬜ qa-test-cases.md (qa-testing)
  ⬜ qa-audit.md     (done)

Recent History (last 5):
  2026-04-18 09:05  coding         ← auto (tasks.md created)
  2026-04-12 14:33  design         ← auto (design.md created)
  2026-04-10 10:21  requirements   ← manual
```

### `board`

Render a kanban-style board of all active changes, grouped by phase.

**Steps:**
1. Find all `openspec/changes/*/progress.md` files
2. Parse YAML frontmatter for each: change_id, title, phase, blocked, assignee
3. Exclude changes with phase=done (unless `--all` flag is used)
4. Group by phase; prefix blocked items with 🔴
5. Render using the layout in `references/board-template.md`
6. Print summary line and blocked detail below board

**Optional flags:**
- `--plan [plan-id]`: only show changes where `exec_plan` matches plan-id
- `--all`: include done changes

**Output format:**
```
## Progress Board  [2026-04-24]

| requirements | design | coding | dev-testing | qa-testing |
|---|---|---|---|---|
| FEAT-0031 | FEAT-0028 | 🔴 FEAT-0021 | FEAT-0025 | FEAT-0019 |
| (@li-ming) | (@chen-fang) | (BLOCKED) | (@wang-jun) | (@qa-team) |
| | | FEAT-0023 | | |
| | | (@zhang-wei) | | |

Totals: requirements=1  design=1  coding=2  dev-testing=1  qa-testing=1
Blocked: 1 — FEAT-0021: 依赖服务未就绪
```

### `update [change-id] [phase]`

Manually set the phase of a change.

**Steps:**
1. Read current `progress.md`
2. Validate transition:
   - Forward transitions (within 1 step): allowed
   - Skip or rollback: rejected unless `--force` flag is provided
3. Update frontmatter: `phase`, `updated_at`
4. Update current state table row
5. Append new row to phase history table: mark as `manual`
6. Report: "FEAT-0023: coding → dev-testing (manual)"

**Illegal transitions (without --force):**
- Skipping more than 1 phase forward
- Any rollback (e.g., coding → design)

When `--force` is used, require a brief reason (`--reason "..."`) and record it in the history row.

### `list [phase]`

List all changes currently in a given phase.

**Steps:**
1. Find all `openspec/changes/*/progress.md` files
2. Filter by `phase == [phase]` in frontmatter
3. For each match, compute "days in phase" from the most recent history entry for that phase
4. Output as a table

**Output:**
```
## Changes in: coding  (2 total, 1 blocked)

| Change ID | Title | Assignee | Days in Phase | Blocked |
|-----------|-------|----------|---------------|---------|
| FEAT-0023 | 用户分层推送功能 | @zhang-wei | 6 | No |
| FEAT-0021 | 消息队列重构 | @li-fang | 12 | 🔴 Yes — 依赖服务未就绪 |
```

Valid phase values: `requirements`, `design`, `coding`, `dev-testing`, `qa-testing`, `done`, `blocked`

When `blocked` is used as phase, list all changes with `blocked: true` (regardless of their current phase).

### `block [change-id] [reason]`

Mark a change as blocked.

**Steps:**
1. Read `progress.md`
2. Set `blocked: true`, `blocked_reason: [reason]`, `updated_at: today`
3. Update current state table: 是否阻塞 → `是 — [reason]`
4. Append row to blocked history table: `时间=[now], 操作=标记阻塞, 原因=[reason]`
5. Report: "FEAT-0021 marked blocked: [reason]"

### `unblock [change-id]`

Clear the blocked flag on a change.

**Steps:**
1. Read `progress.md`, verify `blocked: true`
2. Set `blocked: false`, `blocked_reason: ""`, `updated_at: today`
3. Update current state table: 是否阻塞 → `否`
4. Append row to blocked history table: `操作=解除阻塞`
5. Report: "FEAT-0021 unblocked, phase remains: [current_phase]"

### `sync-plan [plan-id]`

Refresh the "关联 Changes 与进度汇总" table in an exec-plan document.

**Steps:**
1. Locate exec-plan file in `docs/exec-plans/active/` or `docs/exec-plans/completed/`
2. Scan all `openspec/changes/*/progress.md`, filter by `exec_plan` matching `plan-id`
3. For each matched change, read: change_id, title, phase, blocked, assignee, updated_at
4. Regenerate the "关联 Changes 与进度汇总" section with an updated table and summary line
5. Write back to the exec-plan file
6. Report: "[plan-id] synced: N changes updated"

## Artifact-to-Phase Inference (for auto-creating progress.md)

When `show` is called for a change that has no progress.md, infer the phase from existing files:

```
qa-audit.md exists AND no FAIL/PENDING lines  → done
qa-test-cases.md exists                        → qa-testing
test-cases.md exists                           → dev-testing
spec.md AND tasks.md both exist                → coding
design.md exists                               → design
(change dir exists, none of the above)         → requirements
```

## YAML Frontmatter Parsing (Shell-safe)

All shell scripts can parse `progress.md` without a YAML library:

```bash
PHASE=$(grep '^phase:' progress.md | awk '{print $2}')
BLOCKED=$(grep '^blocked:' progress.md | awk '{print $2}')
ASSIGNEE=$(grep '^assignee:' progress.md | sed 's/^assignee: //')
TITLE=$(grep '^title:' progress.md | sed 's/^title: //')
```

## Reference Files

Read `references/progress-schema.md` for the canonical progress.md template.
Read `references/board-template.md` for board rendering layout details.
