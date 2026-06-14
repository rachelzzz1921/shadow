# Trace 复盘工作流

Live session 结束后，用 trace 做调试与质量复盘。

## Trace 位置

`example/shadow-demo/runs/{run_id}.json`

## 复盘步骤

1. 打开 trace，看 `stages[]` 顺序与 `stop_reason`
2. 对照 `eval_summary` — errors / warnings
3. 若有 intervention，检查是否传入下一年 context
4. 用 [`skills/story-review/SKILL.md`](../skills/story-review/SKILL.md) 清单逐项勾
5. 结论写入 prompt-experiments 或 debug-report

## debug-report 模板

```markdown
# Debug Report — {run_id}

## 现象
（用户可见问题）

## Trace 摘要
- stop_reason:
- eval errors:
- last stage:

## 根因假设
1. ...

## 建议修复范围
- [ ] 仅 prompt
- [ ] schema / contract
- [ ] session 逻辑

## 需人工确认
（AI 不可自行修复的部分）
```

## 相关

- Run trace 规范：[`06-task-progress/01-run-trace-spec.md`](../06-task-progress/01-run-trace-spec.md)
- Stop 策略：[`01-stop-and-escalation.md`](./01-stop-and-escalation.md)
