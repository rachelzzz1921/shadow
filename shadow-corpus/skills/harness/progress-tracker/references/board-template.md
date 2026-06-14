# Board Template Reference

Defines the rendering layout for the `board` command output.

## Wide Format (default, ≤ 6 changes per column)

Use this layout when no column has more than 6 changes.

```
## Progress Board  [{date}]

| requirements | design | coding | dev-testing | qa-testing |
|---|---|---|---|---|
| {id}         | {id}   | {id}   | {id}        | {id}       |
| ({assignee}) | (...)  | (...)  | (...)       | (...)      |
| ...          | ...    | ...    | ...         | ...        |

Totals: requirements=N  design=N  coding=N  dev-testing=N  qa-testing=N
Blocked: N — {change_id}: {reason}, ...
```

Rules:
- Each column shows change_id on odd rows, (assignee) on even rows
- If assignee is empty, show `(—)`
- Prefix blocked change_id with `🔴`
- `done` changes are excluded by default; include with `--all`
- Date header shows today's date in `YYYY-MM-DD` format

## Narrow Format (when any column has > 6 changes)

Switch to a list-per-phase layout automatically:

```
## Progress Board  [{date}]

### requirements ({N})
- FEAT-0031  用户分层推送  @li-ming
- FEAT-0032  支付重构      (unassigned)

### design ({N})
- FEAT-0028  消息推送渠道  @chen-fang

### coding ({N})
- 🔴 FEAT-0021  消息队列重构  @li-fang  [BLOCKED: 依赖服务未就绪]
- FEAT-0023  用户分层推送功能  @zhang-wei  (6 days)

### dev-testing ({N})
- FEAT-0025  推送统计 API  @wang-jun

### qa-testing ({N})
- FEAT-0019  导出功能  @qa-team

---
Totals: requirements=2  design=1  coding=2  dev-testing=1  qa-testing=1
Blocked: 1 — FEAT-0021: 依赖服务未就绪
```

## Blocked Summary Section

Always append a blocked summary if any changes are blocked:

```
Blocked: {N} — {change_id}: {blocked_reason}[, {change_id}: {blocked_reason}...]
```

If no changes are blocked, show: `Blocked: 0`

## Plan-Filtered Board Header

When `--plan [plan-id]` is used, prefix the board header:

```
## Progress Board  [{date}]  (plan: {plan-id})
```

Only changes with `exec_plan` matching `plan-id` are included.

## Days-in-Phase Calculation

Compute "days in phase" from the most recent history entry where `阶段 == current_phase`.
Show in narrow format next to assignee: `(N days)`.
In wide format, omit to keep the board compact.
