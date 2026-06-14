# Cursor 任务提示词：Extended Scenes 素材库 + 视觉排版 Agent

> **复制整段给 Cursor Agent 使用。** 本任务把 `extended-scenes-v1`（39 条）整理成 Excel 分类表、入库 Supabase，并实现「上游 Agent 输入年度际遇 → 本 Agent 查表生成 layout JSON」的链路。

---

## 0. 任务目标（读完再动手）

Shadow 平行人生 Demo 的视觉层需要第二个 Agent：

```
[Year Narrative Agent]          [Visual Layout Agent — 你要做的]
  输入：profile + 第 N 年叙事       输入：上一 Agent 的 year payload
  输出：year JSON（际遇/情绪/域）  输出：符合 03-layout-schema.json 的 layout
                                  数据源：extended + universal 素材 Excel/Supabase
```

**终极效果：** 叙事 Agent 给出「这一年发生了什么」，视觉 Agent 结合素材库选出 `asset_id`、叠层、转场 FX，输出可给 Phaser / 静态 Demo 消费的 **描述排版图**（layout JSON + visual_anchor 文案）。

---

## 1. 必读文件（按顺序）

| 顺序 | 路径 | 内容 |
|------|------|------|
| 1 | `shadow-corpus/visual/registry/extended-scenes-sourcing-notes.md` | 7 大盲区说明、Mana Seed / Cainos / karsiori 选用原则 |
| 2 | `shadow-corpus/visual/registry/packs/extended-scenes-v1.csv` | 39 条原始素材（**不重复** universal 96 条） |
| 3 | `shadow-corpus/visual/registry/packs/extended-scenes-v1-enriched.csv` | **已 enrich 主表**（含 category、license、ui_ready） |
| 4 | `shadow-corpus/visual/registry/packs/extended-scenes-v1-sheets/*.csv` | **8 张分类子表**（Excel 打开即用） |
| 5 | `shadow-corpus/visual/registry/packs/universal-life-scenes-v1.csv` | 前置 96 条（室内/城市/雨 FX 等） |
| 6 | `shadow-corpus/visual/03-layout-schema.json` | layout 输出 JSON Schema |
| 7 | `shadow-corpus/visual/04-ux-flow.md` | A/B/C 视觉类型与流程 |
| 8 | `shadow-corpus/visual/05-ui-design-document.md` | Demo UI 总文档 |
| 9 | `shadow-corpus/visual/registry/packs/extended-layout-agent-map.json` | Agent 选材规则映射 |

**构建命令（若文件缺失）：**

```bash
node shadow-corpus/tooling/scripts/build-extended-scenes-pack.mjs
```

---

## 2. UI 接入硬规则（必须遵守）

### 2.1 四季时间流逝 — Mana Seed 套件

- **首选全套：** `PX-EXT-001` ~ `PX-EXT-006`（同作者 Seliel，风格不漂移）
- **天气叠层：** `PX-EXT-001` Weather Effects（雪/雨/落叶/闪电）
- **主角统一：** `PX-EXT-021` Mana Seed Character Base（免费商用，跨四季同一形象）
- **辅助：** `PX-EXT-038` RPG Starter Pack 作低风险原型底图

**禁止：** 同一场景混用 Mana Seed 地形 + Icarus/Maru 地形做主底（`PX-EXT-007/008` 仅 candidate）

### 2.2 城乡对比 — 亲情老家

- **农村：** `PX-EXT-010`~`012`（Cainos Village + Basic 地形）
- **城镇抽象：** 现有 `PX-UNI-007` Kenney Tiny Town
- **叠加逻辑：** Basic 做田野底 → Village 做建筑层 → Tiny Town 做章节地图转场

### 2.3 深夜 / 内省 / 失眠 — 叠层而非重建室内

- 保留 universal 室内底图（如 `PX-UNI-002` 客厅）
- **叠：** `PX-EXT-014` 或 `PX-EXT-015` 夜空 + `PX-EXT-029` LPC 浓雾
- 可选：`PX-EXT-030` CC0 星空动画

### 2.4 节庆 — 直接商用（不等人审）

- `PX-EXT-017` karsiori 春花 CC0
- `PX-EXT-018` karsiori 灯笼 CC0（春节/中秋）

### 2.5 通勤车厢内景

- `PX-EXT-020` KR Transportation（$16.99，授权明确）
- 配合 `PX-UNI-014` 站台外观、`PX-EXT-034` 路面交通工具道具

### 2.6 年份转场

- **每个** year N → year N+1 之间使用 `PX-EXT-033` 类像素擦黑/幕布 FX
- 在 layout 的 `sequence` 或独立 `transition` 字段标注

### 2.7 授权门禁

| license_tier | 能否上 UI |
|--------------|-----------|
| `cc0_ready` | ✅ 原型 + 生产 |
| `mana_seed_license` | ✅ 原型 + 生产（遵守 User License，不可再分发单资产） |
| `paid_commercial` | ✅ 购买后（`PX-EXT-010` $39.99、`PX-EXT-020` $16.99） |
| `attribution_required` | ⚠️ 署名后可用（LimeZu `PX-EXT-036/037`） |
| `review_required` | ❌ **仅 candidate**，不进生产 UI |

