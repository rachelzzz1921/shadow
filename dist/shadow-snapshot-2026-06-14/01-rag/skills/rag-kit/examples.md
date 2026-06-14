# RAG Kit — Examples

## 无 API：规则索引 + 检索

```bash
cd /path/to/shadow   # 仓库根
npm run rag:install
npm run rag:embed:local
npm run rag:query -- --json "memory_stream Final Dialogue 检索"
npm run rag:query -- --world --json "那年高考改革有什么社会背景"
```

## 向量层（需 DashScope）

```bash
# 断点续跑：已嵌入的 chunk 自动 skip
npm run rag:embed:world
npm run rag:embed:repo
npm run rag:eval:embedding
npm run rag:eval:embedding -- --provider zhipu   # 对照
```

## M0 验收

```bash
npm run rag:verify:m0              # 环境 + schema 探针 + query smoke + demo test
npm run rag:verify:m0 -- --full    # 外加 embed + eval（调 API，可能计费）
```

## 改 chunk 逻辑后

```bash
npm run rag:embed:local -- --no-resume   # 强制全量重建规则索引
npm test
npm run rag:verify:m0
```

## 暂停期：不要做的

- 不要在 `agents.js` / `fate-bridge.js` 新增 `import` rag-kit 路径
- 不要假设 `rag_chunks` 云端已有向量
- 不要为通过 eval 篡改 `eval-embedding-cn.mjs` 黄金 query
