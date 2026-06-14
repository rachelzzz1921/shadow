# Shadow UI 设计文档

**版本：** 2026-06-14 · **状态：** draft（G-N1 叙事签字前）  
**关联 Skill：** `frontend-ui-engineering`（实现）· `shadow-router` → 改 `docs/` 与 `public/` UI 时首选  
**变更追踪：** CHG-V001 · 会话 2026-06 视觉寻源与 Demo 接入

---

## 1. 文档目的

本文件把 Shadow 平行人生 Demo 的 **UI/UX 决策、已实现界面、视觉分层、素材包与待审项** 收拢为一处，供产品、叙事、视觉与工程对齐。

**不在本文范围：** LLM prompt 协议、eval rubric、后端 API 契约（见 `02-technical-design/`）。

---

## 2. 产品定位与用户旅程

### 2.1 一句话

Shadow 让用户在 **七年平行人生** 中逐年回放影子的选择；在 **pivotal 年** 可介入岔路口；任意时刻可打开 **跨时空对话** 与记忆流。

### 2.2 主旅程（静态 Mock 已可跑通）

```
Landing（选故事线）
  → Persona 人格卡 teaser
  → 进入七年（1–7 年卡片）
      → 每年：环境标签 + 六域主题 + 像素场景 + Agent 面板
      → pivotal 年：介入弹窗（PIVOTAL · 关键切口）
  → Final 七年后的回信
  → 可选：与 Shadow 对话 / 记忆流展开
```

**旁路入口：**

| 入口 | 文件 | 说明 |
|------|------|------|
| Intake 三层采集 | `docs/intake.html` | profile → Persona agent（Mock / Live 桥接） |
| Live 生成 | `docs/demo-live.html` | 需 archive demo + API key |
| Phaser 布局预览 | `docs/demo-phaser.html` | 七年 layout + CC0 纹理 |
| Demo Hub | `docs/demo-hub.html` | 各入口聚合 |
| 团队看板 | `docs/index.html` | GitHub Pages 首页 + 预览链接 |

### 2.3 运行模式与 UI 差异

| 模式 | 数据源 | UI 行为 |
|------|--------|---------|
| **静态 Mock** | `demo-stories.js` · LOCAL_STORIES | 介入写入 session，**不**重生成叙事 |
| **Live session** | `/api/story/*` | 介入进入下一年 agent 上下文 |
| **Phaser 预览** | `demo-layouts-v1.json` | 仅视觉/layout，无叙事引擎 |

静态 Demo **不需要 API key**。

---

## 3. 设计原则

1. **叙事优先，像素服务情绪** — 素材按 `visual_anchor` 选材，不当装饰背景乱铺（见 `scene-briefs.md`）。
2. **契约可见** — UI 直接渲染 Harness 字段（`memory_stream`、pivotal、environment、scenario 等），方便评审与 eval。
3. **分层占位、人审后合并** — v1 寻源包用 draft layout + overlay 标注 `asset_id`，**不**提前写入主 `assets.csv` / `year-*.layout.json`。
4. **六域通用 + 故事专用并行** — `universal-life-scenes-v1` 挂 Agent 面板；`fuxduxian-v1` 挂故事 B/A/C 场景。
5. **可读性优先** — 2026-06 一轮字号上调（board、overlay、介入弹窗），避免 8–10px 正文。
6. **可访问基础** — skip link、aria-live 翻页播报、dialog `role="dialog"`、键盘方向键翻页。

---

## 4. 视觉语言（Design System）

### 4.1 美学方向

- **16-bit 浅色暖调 · 信纸质感 · SNES 边框**
- 字体：**Zpix**（像素中文，`docs/assets/fonts/zpix.ttf`）
- 参考标杆：12 CASE 入库 → [`references/aesthetic-cases.md`](./references/aesthetic-cases.md)（Night in the Woods、Celeste、Undertale 等）

### 4.2 设计 Token（`docs/demo-theme.css`）

