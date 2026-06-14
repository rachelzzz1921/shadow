# Shadow — AI Coding Context

平行人生叙事 Harness。**主内容在 shadow-corpus/ 本目录。**

## 定位

- **主**：阶段文档（01–07）、Skill 池、Golden fixtures、治理与路由
- **辅**：[`archive/demo-v0.2/`](archive/demo-v0.2/) 归档 demo（契约 / evaluator 参考）

## Stack（归档 demo）

- **Runtime**: Node 20+, `archive/demo-v0.2/server.js`
- **LLM**: AI SDK + Anthropic / OpenAI（`lib/llm-runtime.js`）
- **Schema**: Zod（`lib/schemas.js`）
- **Eval**: 规则型 `lib/evaluator.js` + [`fixtures/golden-stories/复读线.json`](fixtures/golden-stories/复读线.json)

## Commands（归档 demo）

```bash
npm install --prefix archive/demo-v0.2
npm run dev --prefix archive/demo-v0.2
npm test --prefix archive/demo-v0.2
```

## Architecture

5-agent 管线：Persona → Beats → Year×7 → Final → Dialogue（随时）

Harness 闭环：[`02-technical-design/01-shadow-harness-loop.md`](02-technical-design/01-shadow-harness-loop.md)

**持续迭代（Wave 4）**：[`docs/plans/2026-06-14-harness-wave4-iteration.md`](docs/plans/2026-06-14-harness-wave4-iteration.md) · 日志 [`06-task-progress/harness-iteration-log.md`](06-task-progress/harness-iteration-log.md)

```bash
npm test                    # 归档 demo 16 tests
npm run test:golden
npm run harness:smoke       # mock live 一条龙
npm run demo:preview        # 静态复读线 demo
npm run board:publish
```

## Do Not

- 不要在 pivotal 年之外写 `intervention_prompt`
- 不要改 prompt 而不更新 `03-coding/01-narrative-prompt-protocol.md` 和 `06-task-progress/02-prompt-experiments-log.md`
- 不要让 final 变成强行和解的鸡汤
- 不要跳过 golden story eval（归档 demo 的 `npm test`）
- 不要在 eval **error** 或敏感内容 flag 时自动上线（见 `07-debug-and-correction/`）
- 不要破坏 `memory_stream` 与 intervention 的上下文传递
- 不要把 demo 代码当作项目主结构 — 新工作以文档 + Skill 为先

## Key Paths

| 用途 | 路径 |
|------|------|
| 总索引 | [`MANIFEST.md`](MANIFEST.md) |
| 契约（归档） | `archive/demo-v0.2/lib/schemas.js` |
| Prompt（归档） | `archive/demo-v0.2/lib/prompts.js` |
| Golden | `fixtures/golden-stories/复读线.json` |
| Eval 规则 | `04-dev-testing/01-narrative-eval-rubric.md` |
| Trace（归档） | `archive/demo-v0.2/runs/*.json` |
| Skill 治理 | `skills/_governance/SKILLS-GOVERNANCE.md` |
| Skill 路由 | `skills/shadow-router/SKILL.md` |
| Shadow skill 源码 | `skills/shadow/`, `skills/harness/` |

## Skill 快速路由

不确定用哪个 skill → invoke **`shadow-router`**。

| 任务 | Skill |
|------|-------|
| 写故事 / golden | `story-authoring` |
| 命运 agent / world 语料 | `fate-agent` |
| 审叙事 / trace | `story-review` |
| 改 lib / prompt | `tdd` |
| 架构改进 | `improve-codebase-architecture` |
| 初始化文档 | `harness-init` |

## Reading Order

见 [`AGENTS.md`](AGENTS.md)。
