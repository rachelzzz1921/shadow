# 测试失败工作流

`npm test` 或 golden eval 失败时的纠错循环。

## 流程

```
npm test FAIL / eval error
  ↓
debug-analyst subagent
  → 读失败断言 + 相关 lib/ 源码
  → 读 04-dev-testing/01-narrative-eval-rubric.md
  → 输出 debug-report.md
  ↓
Human Review Gate（停止，等待指令）
  ↓
按指令修复（prompt / evaluator / contract）
  ↓
npm test + golden eval
```

## 常见失败类型

| 类型 | 先看 |
|------|------|
| schema 不匹配 | `lib/schemas.js` + contract.example.json |
| eval 新 rule 误伤 golden | `01-narrative-eval-rubric.md` + 复读线.md |
| session intervention 未传递 | `story-session.test.js` + trace |
| provider 错误 | `01-stop-and-escalation.md` |

## 禁止

- eval fail 时直接改 golden 而不记录原因
- 不跑 test 就改 prompts.js
