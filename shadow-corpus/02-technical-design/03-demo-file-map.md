# Demo 文件地图

可运行实现在 `example/shadow-demo/`。

## 目录

```
example/shadow-demo/
├── package.json
├── server.js           # HTTP + API 路由
├── lib/
│   ├── schemas.js      # Zod 契约
│   ├── prompts.js      # 5 agent prompt
│   ├── agents.js       # AI SDK 调用
│   ├── llm-runtime.js  # Provider 选择
│   ├── story-session.js# Live session 编排
│   ├── story-contract.js
│   ├── evaluator.js    # 规则 eval
│   ├── run-trace.js    # Trace 持久化
│   └── contract.example.json
├── public/
│   ├── index.html      # UI + LOCAL_STORIES
│   └── assets/         # Sprite、tileset
├── test/               # Node test runner
└── runs/               # Live trace 输出（gitignore）
```

## 启动

```bash
cd example/shadow-demo && npm install && npm run dev
# 或从仓库根：npm install:demo && npm run dev
```

## 与 Harness 文档的关系

| 代码 | 文档 |
|------|------|
| `lib/prompts.js` | `03-coding/01-narrative-prompt-protocol.md` |
| `lib/evaluator.js` | `04-dev-testing/01-narrative-eval-rubric.md` |
| `lib/run-trace.js` | `06-task-progress/01-run-trace-spec.md` |
| `lib/story-session.js` | `07-debug-and-correction/01-stop-and-escalation.md` |
