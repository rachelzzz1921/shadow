# Shadow RAG 系统 — 技术方案

更新时间：2026-06-14  
任务：**T-RAG** · Gate **G2**  
状态：**E0 工程包完成**；demo 后端接线 **暂停**（见 [`docs/plans/2026-06-14-rag-engineering-plan.md`](../docs/plans/2026-06-14-rag-engineering-plan.md)）

> **Agent**：invoke skill **`rag-kit`** · 架构总览 [`docs/rag-agent-architecture.md`](../docs/rag-agent-architecture.md) · 接入缝 [`packages/rag-kit/INTEGRATION.md`](../packages/rag-kit/INTEGRATION.md)

## 0. 需求确认（2026-06-14）

| 决策项 | 结论 |
|--------|------|
| 覆盖范围 | **全链路**：memory · world · Dialogue · harness 语料 · trace |
| 检索方式 | **混合**：规则粗筛 + 向量精排 + 业务重排 |
| 存储 | **Supabase pgvector** + **本地 fallback**（`RAG_ENABLED=false` 时行为与现网一致） |
| Embedding | **国产模型**，上线前跑中文叙事专项 eval |
| Harness 索引 | **整个 repo** 的 `.md`（含 `archive/`、`docs/`、`skills/pool/`） |
| Dialogue 边界 | 以七年叙事为主；**可带少量时代知识**，须标注 `source_url` / `source_id` |
| 硬约束 | 复读线 golden eval 0 error；Fate 同 run 可复现 |

## 1. 背景

Shadow Harness 有五类「需要找东西」的场景，数据形态与延迟不同，不宜做成单一向量库：

| 链路 | 现状 | RAG 目标 |
|------|------|----------|
| A. memory_stream | `memory-retrieval.js` 规则检索 | Dialogue 开放问句语义召回；Final 仍以规则为主 |
| B. world 时代语料 | `sampleFateContext()` 随机加权抽样 | 按 profile/叙事语境检索 macro/micro，再可复现抽样 |
| C. Dialogue | 仅 3 条 memory | memory + 年份叙事 + 少量 world 背景 |
| D. 开发语料 | Agent 全文读 `shadow-corpus/` | 全 repo `.md` 语义检索 |
| E. eval / trace | `runs/*.json` 人工复盘 | 按 eval warn / 叙事问题检索历史 run |

参考：[`02-p0-memory-reflection-replan.md`](./02-p0-memory-reflection-replan.md)、[`03-fate-agent-and-world-db.md`](./03-fate-agent-and-world-db.md)、[`knowledge/research/stanford-generative-agents.md`](../knowledge/research/stanford-generative-agents.md)。

## 2. 架构

```text
索引（离线/CI）                    运行时（archive/demo-v0.2）
─────────────────                 ─────────────────────────────
world JSON ──┐                    Year / Final / Dialogue / Fate
repo .md  ───┼→ chunk → embed ──→  lib/rag-service.js → retrieve()
runs JSON ───┘       ↓                    ↓
              Supabase rag_chunks    规则粗筛 → 向量精排 → prompt 注入
              (+ 本地 local-index)   RAG_ENABLED=false → 纯规则 fallback
```

**暂停期**：工程在 `packages/rag-kit` 独立演进；`rag-service.js` 已写、**冻结**，恢复时按 INTEGRATION.md 验收。

### 2.1 统一检索接口

```javascript
// packages/rag-kit/lib/retrieve.mjs
retrieve({
  namespace,       // 'world' | 'session' | 'harness' | 'trace'
  query,           // 用户问句 / profile keywords / beat seed
  filters,         // { calendar_year, scenario, run_id, beat_type, ... }
  limit: 8,
  strategy: 'hybrid'  // 'rules' | 'vector' | 'hybrid'
})
```

**混合打分**（默认）：

```text
final_score = 0.45 * vector_similarity
            + 0.30 * rule_score      // weight / recency / scenario / bigram
            + 0.25 * business_score  // sensitivity 降权、pivotal 加权
```

无 Supabase / 无 API key 时：`strategy` 自动降为 `rules`。

### 2.2 Namespace 与 RLS

| namespace | 内容 | 读 | 写 |
|-----------|------|----|----|
| `world` | macro/micro/atmosphere 切片 | 公开 SELECT | seed 脚本 service_role |
| `harness` | 全 repo `.md` chunks | 公开 SELECT | CI `rag:embed:repo` |
| `session` | memory、year 叙事片段 | **仅 `run_id` 过滤** | demo server 逐年 upsert |
| `trace` | run_summary、eval 摘要 | 团队 SELECT | final 后异步写入 |

`session` 必须按 `run_id` 隔离（LLM08 向量租户边界）。

## 3. 国产 Embedding 选型

