# 单元测试与 Golden Story

## 测试套件

| 文件 | 覆盖 |
|------|------|
| `test/evaluator.test.js` | evaluateStory / evaluateYear / evaluateBeats |
| `test/story-session.test.js` | Live session 编排、intervention 传递 |
| `test/run-trace.test.js` | Trace 读写与 finish |

## 运行

```bash
npm test
# 从仓库根目录等效：npm test
```

## Golden Story Eval

基准 fixture：[`golden-stories/复读线.json`](./golden-stories/复读线.json)

```bash
cd example/shadow-demo
node -e "
const s = require('../../04-dev-testing/golden-stories/复读线.json');
const e = require('./lib/evaluator').evaluateStory(s);
console.log(JSON.stringify({ ok: e.ok, score: e.score, errors: e.errors, warnings: e.warnings }, null, 2));
"
```

**门禁**：`errors.length === 0`。warnings 需人工判断是否可接受。

## 改 evaluator 时

1. 更新 [`01-narrative-eval-rubric.md`](./01-narrative-eval-rubric.md)
2. 跑 `npm test` — 确保 golden 仍 pass 或 intentional break 有文档
3. 追加 prompt-experiments 日志若与 prompt 联动

## Hook

`post-edit-test.sh` — 编辑 `lib/` 或 `test/` 后自动 `npm test`。
