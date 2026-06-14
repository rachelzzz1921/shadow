# World — 2006–2026 中国大陆时代语料库

Shadow **命运 Agent** 的数据层。语料必须 **真实、可溯源**；运行时按 **权重 + run_id** 抽样。

## 快速开始

```bash
cd shadow-corpus/world
npm install
cp .env.example .env   # 填入 Supabase（seed 时需要）

# 生成本地 JSON（21 年）
npm run generate

# 校验量级与 schema
npm run validate

# 试跑六域权重（复读线 profile）
node scripts/demo-fate-weights.mjs

# NotebookLM 合并 patch
npm run import-notebooklm

# 本地检索（关键词 / 六域 / 年份）
npm run query -- --q 疫情 --year 2020
npm run query -- --status   # 刷新 data/years/_stats.json

# 写入 Supabase
npm run seed
```

架构总览：[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)  
语义检索：`packages/rag-kit` → `npm run rag:query -- "…" --world`

## 目录

| 路径 | 说明 |
|------|------|
| `schema/001_world_era_library.sql` | Postgres 建表 |
| `schema/era-year.schema.json` | 单年 JSON Schema |
| `lib/era-corpus/` | 分年代真实事件种子（生成器输入） |
| `data/years/` | 冻结输出 `{year}.json` |
| `scripts/generate-era-draft.mjs` | 合并种子 + 模板 → JSON |
| `scripts/seed-supabase.mjs` | JSON → Supabase |

## 单年 JSON 结构

见 `schema/era-year.schema.json`。每 year 至少：

- `macro_events` ≥ 30
- `micro_events` ≥ 80
- `atmosphere` ≥ 15 字段
- `pop_culture` ≥ 10 条
- `sources` ≥ 5 个 URL

## 需求文档

[`01-requirements/03-fate-agent-requirements.md`](../01-requirements/03-fate-agent-requirements.md)

## 版本

语料版本号：`WORLD_CORPUS_VERSION`（默认 `2026.06.14-v1`）。更新语料后 bump 版本并重新 `seed`。

## 六域命运侧重

每条 micro 带 `scenario`（亲情/爱情/友情/学业/事业/自我成长）。

- **子池**：`lib/scenario-pools/` 六文件，每域 35+ 专属 micro，合并后每域 **≥30 条/年**
- **权重**：`sampleFateContext()` 根据 profile + persona 计算 `scenario_weights` 并偏置抽样

详见 [`02-technical-design/04-scenario-weight-system.md`](../02-technical-design/04-scenario-weight-system.md)。
