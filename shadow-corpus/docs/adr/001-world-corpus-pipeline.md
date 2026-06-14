# ADR 001: World 语料管线 — generate / import / 检索分层

**状态**: Accepted  
**日期**: 2026-06-14  
**范围**: `shadow-corpus/world/`、`packages/rag-kit/`

## 背景

21 年语料经 NotebookLM patch 合并后，`npm run generate` 全量重跑会覆盖 merge 成果；import 仅 exact 去重；本地检索与 RAG 向量检索分属两套工具；`sampleFateContext` 与 rag-kit 预筛无统一接口。

## 决策

### 1. generate vs import

| 命令 | 行为 |
|------|------|
| `npm run generate` | **默认跳过** 含 `notebooklm_imported_at` 的年份 |
| `npm run generate -- --regen-pools` | 安全模式：仅追加 scenario-pools 新 micro，保留 NotebookLM 层 |
| `npm run generate -- --year 2018 --force` | 从种子重建该年；保留 `notebooklm_*` 元字段；**须再跑 import** |
| `npm run import-notebooklm` | patch 合并；fuzzy 去重 |

### 2. 去重

- **exact**：`helpers.dedupeByText` / `dedupeMacros`（generate 内部）
- **fuzzy**（threshold 0.85）：`lib/dedupe.mjs`，import 合并与 `npm run audit-duplicates` 审计

### 3. 检索两层 + 统一 seam

```
corpus-retrieval.mjs
├── loadYearPack(year)
├── searchCorpus()      → L1 离线关键词
├── refinePoolForFate() → L2 规则预筛（rag-kit world-pool）
└── preparePoolForSampling() → sampleFateContext(retrieval=...)
```

`sampleFateContext({ retrieval: 'none'|'rules'|'hybrid' })` 为运行时入口；向量检索仍走 `packages/rag-kit` embed + `retrieve()`。

### 4. RAG 同步

合并/validate 后：

```bash
npm run sync-rag              # validate → stats → embed-world
npm run sync-rag -- --dry-run # 仅统计 chunk 数
npm run sync-rag -- --no-embed # 无 API key 时写空 embedding
```

## 后果

- 子池扩展用 `--regen-pools`，不再误伤 NotebookLM 语料
- import 重复 patch 或标题变体可被 fuzzy 拦截
- demo / Year agent 可通过 `retrieval: 'rules'` 启用规则预筛，无需改 fate-bridge 双路径
- RAG 索引需显式 `sync-rag`，不随 import 自动触发（避免 CI 依赖 API key）

## 未决

- cross-year macro 去重（同事件不同年标题）
- generate `--force` 后自动 replay notebooklm patches（脚本化）