| Token | 用途 | 示例值 |
|-------|------|--------|
| `--paper` / `--paper-deep` | 页面底色、信纸纹理 | `#f7f0e3` / `#ebe3d1` |
| `--ink` / `--ink-soft` / `--ink-muted` | 正文层级 | `#3a3228` → `#9a8b78` |
| `--amber` 系 | 主 CTA、链接、高亮 | `#c8863a` |
| `--sage` 系 | Agent / 成功态 | `#7da87a` |
| `--panel` + `.snes` | 卡片边框（内高光 + 外阴影） | 3px step 边框 |
| `--ease-pixel` | 像素步进动画 | `steps(4, end)` |

### 4.3 六域主题色（`docs/demo-scenarios.js`）

每年卡片按 **scenario**（亲情/爱情/友情/学业/事业/自我成长）动态换肤：

- 各域独立 `paper` / `accent` / `glow` / `wipe` 色板
- Cool School B 层 48px 切片作域图标（CC0 替代 Kenney 角色包）
- 域切换带 **transition**（door / pulse / wave 等）与 walkLine 文案

### 4.4  chrome 组件

| 类名 | 用途 |
|------|------|
| `.snes` | 外凸面板（人格卡、Agent 卡、Final 信） |
| `.snes-inset` | 内凹区域（对话正文、场景 tag） |
| `.btn-start` | Landing 主 CTA |
| `.modal-cutin` | 介入 / 对话弹窗入场 |
| `.pixel-scene` | 年卡片主视觉容器 |
| `.visual-layout-overlay` | fuxduxian-v1 底部 layout 标注 |
| `.universal-asset-overlay` | uni-v1 顶部 Agent 素材标注 |

---

## 5. 信息架构与页面结构

### 5.1 静态叙事 Demo（`docs/demo.html`）

```
#viewport > #slider
├── #p-landing          选线 + 六域图例 + 人格 teaser + 进入 CTA
├── #p-year-1 … 7       逐年卡片（动态生成）
└── #p-final            七年后的回信

浮层：
├── #intervention-modal   PIVOTAL 介入
├── #dialog-overlay       Shadow 对话
├── #nav-prev / #nav-next 翻页
└── #page-indicator       顶部年点导航
```

**脚本加载顺序：**

`demo-scenarios.js` → `demo-data.js` → `demo-stories.js` → `demo-visual.js` → `demo-scene-textures.js` → `demo-universal-assets.js` → `demo-transitions.js` → `demo-engine.js`

### 5.2 年卡片内容块（`demo-engine.js`）

| 区块 | 契约字段 | 说明 |
|------|----------|------|
| 年号标题 | `year`, `title`, `is_pivotal` | pivotal 带 ◆ 标记 |
| 时代条 | `environment`, `city`, era snippet | 2006–2026 中国语境 |
| 像素场景 | `environment`, `scene`, `pose`, `scenario` | CSS 场景 + 双 overlay |
| 情绪条 | `new_mood`, `new_esteem` | 10 分制进度 |
| 叙事正文 | `narrative`, `inner_voice` | 主文案 + 内心独白 |
| Agent 面板 | `memory_stream` 按域过滤 | 六域折叠卡 |
| 底部操作 | — | 「与 Shadow 对话」「◇ 记忆流」 |

### 5.3 Pivotal 介入 UI

- 触发：`is_pivotal === true` 且首次进入该年
- 文案：`intervention.question` + 2 选项按钮
- 脚注：Mock 模式说明 + **跳过**
- 视觉：全屏 dim + `.intervention-card.snes` 居中（标签 **PIVOTAL · 关键切口**）

复读线 pivotal 年：**1 / 4 / 6**（见 `04-ux-flow.md`）。

---

## 6. 视觉呈现分层（A / B / C）

定义见 [`04-ux-flow.md`](./04-ux-flow.md)。

