---
name: rag-kit
description: >-
  Operates Shadow's hybrid RAG engineering package — local JSON index, DashScope
  embedding, Supabase pgvector schema, harness/world/trace retrieval CLI, and M0
  verify. Use when building or extending RAG indexes, npm run rag:* scripts,
  eval-embedding-cn, verify-rag-m0, chunk-repo/world, or planning demo integration
  via rag-service.js. Pause demo backend wiring unless INTEGRATION.md checklist passes.
---

# RAG Kit — 混合检索工程

Shadow **检索工程包**，与叙事写作、Fate 语料扩库分工明确。

| 本 skill | 不用本 skill |
|----------|----------------|
| `packages/rag-kit`、embed、eval、本地索引 | 写七年正文 → `story-authoring` |
| `npm run rag:*`、`verify-rag-m0` | 扩 world 六域子池 → `fate-agent` |
| 恢复 demo 接线规划 | 审 golden 叙事 → `story-review` |

## 何时 invoke（触发词）

- RAG、rag-kit、向量检索、embedding、pgvector、`rag_chunks`
- `npm run rag:embed`、`rag:query`、`rag:eval:embedding`、`rag:verify:m0`
- 全 repo `.md` 索引、harness 语料检索、时代语料语义检索
- M0 验收、DashScope、Recall@5、本地 fallback、`RAG_ENABLED=false`

**暂停期（默认）**：demo 已自动接线；向量层待 `service_role` + DashScope 恢复后跑 `rag:verify:m0 -- --full`。

## 第一步：选任务类型

```
用户要什么？
├─ 建/刷新本地索引（无 API）────→ npm run rag:embed:local
├─ 向量索引 world / repo ────────→ npm run rag:embed:world | embed:repo
├─ 评测 embedding 模型 ──────────→ npm run rag:eval:embedding [-- --provider zhipu]
├─ CLI 检索 / 调试命中 ──────────→ npm run rag:query -- --json "…" [--world]
├─ M0 一键验收 ──────────────────→ npm run rag:verify:m0 [-- --full]
├─ 改 chunk / retrieve 逻辑 ─────→ packages/rag-kit/lib/ + test
├─ 恢复 demo 后端接线 ───────────→ 读 INTEGRATION.md（先 verify:m0 --full）
└─ 方案 / 分期 / 暂停决策 ───────→ docs/plans/2026-06-14-rag-engineering-plan.md
```

## 第二步：必读（按顺序）

| 顺序 | 文件 | 何时 |
|------|------|------|
| 1 | [`docs/rag-agent-architecture.md`](../../../docs/rag-agent-architecture.md) | 逻辑架构 · 向量库 · Skill 设计（handoff 总览） |
| 2 | [`docs/plans/2026-06-14-rag-engineering-plan.md`](../../../docs/plans/2026-06-14-rag-engineering-plan.md) | 分期、暂停/恢复决策 |
| 3 | [`02-technical-design/05-rag-system.md`](../../../02-technical-design/05-rag-system.md) | 全链路方案 |
| 4 | [`packages/rag-kit/README.md`](../../../packages/rag-kit/README.md) | 命令与三模式 |
| 5 | [`packages/rag-kit/INTEGRATION.md`](../../../packages/rag-kit/INTEGRATION.md) | demo 接入缝 |
| 6 | [`reference.md`](reference.md) | 文件地图、env、验收 |
| 7 | [`examples.md`](examples.md) | 常见命令 |

## 第三步：硬约束

- **不破坏** `RAG_ENABLED=false`：demo `npm test` + golden 0 error
- **不删除** rules fallback；无 Supabase / 无 key 时自动降级
- **不打印** `.env` 密钥；**不提交** `world/.env`、`data/local-index/*.json`
- **不编造** Supabase 已成功 — 用 `rag:verify:m0` 或 schema 探针
- demo 检索逻辑**只**经 `archive/demo-v0.2/lib/rag-service.js` 接入

## 第四步：验收

```bash
npm run rag:install
npm run rag:embed:local              # 无 API 基线
npm run rag:query -- --json "Final 规则是什么？"
npm run rag:verify:m0                # 环境 + schema + smoke（可无 --full）
npm test && npm run test:golden      # demo 不回退
```

向量层（需密钥 + 账户正常）：

```bash
npm run rag:embed:world
npm run rag:embed:repo
npm run rag:eval:embedding           # Recall@5 ≥ 80%
npm run rag:verify:m0 -- --full
```

## 与 fate-agent 协作

- **fate-agent**：`world/data/years/*.json`、seed、`sampleFateContext` 业务表
- **rag-kit**：从 JSON / repo `.md` 生成 `rag_chunks` 检索层；`refineWorldPoolForFate` 在恢复 demo 后用向量缩池

语义检索入口统一：`retrieve({ namespace: 'world' | 'harness' | 'session' | 'trace', ... })`。