### 3.1 主选：阿里云 DashScope `text-embedding-v3`

| 项 | 值 |
|----|-----|
| 提供商 | 阿里云百炼 / DashScope |
| 模型 | `text-embedding-v3` |
| 维度 | **1024**（`rag_chunks.embedding vector(1024)`） |
| 优势 | 中文 CMTEB 表现好、API 免部署、与通义生态一致 |
| 环境变量 | `DASHSCOPE_API_KEY`、`RAG_EMBEDDING_MODEL=text-embedding-v3` |

### 3.2 评估候选（`rag:eval:embedding` 对比）

上线前在 Shadow 域黄金 query 集上跑 **Recall@5**，不只看 MTEB 榜单：

| 候选 | 类型 | 备注 |
|------|------|------|
| DashScope `text-embedding-v3` | API | **默认生产** |
| DashScope `text-embedding-v2` | API | 成本对照 |
| 智谱 `embedding-3` | API | 备选 API |
| BGE-M3 | 开源自托管 | 需 GPU；混合检索（dense+sparse）能力强 |
| Qwen3-Embedding-0.6B | 开源 | 私有化备选；CMTEB-R 71+ |

### 3.3 中文叙事专项 eval 集（内置于 `eval-embedding-cn.mjs`）

| 类别 | 示例 query | 期望命中 |
|------|------------|----------|
| memory | 「你为什么选择复读」 | pivotal memory `type=decision` |
| year | 「第三年发生了什么」 | `years[3].narrative` 片段 |
| world | 「那年高考改革有什么背景」 | 对应年 `macro_events` education 类 |
| harness | 「intervention re-plan 规则在哪」 | `03-coding/01-narrative-prompt-protocol.md` |
| dialogue | 「影子后来后悔了吗」 | final + memory 收束句 |

**通过线**：主选模型在 eval 集上 Recall@5 ≥ 0.80，且不低于次选模型 5pp。

## 4. Supabase 数据模型

见 [`world/schema/002_rag_embeddings.sql`](../world/schema/002_rag_embeddings.sql)。

核心表 `rag_chunks`：

- `namespace`, `source_type`, `source_id`, `chunk_index`
- `content`, `metadata jsonb`, `embedding vector(1024)`
- `corpus_version` — 与 `WORLD_CORPUS_VERSION` / `RAG_CORPUS_VERSION` 对齐

**与现有 world 表关系**：`world_*` 仍为 Fate 业务只读源；`rag_chunks` 为检索层，由 `embed-world.mjs` 从 JSON 或 DB 同步。

## 5. 五条链路接线（archive/demo-v0.2）

### 5.1 memory_stream（链路 A）

| 场景 | 策略 |
|------|------|
| `runFinal` | 保持 `selectMemories(limit:5)` **纯规则** |
| `runDialogue` | 规则粗筛 top-10 → hybrid 精排 top-3 |

每年 `memoryFromYear` 后异步 upsert `namespace=session`, `source_type=memory`。

### 5.2 world / Fate（链路 B）

**接线**：`lib/fate-bridge.js` → `resolveFateContext`

1. **粗筛**：`calendar_year` + `scenario_weights` 域 + `beatType`（pivotal 偏 `can_pivot`）
2. **精排**：`profile.keywords` + `persona_card` + `priorInterventions` 拼 query
3. **抽样**：在 top-K 池内仍用 `hash(runId:calendarYear:narrativeYear)` 可复现抽样

`RAG_ENABLED=false` 时退回现有 `sampleFateContext()` 全池抽样。

### 5.3 Dialogue（链路 C）

**接线**：`agents.runDialogue`

召回包：

```text
memory (3) + year_narrative (1–2) + world_micro 背景 (0–2, 带 source_url) + persona 固定摘要
```

Prompt 约束（`prompts.js`）：

- 答案必须优先引用 `memory_stream` / `years[n].narrative`
- 时代补充 ≤ 2 句，格式：`（时代背景：{title}，来源：{source_url}）`
- 无检索命中时明确说「影子记忆里没提过」，不编造

### 5.4 Harness 语料（链路 D）

**索引范围**：仓库根下全部 `.md`，排除：

- `node_modules/`, `.git/`, `dist/`, `package-lock.json` 邻域
- 二进制与超大文件（>512KB 跳过并记 log）

**chunk 策略**：按 `##` / `###` 切分，保留 `file_path`、`harness_stage`（从路径推断）、`heading`。

**入口**：`npm run rag:query -- "复读线 eval 规则"`

### 5.5 trace（链路 E）

`final` 完成后写入 `namespace=trace`：

```json
{
  "run_id": "...",
  "story_id": "fuxduxian",
  "eval_errors": 0,
  "eval_warnings": ["..."],
  "pivotal_years": [1, 4],
  "final_opening": "..."
}
```

