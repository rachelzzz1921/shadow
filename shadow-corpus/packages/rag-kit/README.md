# @shadow/rag-kit

Shadow 混合 RAG 工程包：**本地 JSON 索引优先**，可选 DashScope + Supabase pgvector。

> **工程计划**：[`docs/plans/2026-06-14-rag-engineering-plan.md`](../../docs/plans/2026-06-14-rag-engineering-plan.md)  
> **demo 接入**（恢复后端时）：[`INTEGRATION.md`](./INTEGRATION.md)  
> **Agent skill**：[`skills/shadow/rag-kit/SKILL.md`](../../skills/shadow/rag-kit/SKILL.md)

## 三种运行模式

| 模式 | 条件 | 检索 |
|------|------|------|
| **hybrid** | DashScope +（Supabase 或本地索引含 embedding） | 规则 + 向量 |
| **rules-index** | 本地/Supabase 索引，无 embedding key | 规则，走缓存索引（快） |
| **rules-local** | 无索引 | 每次扫 repo（慢） |

## 快速开始（不接后端）

```bash
# 仓库根
npm run rag:install
npm run rag:embed:local          # world + repo .md → data/local-index/

npm run rag:query -- --json "intervention re-plan 规则"
npm run rag:query -- --world --json "高考改革"

npm run rag:verify:m0            # 环境 · schema · smoke · demo test
```

## 向量层（密钥就绪后）

```bash
npm run rag:embed:world          # 支持断点 resume
npm run rag:embed:repo
npm run rag:eval:embedding       # Recall@5 ≥ 80%
npm run rag:verify:m0 -- --full
```

## 脚本一览

| 命令 | 说明 |
|------|------|
| `rag:embed:local` | `--no-embed` 规则索引 |
| `rag:embed:world` | 时代 JSON chunks |
| `rag:embed:repo` | 全 repo `.md` |
| `rag:index:runs` | trace 规则索引 |
| `rag:query` | CLI；加 `--json` |
| `rag:verify:m0` | M0 验收 |

技术方案：[`02-technical-design/05-rag-system.md`](../../02-technical-design/05-rag-system.md)
