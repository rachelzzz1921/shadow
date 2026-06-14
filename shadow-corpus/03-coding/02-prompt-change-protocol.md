# Prompt 变更协议

改 `example/shadow-demo/lib/prompts.js` 或切换模型时，按此流程保证可追溯。

## 步骤

1. **先读** [`01-narrative-prompt-protocol.md`](./01-narrative-prompt-protocol.md) — 确认口径是否要变
2. **若口径变** — 先更新协议文档，再改代码
3. **改代码** — `lib/prompts.js`（必要时 `lib/agents.js`）
4. **记录实验** — 追加 [`06-task-progress/02-prompt-experiments-log.md`](../06-task-progress/02-prompt-experiments-log.md)
5. **跑测试**
   ```bash
   npm test
   ```
6. **Golden eval**
   ```bash
   cd example/shadow-demo && node -e "
   const s = require('../../04-dev-testing/golden-stories/复读线.json');
   const e = require('./lib/evaluator').evaluateStory(s);
   console.log(e.ok, e.score, e.errors, e.warnings);
   "
   ```
7. **Review** — 用 [`skills/story-review/SKILL.md`](../skills/story-review/SKILL.md) 抽检

## 实验日志格式

```markdown
## YYYY-MM-DD — [简述]

- **改动**：prompt / model / session
- **Hypothesis**：预期改善什么
- **Result**：Keep / Revert / Iterate
- **Eval**：test + golden score
```

## 禁止

- 只改代码不记实验日志
- eval error 仍标记为 Keep
- 跳过 story-review 直接上线 live mode
