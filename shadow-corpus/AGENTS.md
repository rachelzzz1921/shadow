# Shadow — Agent 入口

平行人生叙事 Harness。**从本目录（shadow-corpus/）开始。**

> **Skill 路由**：不确定用哪个 skill 时，先读 [`skills/shadow-router/SKILL.md`](skills/shadow-router/SKILL.md) 或 [`skills/_governance/SKILLS-GOVERNANCE.md`](skills/_governance/SKILLS-GOVERNANCE.md)。

## 阅读顺序

1. [`CLAUDE.md`](CLAUDE.md) — 项目约束
2. [`02-technical-design/01-shadow-harness-loop.md`](02-technical-design/01-shadow-harness-loop.md) — Goal / Actor / Feedback / Memory / Stop
3. [`03-coding/01-narrative-prompt-protocol.md`](03-coding/01-narrative-prompt-protocol.md) — 叙事协议
4. [`archive/demo-v0.2/lib/schemas.js`](archive/demo-v0.2/lib/schemas.js) + [`archive/demo-v0.2/lib/contract.example.json`](archive/demo-v0.2/lib/contract.example.json) — JSON 契约（归档参考）
5. [`fixtures/golden-stories/复读线.md`](fixtures/golden-stories/复读线.md) — 质量参照

## 阶段导航

| 阶段 | 目录 | 首选 Skill |
|------|------|-----------|
| 需求 | [`01-requirements/`](01-requirements/) | `brainstorming` |
| 方案 | [`02-technical-design/`](02-technical-design/) | `design-generator` · RAG → `rag-kit` |
| 编码 | [`03-coding/`](03-coding/) | `tdd` |
| 自测 | [`04-dev-testing/`](04-dev-testing/) | `tdd`, `story-authoring` |
| QA | [`05-qa-testing/`](05-qa-testing/) | `story-review` |
| 进度 | [`06-task-progress/`](06-task-progress/) | `progress-tracker` |
| 纠错 | [`07-debug-and-correction/`](07-debug-and-correction/) | `systematic-debugging` |

## Skills 管理

| 路径 | 作用 |
|------|------|
| [`skills/_governance/SKILLS-GOVERNANCE.md`](skills/_governance/SKILLS-GOVERNANCE.md) | 融合治理总览 |
| [`skills/_governance/skills-manifest.json`](skills/_governance/skills-manifest.json) | 路由表 JSON |
| [`skills/shadow/`](skills/shadow/) | Shadow 领域 skill **源码** |
| [`skills/harness/`](skills/harness/) | Harness 框架 skill **源码** |
| [`skills/pool/`](skills/pool/) | 第三方 skill 完整副本（75 个） |
| [`skills/sync-cursor-links.sh`](skills/sync-cursor-links.sh) | 同步到 `.cursor/skills` |

```bash
./skills/sync-cursor-links.sh   # 同步 Cursor 发现路径
npx skills update               # 更新第三方（需重新复制到 pool/）
```

## 归档 Demo（可选）

Demo 已归档，非主入口。需要对照契约或跑 evaluator 时：

```bash
npm install --prefix archive/demo-v0.2
npm run dev --prefix archive/demo-v0.2
npm test --prefix archive/demo-v0.2
```

## Live API（归档 demo）

- `POST /api/story/start` → session + `run_id`
- `POST /api/story/year` → 逐年生成（带 `user_intervention`）
- `POST /api/story/final` → 收尾 + eval + trace 落盘

Trace：`archive/demo-v0.2/runs/{run_id}.json`

## 改 prompt 时

1. 更新 [`03-coding/01-narrative-prompt-protocol.md`](03-coding/01-narrative-prompt-protocol.md) 若口径变
2. 六场景 Agent 改 [`03-coding/prompts/scene-agents/`](03-coding/prompts/scene-agents/)（skill **`scene-agents`**）
3. 追加 [`06-task-progress/02-prompt-experiments-log.md`](06-task-progress/02-prompt-experiments-log.md)
3. 用 skill **`tdd`** 跑归档 demo 的 `npm test` + golden eval
4. 用 skill **`story-review`** 抽检

## Hook

见 [`tooling/hooks/README.md`](tooling/hooks/README.md)。编辑归档 demo 的 `lib/` 或 `test/` 后自动跑测试。

## 研究迁移

见 [`knowledge/research/migration-roadmap-p0-p3.md`](knowledge/research/migration-roadmap-p0-p3.md)。
