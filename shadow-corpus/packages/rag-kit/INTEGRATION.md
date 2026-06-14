# rag-kit → demo 接入缝（恢复后端时读本文）

> **demo 已自动接入**：`server.js` → `load-env` + `rag-bootstrap` → `rag-service.js`  
> 启动日志：`[rag] enabled · mode=… · local_chunks=…`

## 唯一适配层

```text
archive/demo-v0.2/lib/rag-service.js
```

| 导出函数 | 调用方 | 链路 |
|----------|--------|------|
| `refineWorldPoolForFate` | `fate-bridge.js` | B · world / Fate |
| `buildDialogueContext` | `agents.js` | C · Dialogue |
| `indexSessionAfterYear` | `story-session.js` | A · session |
| `indexTraceAfterFinal` | `story-session.js` | E · trace |
| `queryRag` / `getRagStatus` | `server.js` | M3 · API |

**禁止**：在 `fate-bridge` / `agents` / `prompts` 里直接 `import rag-kit`；一律经 `rag-service.js`。

## rag-kit 公共 API

```javascript
// packages/rag-kit/lib/retrieve.mjs
retrieve({ namespace, query, filters, limit, strategy: 'hybrid' | 'rules' | 'vector' })

// packages/rag-kit/lib/supabase-client.mjs
upsertChunks(rows)   // Supabase + 本地双写（本地 RAG_LOCAL_INDEX≠false）
fetchCandidates({ namespace, filters, limit })

// packages/rag-kit/lib/config.mjs
loadEnv()            // 合并 world/.env + demo/.env，占位符可被后者覆盖
ragConfig()
isConfiguredSecret()
```

## 环境变量（恢复向量层）

见 [`world/.env.example`](../../world/.env.example)。关键：

- `RAG_ENABLED=false` → `rag-service` 走规则 fallback，**必须**保持 golden 0 error
- `SUPABASE_SERVICE_ROLE_KEY` JWT role 必须是 `service_role`
- `DASHSCOPE_API_KEY` 用于 embed；叙事 LLM 仍走 `STEPFUN` / Anthropic（`llm-runtime.js`）

## HTTP API（已存在，暂停扩展）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/rag/status` | enabled / supabase / local_index / embed_provider |
| `POST` | `/api/rag/query` | `{ query, namespace, filters?, limit? }` |

恢复后端时：**只验证行为**，不增新路由，除非更新 `05-rag-system.md`。

## 验收顺序

```bash
npm run rag:verify:m0 -- --full   # 包 + 索引 + eval
npm test                          # demo 48+ tests
npm run test:golden
npm run harness:smoke
```

## 与 fate-agent 分工

| 任务 | Skill / 工具 |
|------|----------------|
| 扩 world JSON / seed / 六域权重 | `fate-agent` · `world/scripts/` |
| 语义检索 / embed / eval | **`rag-kit` skill** · `npm run rag:*` |
| 叙事 prompt 注入时代来源 | `rag-service` + `prompts.js`（恢复 E2 后再动） |
