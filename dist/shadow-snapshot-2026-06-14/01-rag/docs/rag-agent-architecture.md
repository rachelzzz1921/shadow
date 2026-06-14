# Shadow RAG Agent — 逻辑架构 · 向量库 · Skill 设计

> **来源**：2026-06-14 RAG 工程 agent 会话交付（需求对齐 → 技术方案 → `packages/rag-kit` → demo 接线 → `rag-kit` skill）  
> **读者**：后续接手的 agent / 工程师  
> **关联**：[`02-technical-design/05-rag-system.md`](../02-technical-design/05-rag-system.md) · [`docs/plans/2026-06-14-rag-engineering-plan.md`](./plans/2026-06-14-rag-engineering-plan.md) · skill **`rag-kit`**

---

## 1. 这个 Agent 解决什么问题

Shadow 不是「做一个万能 ChatGPT + 向量库」，而是给 **五条已有链路** 加统一检索层：

| 链路 | 代号 | 运行时入口 | 检索目标 |
|------|------|------------|----------|
| memory_stream | **A** | Final / Dialogue | 七年记忆片段 |
| world / Fate | **B** | `fate-bridge.js` | 时代 macro/micro 际遇 |
| Dialogue 问答 | **C** | `agents.runDialogue` | memory + 年份叙事 + 少量时代背景 |
| Harness 开发语料 | **D** | Agent / CLI | 全 repo `.md` 协议与文档 |
| eval / trace | **E** | final 后异步 | 历史 run 摘要与 eval 信号 |

**核心设计原则**（需求对齐时已确认）：

1. **统一接口、分 namespace 策略** — 不做五个独立向量库，但每条链路的粗筛规则不同。
2. **混合检索** — 规则粗筛 → 向量精排 → 业务重排；无 API / 无向量时自动降为纯规则。
3. **硬约束不变** — `RAG_ENABLED=false` 时 demo 行为与现网一致；复读线 golden eval 0 error；Fate 同 run 可复现。
4. **单一适配层** — demo 只通过 `archive/demo-v0.2/lib/rag-service.js` 接 rag-kit，禁止在业务模块里直接 `import rag-kit`。

---