## 6. 代码落点

```text
shadow-corpus/
├── 02-technical-design/05-rag-system.md     # 本文
├── packages/rag-kit/                        # 共享包
│   ├── lib/
│   │   ├── config.mjs
│   │   ├── embed.mjs                        # DashScope 等国产 API
│   │   ├── retrieve.mjs
│   │   ├── chunk-world.mjs
│   │   ├── chunk-repo.mjs
│   │   └── supabase-client.mjs
│   └── scripts/
│       ├── embed-world.mjs
│       ├── embed-repo.mjs
│       ├── eval-embedding-cn.mjs
│       └── query.mjs
├── world/schema/002_rag_embeddings.sql
└── archive/demo-v0.2/lib/
    └── rag-service.js                       # 后端编排（Fate / Dialogue / trace / API）
```

## 7. 环境变量

```bash
# Supabase（检索 + 写入）
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...              # runtime 只读
SUPABASE_SERVICE_ROLE_KEY=...      # embed/seed 脚本

# RAG 开关
RAG_ENABLED=true                   # false → 全链路规则 fallback
RAG_FALLBACK=rules               # rules | local-json

# 国产 Embedding（主选 DashScope）
DASHSCOPE_API_KEY=sk-...
RAG_EMBEDDING_PROVIDER=dashscope   # dashscope | zhipu | openai（仅 eval 对照）
RAG_EMBEDDING_MODEL=text-embedding-v3
RAG_EMBEDDING_DIMENSIONS=1024

# 版本
WORLD_CORPUS_VERSION=2026.06.14-v1
RAG_CORPUS_VERSION=2026.06.14-rag-v1
```

## 8. 分阶段交付

| 阶段 | 交付 | 状态 |
|------|------|------|
| **E0 工程包** | rag-kit + CLI + local-index + verify + skill | ✅ 见 [工程计划](../docs/plans/2026-06-14-rag-engineering-plan.md) |
| **E1 向量层** | 全量 embed + Recall@5≥80% | ⏸ DashScope / 密钥 |
| **E2 云端层** | Supabase service_role 写入 | ⏸ JWT role 须为 service_role |
| **M0 基建** | SQL + rag-kit + eval 脚本 | ✅ 脚手架就绪 |
| **M1–M4 demo** | `rag-service.js` 五条链路 | 🔒 已接、**暂停扩展** |

### M0 验收（工程包）

- [x] `002_rag_embeddings.sql` 可在 Supabase SQL Editor 执行
- [x] `npm run rag:embed:local` 规则索引可跑
- [x] `npm run rag:verify:m0` 脚本
- [x] `RAG_ENABLED=false` 时 demo 测试通过
- [ ] 全量向量 embed + Recall@5≥80%（恢复 E1/E2 后）

### demo 总验收（恢复后端时）

- [x] 复读线 golden eval 0 error
- [x] Dialogue / Fate / trace 接线已写在 `rag-service.js`
- [ ] 云端 `rag_chunks` 含 embedding + hybrid 命中（待 E2）

## 9. npm 脚本（根 package.json）

```bash
npm run rag:embed:world      # world JSON → rag_chunks
npm run rag:embed:repo       # 全 repo .md → rag_chunks
npm run rag:eval:embedding   # 国产模型中文叙事 eval
npm run rag:query -- "..."   # harness 语料检索 CLI
```

## 10. 风险与缓解

| 风险 | 缓解 |
|------|------|
| Embedding API 不可用 | `RAG_ENABLED=false`；规则路径不变 |
| 向量污染 / 跨 run 泄漏 | `session` 强制 `run_id` 过滤 + RLS |
| Fate 可复现性破坏 | 向量只缩候选池；抽样仍用 deterministic seed |
| 全 repo 索引噪声大 | metadata 标 `harness_stage`；查询默认 `namespace=harness` |
| Dialogue 幻觉时代知识 | prompt 硬约束 + 必须带 source_url |

## 11. 相关阅读

- [`01-shadow-harness-loop.md`](./01-shadow-harness-loop.md)
- [`02-p0-memory-reflection-replan.md`](./02-p0-memory-reflection-replan.md)
- [`03-fate-agent-and-world-db.md`](./03-fate-agent-and-world-db.md)
- [`packages/rag-kit/README.md`](../packages/rag-kit/README.md)
- [`packages/rag-kit/INTEGRATION.md`](../packages/rag-kit/INTEGRATION.md)
- [`docs/plans/2026-06-14-rag-engineering-plan.md`](../docs/plans/2026-06-14-rag-engineering-plan.md)
- Skill：**`rag-kit`**（`skills/shadow/rag-kit/SKILL.md`）