---

## 3. Excel 整理要求（你要完成 / 验证）

### 3.1 已有产物

运行 `build-extended-scenes-pack.mjs` 后应有：

```
packs/extended-scenes-v1-enriched.csv          ← 主表 39 行
packs/extended-scenes-v1-sheets/
  01_四季气候FX.csv          (9)
  02_乡镇农村老家.csv        (3)
  03_公园星夜天空.csv        (5)
  04_地铁高铁车厢.csv        (2)
  05_节庆文化道具.csv        (3)
  06_书店学习空间.csv        (3)
  07_角色表情氛围.csv        (8)
  08_转场UI辅助.csv          (6)
```

### 3.2 你需要补充的 Excel 列（若尚未有则加列并回写 CSV）

在 enrich 表基础上，为 **每一张素材** 补全以下「排版 Agent 专用」字段：

| 列名 | 说明 | 示例 |
|------|------|------|
| `visual_anchor_template` | 一句画面锚点模板（可含 `{character}` `{season}`） | 「{season}雨夜，{character}在最后一排靠窗」 |
| `default_layer_stack` | 推荐 Z 序：`background→prop→character→fx` | `PX-EXT-003>PX-EXT-001>PX-EXT-021` |
| `parallax_suggest` | 背景视差 0–1 | `0.15` |
| `animation_keys` | 可用动画 id | `idle,walk,sleep` |
| `domain_fit` | 六域匹配 | `family,academic,self_growth` |
| `year_phase_fit` | 七年节奏 | `pivotal,quiet,final,transition` |
| `combo_id` | 推荐组合包 id | `mana_seed_four_seasons` |
| `reject_if_mood` | 禁用 mood | `celebration`（勿叠浓雾） |

**交付：** 更新 `extended-scenes-v1-enriched.csv` + 8 张子表；可选导出 `extended-scenes-v1.xlsx`（多 sheet 工作簿，用 `xlsx` 库或 Excel 手动合并）。

### 3.3 与 universal 包的关系

- extended **不重复** universal 已有条目
- 生成 layout 时 **两表联合查询**：先 universal 满足室内/城市基础，extended 补季节/农村/节庆/车厢/夜空
- 合并主表建议路径：`packs/shadow-visual-master-enriched.csv`（135 行 = 96 + 39，加 `pack_id` 列）

---

## 4. Supabase 入库

### 4.1 项目地址与凭证

- **Dashboard：** `https://dkskgnlrlcyvfxhngxib.supabase.co`（项目 ref: `dkskgnlrlcyvfxhngxib`）
- **凭证文件：** `shadow-corpus/world/.env`（**勿提交 git**）
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`（必须用 service_role，不是 anon）

参考模板：`shadow-corpus/world/.env.example`

### 4.2 迁移 SQL

执行：

`shadow-corpus/world/supabase/migrations/20260614_visual_assets.sql`

创建表：

- `visual_assets` — 素材 registry（从 enriched CSV seed）
- `visual_layouts` — Agent 输出的逐年 layout

**应用方式（二选一）：**

1. Supabase Dashboard → SQL Editor → 粘贴执行  
2. 本地 `supabase link` 后 `supabase db push`

### 4.3 Seed 脚本

```bash
# 1. 确保 migration 已应用
# 2. 确保 world/.env 有 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
cd shadow-corpus/world
node scripts/seed-visual-assets.mjs
```

可选环境变量：`VISUAL_CORPUS_VERSION=2026.06.14-ext-v1`

### 4.4 查询示例（Layout Agent 用）

```sql
-- 按 story_tags + ui_ready 筛选春季爱情场景
select asset_id, name, usage_case, layout_role, pairs_with
from visual_assets
where pack_id = 'extended-scenes-v1'
  and ui_ready in ('prototype_ready', 'approved')
  and story_tags && array['爱情', '春天']
order by category_id, asset_id;

