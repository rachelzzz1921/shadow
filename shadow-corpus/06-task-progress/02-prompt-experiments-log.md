# Shadow Prompt 实验记录

Harness Memory：每次改 prompt、模型或 narrative 规则，在此记录，避免「越改越玄学」。

---

## 2026-06-14 — 六场景 Agent 人工提示词入库

**Change**

- 微信终稿入库 → `03-coding/prompts/scene-agents/scene-agents-prompts.md`
- 拆分为 `base-prompt` / `scene-router` / 六域 lens / `output-schema`
- 新增 `index.mjs`、`archive/demo-v0.2/lib/scene-agents-bridge.js`、`skills/shadow/scene-agents/`
- 叙事协议追加 Scene Agents 节

**Expected**

- 六域 prompt 可被代码加载；复读 profile 路由到 `academic`
- Year agent 尚未强制叠加 scene lens（P2 接线）

**Result**

- `test/scene-agents-bridge.test.js` 通过
- 待 P2：Scene Router LLM + Year system 注入 + golden 回归

**Keep / Revert**

- Keep

**Notes**

- canonical 与分文件需同步维护
- P2 目标 schema 见 `output-schema.md`（含 `agentTrace`）

---

## 2026-06-14 — Live session 逐步生成 + intervention threading

**Change**

- 新增 `lib/story-session.js`：live mode 从一次性 `/api/story` 改为 `/api/story/start` → `/api/story/year` ×7 → `/api/story/final`。
- Year agent 接收 `user_intervention`，prompt 注入用户选择。
- 前端 `pendingIntervention` 在 pivotal 选择后传给下一年 API。

**Expected**

- 用户在 pivotal 年的选择会出现在下一年 Year agent 的 prompt 中。
- 下一年 narrative 从选择后果展开。

**Result**

- `test/story-session.test.js` 通过：prompt 含 `用户选择了：「告诉」`。
- 待 live 人工抽检：复读 profile 下年 2 是否承接年 1 选择。

**Keep / Revert**

- Keep

**Notes**

- 本地预生成故事仍不重新生成，仅 live session 真正 threading。
- 见 `01-requirements/02-intervention-requirements.md`。

---

## 2026-06-14 — P0 占位接线（memory / fate / replan）

**Change**

- `memory-retrieval.js` + `memoryFromYear` 类型对齐 golden
- `fate-bridge.js` 读 world corpus；`beats-replan.js` 规则占位
- `docs/demo*`：`ShadowAgents.dialogue` / `fate` 占位启用
- `buildInterventionReplanPrompt` 骨架（**待人写终稿**）

**Expected**

- npm test 全绿；golden eval ≥90
- Live 干预后 trace 含 `fate:sampled`、replan 字段

**Result**

- test 14/14；`test:golden` ok= true, score=95
- LLM re-plan / Dialogue / Fate 仍为 placeholder

**Keep / Revert**

- Keep 占位；P2 替换 prompt 后再记一条

**Notes**

- 有效变体合并 → 本文件顶部追加，不删历史
- 队友：T-016 prompt 终稿、T-021 人审后改 `Keep`

---

## 2026-06-14 — Harness 文档 + evaluator + run trace

**Change**

- 新增 `01-requirements/` … `07-debug-and-correction/`、`skills/story-*`、`example/shadow-demo/lib/evaluator.js`、`lib/run-trace.js`。
- Live session 写入 `runs/{run_id}.json`。

**Expected**

- 每次 live 生成有可追溯 trace 与规则 eval。

**Result**

- 单元测试覆盖 evaluator 与 session；live eval 待积累样本。

**Keep / Revert**

- Keep

**Notes**

- 后续改 prompt 必须追加本文件条目。

---

## 2026-06-15 — Intake → Agent 全链路映射

**Change**

- `intake-kit` 统一 `buildFullProfile`（`schema_version: 1`、结构化 `selected_tags`）。
- `formatPersonaCard` / `formatIntakeContext` 注入 Beats/Year/Final/Dialogue prompt。
- Session baseline 来自 intake；Fate 权重 intake 先验；Year system 拼接 Scene Agents lens。
- `evaluateIntakeConsistency` 接入 `evaluateStory`（有 `full_profile` 时）。

**Expected**

- Intake 张力/域权重/基线 mood 在叙事管线中可追踪，不再仅 Persona 可见。

**Result**

- 单元测试：`prompts-intake-context`、`fate-weights-intake`、`scene-agents-bridge`、`intake-kit-parity`、`evaluator-intake`。

**Keep / Revert**

- Keep

**Notes**

- 浏览器端 `docs/demo-intake-profile.js` 由 `npm run build:intake-browser` 生成，勿手改。

