# @shadow/rag-kit

Shadow 混合 RAG：**本地 ONNX 向量（默认）** + 可选 DashScope + Supabase。

## 本地向量化（无需 DashScope）

```bash
# 首次需联网从 HF 镜像下载模型（~100MB），之后可离线
npm run rag:install
npm run rag:embed:vectors    # world + repo，384 维 ONNX

npm run rag:query -- --json "高考改革"
npm run rag:eval:local       # 本地 Recall@5 评测
npm run demo:local           # demo 自动走 hybrid（有向量时）
```

`world/.env` 推荐：

```env
RAG_EMBEDDING_PROVIDER=local
RAG_EMBEDDING_DIMENSIONS=384
HF_ENDPOINT=https://hf-mirror.com
```

云端 DashScope 欠费/无 key 时，`RAG_EMBEDDING_FALLBACK=local` 会自动降级。

向量存 **`data/local-index/*.json`**（384 维）；Supabase `vector(1024)` 仅云端 DashScope 写入。

→ 工程计划 [`docs/plans/2026-06-14-rag-engineering-plan.md`](../../docs/plans/2026-06-14-rag-engineering-plan.md)  
→ demo 接入 [`INTEGRATION.md`](./INTEGRATION.md)
