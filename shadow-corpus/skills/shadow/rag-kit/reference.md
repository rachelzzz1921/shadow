# RAG Kit — Reference

## 文件地图

```text
packages/rag-kit/
├── lib/
│   ├── config.mjs           # loadEnv 合并 · isConfiguredSecret · ragConfig
│   ├── embed.mjs            # DashScope / 智谱 / stepfun stub
│   ├── retrieve.mjs         # hybrid = rules + vector rerank
│   ├── chunk-world.mjs      # world JSON → chunks
│   ├── chunk-repo.mjs       # 全 repo .md walk（排除 node_modules 等）
│   ├── score-rules.mjs      # 规则分（与 memory-retrieval 对齐）
│   ├── local-index.mjs      # data/local-index/{namespace}.json
│   ├── supabase-client.mjs  # upsert + fetch；Supabase 失败可保留本地镜像
│   ├── world-pool.mjs       # Fate query 构建 + refineWorldPool
│   ├── session-index.mjs    # 逐年 session chunks
│   └── trace-index.mjs      # final run 摘要
├── scripts/
│   ├── embed-world.mjs      # --no-embed · --no-resume
│   ├── embed-repo.mjs
│   ├── embed-all.mjs
│   ├── eval-embedding-cn.mjs
│   ├── query.mjs            # --json · --world · --trace
│   └── index-runs.mjs
└── data/local-index/        # gitignore

根目录
├── scripts/verify-rag-m0.mjs
└── package.json             # rag:* 脚本

world/schema/002_rag_embeddings.sql

demo 适配层（冻结，恢复时验）
└── archive/demo-v0.2/lib/rag-service.js
```

## npm 脚本

| 脚本 | 作用 |
|------|------|
| `rag:install` | 安装 rag-kit 依赖 |
| `rag:embed:local` | world + repo，`--no-embed` |
| `rag:embed:world` | 时代语料向量/规则 upsert |
| `rag:embed:repo` | 全 repo `.md` |
| `rag:embed:all` | world + repo |
| `rag:eval:embedding` | 中文叙事 Recall@5 |
| `rag:query` | CLI 检索 |
| `rag:index:runs` | `runs/*.json` → trace 索引 |
| `rag:verify:m0` | 环境/schema/smoke；`--full` 含 embed+eval |

## 环境变量

加载顺序（后者覆盖前者占位符）：`rag-kit/.env` → `world/.env` → `demo/.env` → 根 `.env`

| 变量 | 用途 |
|------|------|
| `RAG_ENABLED` | `false` 时全链路规则 fallback |
| `DASHSCOPE_API_KEY` | 主 embedding |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` | 云端索引 |
| `RAG_EMBEDDING_PROVIDER` | `dashscope`（默认）\| `zhipu` |
| `RAG_CORPUS_VERSION` | upsert 版本戳 |

**常见错误**：`SUPABASE_SERVICE_ROLE_KEY` 填成 anon JWT → RLS 拒绝写入。验证：

```bash
# 只输出 role，不打印 key
node -e "import {loadEnv,ragConfig} from './shadow-corpus/packages/rag-kit/lib/config.mjs';loadEnv();const k=ragConfig().supabaseServiceKey;console.log(JSON.parse(Buffer.from(k.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'),'base64')).role)"
```

期望：`service_role`。

## 恢复后端清单

- [ ] `service_role` JWT 正确
- [ ] DashScope 无 `Arrearage`
- [ ] SQL Editor 已执行 `002_rag_embeddings.sql`
- [ ] `npm run rag:embed:world` 全量成功
- [ ] `npm run rag:embed:repo` 全量成功
- [ ] `npm run rag:eval:embedding` Recall@5 ≥ 80%
- [ ] `npm run rag:verify:m0 -- --full` → `[DONE]`
- [ ] `npm test` + `test:golden` 仍绿
- [ ] 读 `INTEGRATION.md` 跑 `harness:smoke`

## 相关链接

- 工程计划：[`docs/plans/2026-06-14-rag-engineering-plan.md`](../../../docs/plans/2026-06-14-rag-engineering-plan.md)
- 技术方案：[`02-technical-design/05-rag-system.md`](../../../02-technical-design/05-rag-system.md)
- Supabase SQL：[`world/schema/002_rag_embeddings.sql`](../../../world/schema/002_rag_embeddings.sql)
- Supabase API：[dashboard API settings](https://supabase.com/dashboard/project/dkskgnlrlcyvfxhngxib/settings/api)
- DashScope：[console](https://dashscope.console.aliyun.com/)