## 2. 逻辑架构总览

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        离线 / CI 索引层                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  world JSON ──→ chunk-world.mjs ──┐                                      │
│  repo .md   ──→ chunk-repo.mjs  ──┼→ embed (local ONNX / DashScope)     │
│  runs/*.json → index-runs.mjs   ──┘         ↓                           │
│                                    upsertChunks → Supabase rag_chunks    │
│                                              └→ data/local-index/*.json │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        运行时编排层（demo）                                │
├─────────────────────────────────────────────────────────────────────────┤
│  server.js → rag-bootstrap.js → rag-service.js                          │
│       │                                                                 │
│       ├─ refineWorldPoolForFate()     ← 链路 B                          │
│       ├─ buildDialogueContext()       ← 链路 A + C                      │
│       ├─ indexSessionAfterYear()      ← 链路 A 写入                     │
│       ├─ indexTraceAfterFinal()       ← 链路 E 写入                     │
│       └─ queryRag / getRagStatus      ← HTTP 调试                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   packages/rag-kit/lib/retrieve.mjs                      │
├─────────────────────────────────────────────────────────────────────────┤
│  fetchCandidates (Supabase 或 local-index)                               │
│       → ruleScore 粗排 (top 3×limit)                                   │
│       → embedOne(query) + cosineSimilarity 精排（可选）                   │
│       → businessScore 重排                                               │
│       → final = 0.45·vector + 0.30·rule + 0.25·business (hybrid)       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.1 统一检索 API

所有链路最终调用同一函数：

```javascript
// packages/rag-kit/lib/retrieve.mjs
retrieve({
  namespace,       // 'world' | 'session' | 'harness' | 'trace'
  query,
  filters,         // { calendar_year, run_id, scenario, ... }
  limit: 8,
  strategy: 'hybrid' | 'rules' | 'vector',
  localCandidates  // session 运行时可直接传入，避免跨 run 泄漏
})
```

**策略自动降级**：

| 条件 | 实际 strategy |
|------|----------------|
| `RAG_ENABLED=false` | `rules` |
| 无 query 字符串 | `rules` |
| embed 失败 | `rules`（catch 后返回 rule 分排序） |
| 无 embedding 字段 | `rules` |

### 2.2 五条链路的编排细节

#### 链路 A — memory_stream

| 场景 | 行为 |
|------|------|
| `runFinal` | **保持纯规则** `selectMemories(limit:5)`，不用向量 |
| `runDialogue` | 规则粗筛 top-10 → hybrid 精排 top-3 |
| 逐年写入 | `memoryFromYear` 后 upsert `namespace=session`, `source_type=memory` |

#### 链路 B — world / Fate

```text
sampleFateContext 之前:
  1. buildFateQuery(profile + persona + priorInterventions + beatType)
  2. retrieve(namespace='world', filters={ calendar_year })
  3. boostIds → refineWorldPool（规则仍主导）
  4. 在缩小后的池内用 hash(runId:calendarYear:narrativeYear) 可复现抽样
```

向量只**缩小候选池**，不破坏 Fate 确定性。

#### 链路 C — Dialogue

`buildDialogueContext` 组装召回包：

```text
memory (≤3) + year_narrative (≤2) + world_micro 背景 (≤2, 带 source_url) + persona 固定摘要
```

Prompt 硬约束（`prompts.js`）：优先引用 memory / years；时代补充 ≤2 句且标注来源；无命中时说「影子记忆里没提过」。

#### 链路 D — Harness 语料

- 索引：仓库根下全部 `.md`（含 `archive/`、`docs/`、`skills/pool/`）
- 排除：`node_modules/`、`.git/`、`dist/`、>512KB 文件
- Chunk：按 `##` / `###` 切分，metadata 含 `file_path`、`harness_stage`
- 入口：`npm run rag:query -- "复读线 eval 规则"`

#### 链路 E — trace

`final` 完成后写入 `namespace=trace`，内容含 `run_id`、`eval_errors`、`eval_warnings`、`pivotal_years`、`final_opening` 等，供 story-review / 复盘检索。

### 2.3 demo 唯一适配层

| 导出函数 | 调用方 | 链路 |
|----------|--------|------|
| `refineWorldPoolForFate` | `fate-bridge.js` | B |
| `buildDialogueContext` | `agents.js` | C |
| `indexSessionAfterYear` | `story-session.js` | A |
| `indexTraceAfterFinal` | `story-session.js` | E |
| `queryRag` / `getRagStatus` | `server.js` | 调试 API |

**禁止**：在 `fate-bridge` / `agents` / `prompts` 里直接 `import rag-kit`。

HTTP（已存在，暂停扩展新路由）：

- `GET /api/rag/status`
- `POST /api/rag/query`

---

## 3. 向量库设计

### 3.1 为什么用一张表 + 四个 namespace

Shadow 的数据形态差异大（公开时代事实 vs 按 run 隔离的 session vs 开发文档 vs trace），但检索 API 相同。采用 **单表 `rag_chunks` + namespace 分区**，而不是多个物理库：

- 统一 embed / upsert / retrieve 代码路径
- 统一版本戳 `corpus_version`
- 通过 metadata + RLS + 应用层 `run_id` 过滤做租户隔离

### 3.2 Supabase 表结构

DDL：[`world/schema/002_rag_embeddings.sql`](../world/schema/002_rag_embeddings.sql)

```sql
rag_chunks (
  id uuid PK,
  namespace text CHECK IN ('world','session','harness','trace'),
  source_type text,          -- macro_event | memory | harness_doc | run_summary ...
  source_id text,
  chunk_index int,
  content text,
  metadata jsonb,
  embedding vector(1024),    -- DashScope text-embedding-v3
  corpus_version text,
  unique (namespace, source_id, chunk_index, corpus_version)
)
```

**辅助索引**：

- `namespace`
- `(namespace, source_type)`
- `(metadata->>'run_id')` WHERE session/trace
- `(metadata->>'calendar_year')` WHERE world
- `(metadata->>'file_path')` WHERE harness
- IVFFlat on `embedding` — seed 后手动建

**调试函数**：`rag_match(query_embedding, match_namespace, match_count, filter jsonb)`

### 3.3 Namespace 权限与隔离

| namespace | 内容 | 读 | 写 |
|-----------|------|----|----|
| `world` | 时代 macro/micro/atmosphere | 公开 SELECT | seed / embed 脚本（service_role） |
| `harness` | 全 repo `.md` chunks | 公开 SELECT | CI `rag:embed:repo` |
| `session` | memory、year 叙事 | **必须 `run_id` 过滤** | demo server 逐年 upsert |
| `trace` | run 摘要 | 团队 SELECT | final 后异步 |

`session` 是 LLM08 向量租户边界 — 检索时必须带 `filters: { run_id }`。

### 3.4 本地镜像（双写架构）

路径：`packages/rag-kit/data/local-index/{namespace}.json`（gitignore）

```text
upsertChunks:
  1. 总是 mirror 到 local-index（除非 RAG_LOCAL_INDEX=false）
  2. 若 Supabase service_role 可用 → 同时写云端
  3. Supabase 失败但 local 成功 → warn 并继续（开发友好）

fetchCandidates:
  Supabase 优先 → 失败或无配置 → 读 local-index
```

**本机基线（2026-06-14）**：

| namespace | chunks（规则索引） | 向量 |
|-----------|-------------------|------|
| world | ~7405 | 880（DashScope 欠费中断，可 `--resume`） |
| harness | ~6396 | 规则索引已完成 |
| session / trace | 运行时增长 | 规则 |

### 3.5 双轨 Embedding 维度

| 模式 | Provider | 维度 | 存储位置 |
|------|----------|------|----------|
| **本地开发（默认推荐）** | `local` / Xenova ONNX | **384** | 仅 `local-index/*.json` |
| **云端生产** | DashScope `text-embedding-v3` | **1024** | Supabase `vector(1024)` |

本地 384 维向量**不会**写入 Supabase（schema 维度不匹配，`supabaseEmbedding()` 返回 null）。这是刻意设计：开发机无 API 也能跑 hybrid。

```env
# 本地向量（无需 DashScope）
RAG_EMBEDDING_PROVIDER=local
RAG_EMBEDDING_DIMENSIONS=384
HF_ENDPOINT=https://hf-mirror.com

# 云端向量
RAG_EMBEDDING_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-...
RAG_EMBEDDING_DIMENSIONS=1024
```

模型：`Xenova/paraphrase-multilingual-MiniLM-L12-v2`（中文叙事可用，~100MB 首次下载）。

### 3.6 与现有 world 业务表的关系

```text
world_years / world_macro_events / world_micro_events   ← Fate 业务只读源（fate-agent）
rag_chunks (namespace=world)                            ← 检索层（rag-kit）
```

`embed-world.mjs` 从 JSON 或 DB 同步到 `rag_chunks`；Fate 抽样逻辑仍读 `world/data/years/*.json` 或通过 `fate-bridge` 加载，RAG 只做 pool refine。

---

## 4. Embedding 与评测

### 4.1 Provider 解析顺序

[`config.mjs`](../packages/rag-kit/lib/config.mjs) → `resolveEmbeddingProvider()`：

1. 显式 `RAG_EMBEDDING_PROVIDER`
2. `RAG_LOCAL_EMBED=true`
3. 有 `DASHSCOPE_API_KEY` → `dashscope`
4. 有 `ZHIPU_API_KEY` → `zhipu`
5. 默认 → `local`

`RAG_EMBEDDING_FALLBACK=local`：DashScope 欠费/失败时自动降级本地 ONNX。

### 4.2 中文叙事专项 eval

脚本：`npm run rag:eval:embedding` / `rag:eval:local`

内置黄金 query 集（[`eval-embedding-cn.mjs`](../packages/rag-kit/scripts/eval-embedding-cn.mjs)）：

| 类别 | 示例 query | 期望命中 |
|------|------------|----------|
| memory | 「你为什么选择复读」 | pivotal memory |
| year | 「第三年发生了什么」 | years[3] 片段 |
| world | 「那年高考改革有什么背景」 | macro education |
| harness | 「intervention re-plan 规则在哪」 | narrative-prompt-protocol |
| dialogue | 「影子后来后悔了吗」 | final + memory |

**通过线**：Recall@5 ≥ 0.80，且主选不低于次选 5pp。

---

## 5. Skill 设计与 Agent 工作流

### 5.1 Skill 在 Shadow 体系中的位置

```text
用户任务
    ↓
shadow-router（80+ skill 路由）
    ↓
rag-kit skill          ← 检索工程、embed、eval、verify
    ↔ fate-agent skill ← world JSON / seed / 六域权重（不碰 embed）
    ↔ story-authoring  ← 叙事正文（不用 rag-kit）
    ↔ story-review     ← 审 trace（可读 trace namespace）
```

治理注册：[`skills/_governance/skills-manifest.json`](../skills/_governance/skills-manifest.json)

```json
{
  "topic": "RAG vs Fate 语料",
  "skills": ["rag-kit", "fate-agent"],
  "primary": "rag-kit",
  "rule": "embed/检索/eval/verify 用 rag-kit；扩 world JSON/六域子池/seed 用 fate-agent"
}
```

### 5.2 `rag-kit` Skill 结构

源码：[`skills/shadow/rag-kit/`](../skills/shadow/rag-kit/)

| 文件 | 作用 |
|------|------|
| `SKILL.md` | 触发词、任务分流、硬约束、验收命令 |
| `reference.md` | 文件地图、env、恢复后端清单 |
| `examples.md` | 常见命令与「暂停期不要做的」 |

同步到 Cursor：[`skills/sync-cursor-links.sh`](../skills/sync-cursor-links.sh) → `.cursor/skills/rag-kit`

### 5.3 Agent 标准工作流（SOP）

#### 不接云端时（当前默认）

```bash
1. invoke skill: rag-kit
2. npm run rag:install
3. npm run rag:embed:local          # 或 rag:embed:vectors（本地 ONNX）
4. npm run rag:query -- --json "…"  # 开发检索
5. 改 chunk/retrieve/eval → npm test + rag:verify:m0
```

#### 恢复向量 / 云端时

```bash
1. 确认 service_role JWT + DashScope 无欠费
2. SQL Editor 执行 002_rag_embeddings.sql
3. npm run rag:embed:world && npm run rag:embed:repo
4. npm run rag:eval:embedding       # Recall@5 ≥ 80%
5. npm run rag:verify:m0 -- --full
6. npm test && npm run test:golden && npm run harness:smoke
7. 读 INTEGRATION.md，只验 rag-service 行为，不扩新路由
```

### 5.4 Skill 硬约束（Agent 必须遵守）

- **不破坏** `RAG_ENABLED=false`：demo `npm test` + golden 0 error
- **不删除** rules fallback
- **不打印** `.env` 密钥；**不提交** `world/.env`、`data/local-index/*.json`
- **不编造** Supabase 已成功 — 用 `rag:verify:m0` 或 schema 探针
- demo 检索逻辑**只**经 `rag-service.js`
- **暂停期不要**：在 `agents.js` / `fate-bridge.js` 新增 rag-kit import；假设云端已有向量；为通过 eval 篡改黄金 query

### 5.5 与相邻 Skill 的边界

| 任务 | 用哪个 |
|------|--------|
| 写七年正文 / golden | `story-authoring` |
| 扩 world JSON、六域子池、Supabase seed | `fate-agent` |
| chunk / embed / retrieve / eval / M0 验收 | **`rag-kit`** |
| 改 Scene Router / 六场景 prompt | `scene-agents` |
| 审叙事质量 / trace 复盘 | `story-review` |
| 改 lib + 测试 | `tdd` |

---

## 6. 分期交付与升级路线

### 6.1 阶段状态（2026-06-14）

| 阶段 | 范围 | 状态 |
|------|------|------|
| **E0 工程包** | rag-kit + CLI + local-index + verify + skill | ✅ 完成 |
| **E0+ 本地向量** | Xenova ONNX 384 维 + `rag:embed:vectors` | ✅ 完成 |
| **E1 向量层** | DashScope 全量 embed + Recall@5≥80% | ⏸ 待账户/密钥 |
| **E2 云端层** | Supabase service_role 写入 + 云端 hybrid | ⏸ 待 service_role |
| **M1–M4 demo** | `rag-service.js` 五条链路 | 🔒 已接、冻结扩展 |

### 6.2 升级路径（建议顺序）

```text
Phase 0 — 规则索引（零 API）
  rag:embed:local → 全链路 rules 可用

Phase 1 — 本地 hybrid（零 DashScope）
  rag:embed:vectors → local-index 含 384 维
  rag:eval:local → 基线 Recall

Phase 2 — 云端向量
  DashScope 结清 → rag:embed:world/repo --resume
  rag:eval:embedding → Recall@5 ≥ 80%

Phase 3 — 云端检索
  service_role 正确 → Supabase rag_chunks 含 1024 维
  rag:verify:m0 -- --full → demo harness:smoke

Phase 4 — 生产收紧（可选）
  session RLS 绑 auth.uid()
  IVFFlat 索引调优
  智谱 / BGE-M3 私有化对照
```

### 6.3 Skill 升级清单（待 E1/E2 后）

| 升级项 | 改哪里 |
|--------|--------|
| 更新通过线数字 / 模型名 | `eval-embedding-cn.mjs` + skill `reference.md` |
| 新增 namespace（如 `visual` 场景包） | DDL migration + `chunk-*.mjs` + `05-rag-system.md` §2.2 |
| Dialogue prompt 注入格式变更 | `rag-service.js` + `prompts.js`（需 golden 回归） |
| 恢复后端 checklist 勾完 | skill `reference.md` + 工程计划状态列 |

---

## 7. 代码落点速查

```text
shadow-corpus/
├── docs/rag-agent-architecture.md          # 本文
├── 02-technical-design/05-rag-system.md    # 全链路技术方案（细节）
├── docs/plans/2026-06-14-rag-engineering-plan.md
├── packages/rag-kit/                       # 共享检索包
│   ├── lib/
│   │   ├── config.mjs          # env 合并 · provider 解析
│   │   ├── embed.mjs           # 统一 embed 入口
│   │   ├── embed-local.mjs     # Xenova ONNX
│   │   ├── retrieve.mjs        # hybrid 检索
│   │   ├── score-rules.mjs     # 规则分
│   │   ├── local-index.mjs     # JSON 镜像
│   │   ├── supabase-client.mjs # 双写 upsert/fetch
│   │   ├── chunk-world.mjs · chunk-repo.mjs
│   │   ├── world-pool.mjs      # Fate query + refine
│   │   ├── session-index.mjs · trace-index.mjs
│   │   └── ...
│   ├── scripts/                # embed-* · eval · query · index-runs
│   └── INTEGRATION.md            # demo 接入缝
├── world/schema/002_rag_embeddings.sql
├── archive/demo-v0.2/lib/
│   ├── rag-service.js          # 唯一运行时适配层
│   └── rag-bootstrap.js        # 启动探测 + 后台 embed:local
└── skills/shadow/rag-kit/      # Agent skill 源码

根目录
├── package.json                # rag:* 脚本
└── scripts/verify-rag-m0.mjs   # M0 验收
```

---

## 8. 验收命令

```bash
# 工程包基线（无 API）
npm run rag:install
npm run rag:embed:local
npm run rag:query -- --json "Final 规则是什么？"
npm run rag:verify:m0
npm test && npm run test:golden

# 本地向量
npm run rag:embed:vectors
npm run rag:eval:local

# 全量（需密钥）
npm run rag:embed:world && npm run rag:embed:repo
npm run rag:eval:embedding
npm run rag:verify:m0 -- --full
npm run harness:smoke
```

---

## 9. 风险与缓解

| 风险 | 缓解 |
|------|------|
| Embedding API 不可用 | `RAG_ENABLED=false` 或 `RAG_EMBEDDING_FALLBACK=local` |
| 向量跨 run 泄漏 | session 强制 `run_id` filter + RLS 规划 |
| Fate 可复现性破坏 | 向量只缩池；抽样仍 deterministic hash |
| 全 repo 索引噪声 | 默认 `namespace=harness`；metadata 标 stage |
| Dialogue 幻觉时代知识 | prompt 硬约束 + 必须 `source_url` |
| anon JWT 误填 service_role 位 | `verify-rag-m0` 解码 JWT role 探针 |

---

## 10. 相关阅读（按优先级）

1. [`02-technical-design/05-rag-system.md`](../02-technical-design/05-rag-system.md) — 技术方案全文
2. [`docs/plans/2026-06-14-rag-engineering-plan.md`](./plans/2026-06-14-rag-engineering-plan.md) — 工程计划与暂停/恢复决策
3. [`packages/rag-kit/INTEGRATION.md`](../packages/rag-kit/INTEGRATION.md) — demo 接入缝
4. [`packages/rag-kit/README.md`](../packages/rag-kit/README.md) — 包内快速开始
5. [`skills/shadow/rag-kit/SKILL.md`](../skills/shadow/rag-kit/SKILL.md) — Agent 操作手册
6. [`02-technical-design/03-fate-agent-and-world-db.md`](../02-technical-design/03-fate-agent-and-world-db.md) — Fate 业务表
7. [`02-technical-design/02-p0-memory-reflection-replan.md`](../02-technical-design/02-p0-memory-reflection-replan.md) — memory 规则检索前身

---

*文档版本：2026-06-14 · 与 RAG 工程 agent 交付对齐*