-- 写入生成结果
insert into visual_layouts (story_id, year, session_id, narrative_input, layout, visual_anchor, asset_ids, transition_fx_id)
values (
  'fuxduxian', 1, 'sess_xxx',
  '{"scenario":"academic","mood":"退缩","event":"复读班最后一排"}'::jsonb,
  '{ ... }'::jsonb,
  '雨天，最后一排靠窗，书包在空桌',
  array['PX-EXT-001','PX-EXT-002','PX-EXT-021','PX-UNI-023'],
  'PX-EXT-033'
);
```

---

## 5. Visual Layout Agent 实现（你要写的代码）

### 5.1 建议路径

```
shadow-corpus/visual/agent/
├── layout-generator.mjs      # 主入口
├── asset-selector.mjs        # Supabase / CSV 选材
├── layout-composer.mjs       # 输出 03-layout-schema 合规 JSON
└── prompts/layout-system.md  # system prompt
```

或挂到 `example/shadow-demo/lib/` 若需与 Live session 同栈。

### 5.2 输入契约（来自 Year Narrative Agent）

```json
{
  "story_id": "fuxduxian",
  "year": 3,
  "session_id": "uuid",
  "scenario": "academic",
  "scenario_secondary": ["family"],
  "is_pivotal": false,
  "environment": "canteen",
  "mood_visual": "灰冷·孤独",
  "season_hint": "autumn",
  "event_summary": "一个人吃饭，开始接受不是最好的那个",
  "inner_voice": "没去加任何社团",
  "memory_id": "m3",
  "intervention": null
}
```

### 5.3 输出契约（`03-layout-schema.json`）

必须包含：

- `story_id`, `year`, `scene_type`（special / daily / pivotal_sequence）
- `visual_anchor`（中文一句，来自 usage_case 模板化）
- `background.asset_id` + `layers[]`（role: protagonist/npc/prop/fx）
- `daily_loops[]`（quiet 年 A 类）
- `sequence[]`（pivotal 年 C 类）
- **year transition：** 在 year>1 时附加 `transition_fx_id: "PX-EXT-033"`

### 5.4 选材算法（伪代码）

```
1. 加载 visual_assets WHERE ui_ready != 'candidate_only'
2. 按 scenario → story_tags 交集打分
3. 若 season_hint 存在 → 优先 Mana Seed 套件 PX-EXT-001~005 + PX-EXT-021
4. 若 mood 含 迷茫/失眠/内省 → 叠 PX-EXT-014|015 + PX-EXT-029
5. 若 story_tags 含 春节|中秋 → 加 PX-EXT-018 prop
6. 若 environment 含 地铁|通勤 → background = PX-EXT-020
7. 若 story_tags 含 老家|农村 → background = PX-EXT-012 + layers PX-EXT-010
8. 否则 fallback universal 包同 type 最高分条目
9. 校验 pairs_with 组合完整性
10. 输出 layout JSON → upsert visual_layouts
```

### 5.5 LLM Prompt 要点（system）

```
你是 Shadow 视觉排版 Agent。你只输出 JSON，符合 03-layout-schema.json。
你从 Supabase visual_assets 选材，asset_id 必须存在且 ui_ready 非 candidate_only。
四季场景必须用 Mana Seed 系列（PX-EXT-001~006）+ 主角 PX-EXT-021。
城乡对比：农村 PX-EXT-010~012，城镇 PX-UNI-007。
失眠内省：叠夜空 PX-EXT-014/015 + 浓雾 PX-EXT-029，不替换室内底图。
春节中秋：PX-EXT-017/018 直接可用。
年份之间：transition 用 PX-EXT-033。
visual_anchor 必须含：季节或时间 + 角色位置 + 关键物件。
```

---

## 6. Demo UI 接线（可选但推荐）

1. `npm run build:extended-scenes` — 打包 manifest → `docs/extended-scenes-v1-manifest.json`
2. 新建 `docs/demo-extended-assets.js` — 类似 `demo-universal-assets.js`，读 extended manifest 叠层
3. 在 `demo-engine.js` 的 `buildPixelScene` 后调用 extended overlay
4. **不合并** 主 `assets.csv` 直到人审通过

---

## 7. 验收清单

- [ ] `extended-scenes-v1-enriched.csv` 39 行，8 分类子表齐全，每行有 `visual_anchor_template`
- [ ] Supabase `visual_assets` 表存在且 seed 39 行成功
- [ ] `layout-generator` 对 mock year input 输出合法 JSON（过 `validate-layout.mjs`）
- [ ] 四季场景只用 Mana Seed 套件 + PX-EXT-021 主角
- [ ] 年份转场含 PX-EXT-033
- [ ] `review_required` 素材未出现在生产 layout
- [ ] `visual_layouts` 可查询、可 replay 到 demo-phaser

---

## 8. 不要做的事

- ❌ 不要把 `review_required` 素材直接渲染到 GitHub Pages
- ❌ 不要重复录入 universal 已有 96 条到 extended 表
- ❌ 不要把 Supabase service_role key 提交 git
- ❌ 不要在 G-N1 叙事签字前 merge 进主 `assets.csv` / `year-*.layout.json`

---

## 9. 相关 npm 脚本（请添加到根 package.json）

```json
{
  "build:extended-scenes": "node shadow-corpus/tooling/scripts/build-extended-scenes-pack.mjs",
  "seed:visual": "node shadow-corpus/world/scripts/seed-visual-assets.mjs",
  "validate:visual-draft": "node shadow-corpus/visual/engine/src/validate-layout.mjs shadow-corpus/visual/scenes/fuxduxian/draft"
}
```

---

## 10. 完成后汇报格式

```markdown
## Extended Scenes + Layout Agent 完成报告

### Excel
- 主表路径 + 行数
- 8 张子表路径

### Supabase
- migration 是否应用
- seed 行数 + 查询样例

### Layout Agent
- 入口命令 / API
- 样例输入 → 样例 layout JSON

### Demo
- 预览 URL（本地 5199 / GitHub Pages）

### 待人工
- 需购买素材清单
- 需核实授权清单
```

---

*本提示词版本：2026-06-14 · 维护者：Shadow visual 模块*