| 类型 | 含义 | UI 挂载点 | 素材包 |
|------|------|-----------|--------|
| **B** 特殊场景 | 每年 1 张主景 | layout `background` + `layers` | fuxduxian-v1 |
| **A** daily loop | 2–4 帧轻动画 | layout `daily_loops` | fuxduxian-v1 |
| **C** sequence | 3–5 步短片 | layout `sequence`；介入前后 | fuxduxian-v1 |

### 6.1 复读线七年 visual_anchor

| 年 | B 场景 | A loop | C |
|----|--------|--------|---|
| 1 pivotal | 雨天最后一排靠窗 | 翻书 | 进教室→落座→侧目 |
| 2 quiet | 查分夜撕准考证 | 撕纸 | — |
| 3 quiet | 食堂角落 | 慢吃 | — |
| 4 pivotal | 舞台侧幕领带打反 | 改稿 | 上台→笑→灯亮 |
| 5 quiet | 凌晨 4:03 | 睁眼 insomnia | — |
| 6 pivotal | 出站雨棚 | 抱行李 | 眼神不在→火车窗 |
| 7 quiet | 邮局小窗 | 写字 | 递信→字真好看 |

详表：[`stories/fuxduxian/scene-briefs.md`](./stories/fuxduxian/scene-briefs.md)

### 6.2 双 overlay 架构（静态 Demo）

```
.pixel-scene
├── .scene-backdrop / .scene-floor / .sprite   ← CSS 程序化场景（即时可玩）
├── .visual-layout-overlay（底部）              ← fuxduxian-v1 draft layout 元数据
└── .universal-asset-overlay（顶部）            ← 六域 Agent 槽位 PX-UNI-*
```

- **底部 overlay**（`demo-visual.js`）：读 `demo-layouts-v1.json` + `fuxduxian-v1-manifest.json`，显示 anchor、mood、B/A/C asset_id、授权 tier。
- **顶部 overlay**（`demo-universal-assets.js`）：读 `universal-agent-ui-map.json`，按当前年 `scenario` 显示 background/prop/fx/ui 四槽。

`?legacy=1` 回退旧 `demo-layouts.json`（PX-PLACEHOLDER 时代）。

---

## 7. 素材包与 Layout

### 7.1 fuxduxian-v1（故事专用 · 42 行 CSV）

| 项 | 路径 |
|----|------|
| 寻源说明 | `registry/fuxduxian-sourcing-notes.md` |
| 候选表 | `registry/packs/fuxduxian-v1.csv` |
| Manifest | `registry/packs/fuxduxian-v1-manifest.json` |
| Draft layout ×7 | `scenes/fuxduxian/draft/year-*.layout.json` |
| 打包输出 | `docs/demo-layouts-v1.json` · `docs/fuxduxian-v1-manifest.json` |
| CC0 已下载 | Cool School tileset、rain PNG → `docs/visual-assets/` |

**授权 tier：** `cc0_ready` · `cc0_pending` · `license_pending`（LimeZu / Reakain 等仅候选）

**Gate：** 人审前 **不** 合并 `registry/assets.csv` 与 `scenes/fuxduxian/year-*.layout.json`。

### 7.2 universal-life-scenes-v1（六域通用 · 96 行 CSV）

| 项 | 路径 |
|----|------|
| 寻源说明 | `registry/universal-life-scenes-sourcing-notes.md` |
| 候选表 | `registry/packs/universal-life-scenes-v1.csv` |
| Agent 槽位映射 | `registry/packs/universal-agent-ui-map.json` |
| Manifest | `registry/packs/universal-life-scenes-v1-manifest.json` |
| 打包输出 | `docs/universal-agent-ui-map.json` · `docs/universal-life-scenes-v1-manifest.json` |

**筛选规则：** 按 `story_tags` + `type`；跨故事通用；排除 Pinterest / Pixilart 等不可商用源。

六域 Agent 槽位（每域）：`background` · `prop` · `fx` · `ui`

### 7.3 Phaser 引擎（可选完整渲染）

