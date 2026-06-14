# @shadow/rag-kit

Shadow 混合 RAG：国产 Embedding（DashScope）+ Supabase pgvector + **本地 JSON 索引 fallback**。

## 三种运行模式

| 模式 | 条件 | 检索 |
|------|------|------|
| **hybrid** | DashScope +（Supabase 或本地索引含 embedding） | 规则 + 向量 |
| **rules-index** | 本地/Supabase 索引，无 embedding key | 规则，走缓存索引（快） |
| **rules-local** | 无索引 | 每次扫 repo（慢） |

## 快速开始

```bash
cd shadow-corpus/packages/rag-kit && npm install

# 无需 Supabase：先建规则索引（已在本机跑过 world 7405 + trace 105）
npm run embed:local          # 或 npm run embed:world -- --no-embed

# 有 DashScope 后开向量层
# DASHSCOPE_API_KEY=... npm run embed:all

# 索引历史 runs
npm run index:runs

# 查询
npm run query -- "intervention re-plan 规则"
npm run query -- "高考改革" --world   # 需改 query.mjs 或 API namespace=world
```

Demo API：`GET /api/rag/status` · `POST /api/rag/query`（`namespace`: harness|world|trace|session）

技术方案：[`02-technical-design/05-rag-system.md`](../../02-technical-design/05-rag-system.md)
