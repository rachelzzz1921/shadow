# Live session traces

每次 live session 结束后写入 `runs/{run_id}.json`。

## 字段

- `run_id`, `profile`, `stages[]`, `interventions[]`
- `eval` — story 级 evaluateStory 摘要
- `stop_reason` — completed / error / user_abort / provider_fail
- `events[]` — 时间线调试事件

## 复盘

- 规范：[`06-task-progress/01-run-trace-spec.md`](../../06-task-progress/01-run-trace-spec.md)
- Skill：[`skills/story-review/SKILL.md`](../../skills/story-review/SKILL.md)

## Git

`runs/*.json` 已 gitignore，仅保留本 README。
