# Run Traces

Live story session 自动写入的 harness trace。

## 位置

`runs/{run_id}.json`

## 内容

- `profile` 摘要
- `events[]`：persona / beats / year / final 各 stage
- `interventions[]`：用户 pivotal 选择
- `errors[]`：失败 stage
- `eval`：规则型 narrative feedback
- `stop_reason`：`completed` | `start_failed` | `final_failed` 等

## 注意

- 单次 live 生成的 trace 文件默认不提交 git（见根目录 `.gitignore`）。
- 复盘时用 `skills/story-review/SKILL.md`。