- 脚手架：`visual/engine/`（`shadow-scene.mjs` · `load-layout.mjs` · `validate-layout.mjs`）
- 预览页：`docs/demo-phaser.html` + `demo-phaser-v1.js`
- Schema：`03-layout-schema.json`
- 校验：`npm run validate:visual-draft`（7/7 draft OK）

---

## 8. 故事线与 Mock 数据

| 故事线 | 主角 | 主域 | 数据 |
|--------|------|------|------|
| 复读线（默认） | 影 · 阿岚 | 学业 | `demo-stories.js` fuxduxian |
| 出国读研线 | 影 · 林晚 | 事业 | LOCAL_STORIES |
| 心动爱情线 | 影 · 许星遥 | 爱情 | LOCAL_STORIES |
| 插画师线 | 影 · 周染 | 自我成长 | LOCAL_STORIES |

Landing **story-picker** 切换线；六域 **scenario-legend** 展示 Agent 分工。

---

## 9. 部署与预览

### 9.1 本地

```bash
npm run build:visual-demo   # layout + manifest → docs/
npm run demo:preview        # http://localhost:5199/demo.html
```

### 9.2 GitHub Pages

| 页面 | URL |
|------|------|
| 静态叙事 Demo | https://rachelzzz1921.github.io/shadow/demo.html |
| Phaser layout v1 | https://rachelzzz1921.github.io/shadow/demo-phaser.html |
| legacy 占位 | https://rachelzzz1921.github.io/shadow/demo-phaser.html?legacy=1 |
| 团队看板 | https://rachelzzz1921.github.io/shadow/ |

**CI：** `.github/workflows/pages.yml` 在 `docs/**` 与 visual draft 变更时跑 `build-visual-demo-pack.mjs`。  
**规则：** `.cursor/rules/github-pages-deploy.mdc` — docs/visual 改动后及时 push。

### 9.3 看板站点集成

- `site.config.json` · `site.board.json`：`staticDemo` + `phaserDemo` 链接
- `build-board-site.mjs` + `board-site.template.html`：Visual/Corpus 预览区（字号已加大）

---

## 10. 已完成工作清单（2026-06 会话汇总）

### 10.1 视觉模块骨架（CHG-V001）

- [x] `visual/` 目录与 pipeline 文档（01–04）
- [x] 12 审美标杆 CASE
- [x] Phaser engine 脚手架 + layout schema + validator
- [x] 7× 主 layout 占位（PX-PH-*）+ 7× **draft v1**（PX-FDX-*）
- [x] `assets.csv` 30 行占位 + 寻源指南

### 10.2 fuxduxian-v1 UI 接入

- [x] 42 行候选 CSV + manifest（三级授权）
- [x] draft/year-1..7.layout.json 对齐 scene-briefs
- [x] `build-visual-demo-pack.mjs` → docs 打包
- [x] `demo-visual.js` overlay + v1/legacy 切换
- [x] `demo-phaser-v1.js` + CDN fallback（unpkg）
- [x] `validate:visual-draft` 脚本

### 10.3 universal-life-scenes-v1 UI 接入

- [x] 96 行 CSV manifest 构建（修复 CSV 解析 48→96）
- [x] `universal-agent-ui-map.json` 六域四槽映射
- [x] `demo-universal-assets.js` 顶部 overlay
- [x] `.cursor/rules/universal-life-scenes.mdc` 使用规则

### 10.4 Demo UX 抛光

- [x] 六域主题系统 `demo-scenarios.js` + `demo-scenarios.css`
- [x] 场景纹理 `demo-scene-textures.js`
- [x] 翻页过渡 `demo-transitions.js`
- [x] UI polish 两轮 CSS（`demo-ui-polish.css` · `demo-ui-polish-r2.css`）
- [x] 字号可读性修复（board template、overlay、弹窗）
- [x] Intake / Live / Hub 入口互联

### 10.5 发布修复

- [x] GitHub Pages `demo-phaser.html` 404 → push v1 资产 + legacy fallback
- [x] `site.config.json` `githubPagesBase` 统一

