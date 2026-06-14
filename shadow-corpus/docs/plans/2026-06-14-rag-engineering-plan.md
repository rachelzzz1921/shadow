# RAG 工程计划 — 本地优先 · 后端接线暂停

> **Skill 链**：`shadow-router` → **`rag-kit`**（本工程）→ `fate-agent`（world 语料）  
> **Change**：CHG-RAG001 · **方案**：[`02-technical-design/05-rag-system.md`](../../02-technical-design/05-rag-system.md)  
> **更新**：2026-06-14

## 决策（2026-06-14 更新）

**demo 已自动接入** `rag-service.js`：启动时合并 env、探测本地索引、缺失时后台 `rag:embed:local`。

| 项 | 结论 |
|----|------|
| 工程范围 | **`packages/rag-kit`** + CLI + 本地索引 |
| demo 接线 | **已启用** — Fate / Dialogue / session / trace / `/api/rag/*` |
| 云端向量 | ⏸ 待 `service_role` key + DashScope 账户正常 |
| 硬约束 | `RAG_ENABLED=false` 仍全规则 fallback |

恢复后端时只读 [`packages/rag-kit/INTEGRATION.md`](../../packages/rag-kit/INTEGRATION.md)，**不要**在 demo 里重写检索逻辑。

---

## 工程已完成（本地层）

```text
shadow-corpus/packages/rag-kit/     # 共享检索包（与 demo 解耦）
├── lib/                            # embed · retrieve · chunk · local-index · supabase-client
├── scripts/                        # embed-world/repo · eval · query · index-runs · verify 入口在根 scripts/
└── data/local-index/               # 本地 JSON 镜像（gitignore，本机生成）

根 package.json                     # rag:install · embed:* · eval · query · verify:m0
world/schema/002_rag_embeddings.sql # Supabase DDL（人工 SQL Editor 执行）
scripts/verify-rag-m0.mjs           # 一键验收（不打印密钥）
```

### 三种运行模式（无需后端）

| 模式 | 命令 | 用途 |
|------|------|------|
| 规则索引 | `npm run rag:embed:local` | 无 API；world + repo `.md` 入本地 JSON |
| 向量索引 | `npm run rag:embed:world` / `rag:embed:repo` | 需 DashScope；支持 `--resume` 断点 |
| 检索 CLI | `npm run rag:query -- --json "..."` | harness / `--world` 命名空间 |

### 本机索引基线（2026-06-14）

| namespace | chunks | 向量 |
|-----------|--------|------|
| world | ~7405 | 880（欠费中断，可 resume） |
| harness | ~6396 | 规则索引已完成 |
| session / trace | 逐年增长 | 规则 |

---

## 分阶段交付（修订）

| 阶段 | 范围 | 状态 |
|------|------|------|
| **E0 工程包** | rag-kit + 文档 + skill + verify 脚本 | ✅ **当前重点** |
| **E1 向量层** | DashScope embed 全量 + Recall@5≥80% | ⏸ 待账户/密钥 |
| **E2 云端层** | Supabase `service_role` 写入 + `rag_match` | ⏸ 待 service_role |
| **M1–M4 demo** | `rag-service.js` 五条链路 | 🔒 **已写、冻结**；恢复时按 INTEGRATION 验收 |

---

## Agent 工作流（不接后端时）

```text
1. invoke skill: rag-kit
2. npm run rag:embed:local          # 或已有索引则跳过
3. npm run rag:query -- --json "…"  # 开发检索
4. 改 chunk/retrieve/eval → npm test + rag:verify:m0
5. 需要向量时：修密钥 → rag:embed:world → rag:eval:embedding
```

**不要**在暂停期间：改 `prompts.js` 的 RAG 注入、扩 `server.js` RAG API、或假设 Supabase 已有向量。

---

## 恢复后端接线（将来一次做完）

1. [`world/.env`](../../world/.env.example)：`SUPABASE_SERVICE_ROLE_KEY` = **service_role** JWT（非 anon）  
   → [Supabase API 设置](https://supabase.com/dashboard/project/dkskgnlrlcyvfxhngxib/settings/api)
2. DashScope 结清欠费 → [百炼控制台](https://dashscope.console.aliyun.com/)
3. `npm run rag:embed:world && npm run rag:embed:repo`
4. `npm run rag:verify:m0 -- --full`
5. 按 [`INTEGRATION.md`](../../packages/rag-kit/INTEGRATION.md) 跑 demo 冒烟：`npm test` + `harness:smoke`

接入点唯一适配层：**`archive/demo-v0.2/lib/rag-service.js`**（不要新建 rag-bridge）。

---

## 相关文件

| 文件 | 作用 |
|------|------|
| [`05-rag-system.md`](../../02-technical-design/05-rag-system.md) | 全链路技术方案 |
| [`packages/rag-kit/README.md`](../../packages/rag-kit/README.md) | 包内快速开始 |
| [`packages/rag-kit/INTEGRATION.md`](../../packages/rag-kit/INTEGRATION.md) | demo 接入缝 |
| [`skills/shadow/rag-kit/SKILL.md`](../../skills/shadow/rag-kit/SKILL.md) | Agent 操作 skill |
| [`scripts/verify-rag-m0.mjs`](../../../scripts/verify-rag-m0.mjs) | M0 验收 |
