# Shadow Harness Loop

更新时间：2026-06-14

Shadow 是一个 **平行人生叙事 harness**：输入一个人生岔路口，由 5 个 agent 协同生成可回放、可介入、可对话的七年影子人生。

核心转变：

```text
Prompt 集合 → Context + Harness + Skill 驱动的 closed loop
```

## 1. Goal

**目标**：基于用户 profile，生成一条七年平行人生叙事，并在 pivotal 年允许用户介入，影响后续年份。

**验收标准**：

- 输出符合 `example/shadow-demo/lib/schemas.js` 与 `example/shadow-demo/lib/contract.example.json` 契约。
- 七年包含 2-3 个 pivotal 年与足够 quiet 留白。
- Live mode 下用户 intervention 能进入下一年 agent 上下文。
- `memory_stream` 可支撑跨时空 dialogue 引用。
- `final` 有重量、有 regret，不强行鸡汤。
- 规则型 eval（`lib/evaluator.js`）无 error；warn 需人工判断是否可接受。

## 2. Actor

| Actor | 职责 | 触发时机 |
| --- | --- | --- |
| Persona agent | 写人格卡 | session 开始 |
| Beats agent | 排七年节奏 | persona 完成后 |
| Year agent | 生成单年叙事 | 每年一次；可带 user_intervention |
| Final agent | 收束七年 | 7 年完成后 |
| Dialogue agent | 跨时空对话 | 用户随时提问 |
| User | pivotal 介入选择 | pivotal 年弹窗 |
| Story session Module | 状态、暂停/继续、trace | 贯穿 live 流程 |
| Evaluator | 规则型 feedback | beats / year / story 完成后 |
| Human reviewer | 叙事质量、敏感内容 | eval warn、上线前 |

## 3. Environment

- **Runtime**：Node 20+，`example/shadow-demo/server.js` + `lib/*`
- **Frontend**：`example/shadow-demo/public/index.html`（本地预生成 / live session 双模式）
- **LLM**：Anthropic 或 OpenAI（`example/shadow-demo/lib/llm-runtime.js`）
- **Fixtures**：`LOCAL_STORIES`、`example/shadow-demo/lib/contract.example.json`
- **Traces**：`example/shadow-demo/runs/*.json`（live session 自动写入）

## 4. Feedback

### Mechanical

- Zod schema（`lib/schemas.js`）
- Contract normalize（`lib/story-contract.js`）
- 规则 eval（`lib/evaluator.js`）
- `npm test`

### Narrative（人工 + 文档）

- `04-dev-testing/golden-stories/` 对照
- `04-dev-testing/01-narrative-eval-rubric.md` 反例
- `skills/story-review/SKILL.md` 审阅清单

### Runtime

- `runs/` trace：stage、intervention、error、stop_reason、eval 摘要

## 5. Memory

| 类型 | 位置 | 用途 |
| --- | --- | --- |
| 故事 memory | `memory_stream[]` | Year / Dialogue agent 上下文 |
| Session state | `_liveSession` / server session | 逐年生成、mood/esteem |
| Harness 文档 | `01-requirements/` … `07-debug-and-correction/` | 叙事协议、介入规则、golden story |
| Skills | `skills/story-authoring/`、`skills/story-review/` | 可复用流程 |
| Prompt 实验 | `06-task-progress/02-prompt-experiments-log.md` | 改 prompt 的可追溯记录 |
| Run trace | `example/shadow-demo/runs/*.json` | 调试、审计、eval 复盘 |

## 6. Stop Condition

| 条件 | 行为 |
| --- | --- |
| 7 年 + final 完成 | 正常停止，`stop_reason: completed` |
| Schema 校验失败（重试后仍失败） | 停止当前 stage，trace 记 error |
| 无 API key | 前端 fallback 本地预生成 |
| Eval error | 仍返回结果，但 trace 标记需人工 review |
| 敏感/自伤输入 | 见 `07-debug-and-correction/01-stop-and-escalation.md` |
| 用户放弃 | 关闭页面；trace 可能不完整 |

## 7. Loop 流程（Live Mode）

```text
POST /api/story/start
  → persona → beats → eval beats
POST /api/story/year (×7, pivotal 后带 user_intervention)
  → year → memory → eval year
POST /api/story/final
  → final → eval story → write runs/{run_id}.json
```

## 8. 相关文件

- 契约：`lib/schemas.js`、`lib/contract.example.json`
- Session：`lib/story-session.js`
- Eval：`lib/evaluator.js`
- Trace：`lib/run-trace.js`
- Prompt：`lib/prompts.js`
- 叙事协议：`03-coding/01-narrative-prompt-protocol.md`
- 介入设计：`01-requirements/02-intervention-requirements.md`