---

## 11. 待办与人审 Gate

| 优先级 | 项 | 负责 | Gate |
|--------|-----|------|------|
| P0 | 叙事 v2 终稿 | P2 | G-N1 |
| P0 | draft layout 人审 → 合并主 layout + assets.csv | P2 + 视觉 | G-N1 |
| P1 | 下载 cc0_pending（BTL / Kenney）到 `visual/assets/raw/` | 视觉 | — |
| P1 | license_pending 素材授权确认 | 视觉 | — |
| P2 | Phaser 完整 A/C 动画播放（非 overlay 文字） | 工程 | post-G-N1 |
| P2 | Live Demo StepFun/DashScope `.env` 本地配置 | 工程 | 可选 |
| P3 | 真实像素替换 CSS 程序化 `.pixel-scene` | 视觉 | post-merge |

人审表：[`stories/fuxduxian/visual-review-checklist.md`](./stories/fuxduxian/visual-review-checklist.md)

---

## 12. 文件地图（UI 相关）

```
docs/                              ← GitHub Pages 静态站点
├── demo.html                      主叙事 Demo
├── demo-theme.css                 设计 token + SNES chrome
├── demo-scenarios.js/css          六域主题
├── demo-engine.js                 页面生成 / 导航 / 介入 / 对话
├── demo-visual.js                 fuxduxian-v1 overlay
├── demo-universal-assets.js         uni-v1 overlay
├── demo-phaser.html + demo-phaser-v1.js
├── demo-layouts-v1.json             打包的 draft layouts
├── fuxduxian-v1-manifest.json
├── universal-agent-ui-map.json
├── universal-life-scenes-v1-manifest.json
└── visual-assets/                   CC0 预览纹理

shadow-corpus/visual/              ← 视觉源真相
├── 04-ux-flow.md                  A/B/C 流程
├── 05-ui-design-document.md       本文件
├── registry/packs/                CSV + manifest + ui-map
├── scenes/fuxduxian/draft/        人审前 layout
└── engine/                        Phaser 渲染

shadow-corpus/tooling/scripts/
├── build-visual-demo-pack.mjs
└── build-universal-manifest.mjs
```

---

## 13. 验收标准（UI 侧）

- [ ] 静态 Demo 断网可完整走通阿岚七年（含 3 次 pivotal）
- [ ] 六域主题在切换故事线/年份时正确换肤
- [ ] fuxduxian-v1 overlay 七年均显示正确 anchor 与 asset_id
- [ ] uni-v1 overlay 与当前 scenario 槽位一致
- [ ] 介入弹窗可键盘操作、可跳过、选择写入 session
- [ ] Phaser 预览七年切换无 404（Pages 与本地）
- [ ] 正文字号 ≥ 12px（Zpix 基准），overlay 标注 ≥ 10px
- [ ] G-N1 后人审 draft → 主 layout 合并并完成 visual-review-checklist

---

## 14. 相关文档索引

| 文档 | 内容 |
|------|------|
| [`01-shadow-product-requirements.md`](../01-requirements/01-shadow-product-requirements.md) | 产品目标与验收 |
| [`02-intervention-requirements.md`](../01-requirements/02-intervention-requirements.md) | 介入设计 |
| [`03-demo-file-map.md`](../02-technical-design/03-demo-file-map.md) | Live demo 代码地图 |
| [`04-ux-flow.md`](./04-ux-flow.md) | A/B/C 与用户流程 |
| [`scene-briefs.md`](./stories/fuxduxian/scene-briefs.md) | 复读线场景 brief |
| [`visual-review-checklist.md`](./stories/fuxduxian/visual-review-checklist.md) | 人审清单 |
| [`CHG-V001` progress](../06-task-progress/changes/CHG-V001-visual-fuxduxian/progress.md) | 变更进度 |

---

*维护：视觉或 Demo UI 有大改时同步更新本节与 §10 清单。*
