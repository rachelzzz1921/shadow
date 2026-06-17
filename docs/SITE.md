# Shadow 站点架构与部署规则

> **单一事实来源**：对外 Demo、团队看板、GitHub Pages 路径、Intake 映射、构建命令，以本文为准。  
> 配置基址见 `shadow-corpus/06-task-progress/site.config.json` → `githubPagesBase`。

更新时间：2026-06-16

---

## 1. 页面地图

| 路径 | 文件 | 受众 | 说明 |
|------|------|------|------|
| `/` | `index.html` | **对外** | 首页：Golden 故事卡 +「写我的」CTA + API 状态 |
| `/pitch.html` | `pitch.html` | **对外** | 路演翻页（I Ching「沿路看看」式纵向导览） |
| `/generate.html` | `generate.html` | **对外** | **唯一采集入口**：四层 Intake + Persona + API 七年 + pivotal 介入 |
| `/demo.html` | `demo.html` | **对外** | 七年阅读器（Mock `?story=` / Live `?live=1`） |
| `/demo-phaser.html` | `demo-phaser.html` | 对外/团队 | Visual layout 预览（需 `build:visual-demo`） |
| `/board.html` | `board.html` | **团队** | 任务看板（`npm run board:publish` 生成，勿手改） |
| `/intake.html` | `intake.html` | 兼容 | 301 式跳转 → `generate.html`（保留旧链接） |
| `/demo-hub.html` | `demo-hub.html` | 兼容 | 跳转 → `index.html` |

### 已废弃（勿新建链接）

| 曾用路径 | 替代 |
|----------|------|
| `demo-live.html` | `generate.html` → `demo.html?live=1` |
| `demo-intake.js`（旧三层 UI） | 已删除；统一 `demo-intake-app.js` |
| `index.html` = 看板 | 看板迁至 `board.html`，`/` = 对外首页 |

---

## 2. 推荐用户动线

### 对外访客

```text
首页 (/) 
  ├─ 先感受 → demo.html?story=linwan|heartbeat_line|zhoudran|wufuxdu
  ├─ 路演   → pitch.html → generate.html
  └─ 写自己 → generate.html → [API 七年] → demo.html?live=1
```

### 团队

```text
board.html → Corpus / Visual / 任务库
```

### 裸开 demo.html

无 `?story=` / `?live=1` / `?from=` 时自动跳转 `index.html#stories`，避免与首页重复 landing。

---

## 3. Intake → 下游映射

采集逻辑：`demo-intake-app.js`（`intake.html` 与 `generate.html` 共用）。

### sessionStorage 键

| 键 | 写入时机 | 消费者 |
|----|----------|--------|
| `shadow_full_profile` | 采集完成 | `generate-client`、API `/api/intake/complete` |
| `shadow_persona` | Persona agent | Demo 人格卡预览 |
| `shadow_persona_card` | 同上 | `demo-data.js` landing 覆盖 |
| `shadow_persona_source` | `llm` / `rule_local` / … | 摘要展示 |
| `shadow_intake_request` | 自定义线提交 | `generate-client` → `intakeApiPayloadFromHandoff` |
| `shadow_intake_story_id` | 点选 Golden 预设 | `demo-mock-bridge` 故事切换 |
| `shadow_live_session` | API 完成或规则合成 | `demo-data.js` → `demo.html?live=1` |
| `shadow_visual_character` | 采集完成 | 像素预览 |

### 分支（`routeCustomToDemo` / `handoffToGeneratePipeline`）

1. **在 `generate.html` 完成采集**  
   `ShadowGenerateBridge.onIntakeComplete` → 本页 API 管线（不 reload）→ `demo.html?live=1`

2. **从旧 `intake.html` 链入**  
   跳转 `generate.html?from=intake&autostart=1`，读 session 自动开跑

3. **API 不可用**  
   `ShadowCustomStory.build` 规则合成 → `shadow_live_session` → `demo.html?live=1`

4. **点选 Golden 预设 chip**  
   `ShadowDemoMock` → 对应 `demo.html?story=…`（fixture 主角，非用户自定义）

### API 管线（`generate-client.js` + 服务端 Job）

```text
Intake 摘要确认
  → POST /api/story/jobs（创建后台任务）
  → GET  /api/story/jobs/:id/stream（SSE 订阅进度）
  → pivotal 年完成后 job:awaiting_intervention → 弹窗选介入
  → POST /api/story/jobs/:id/intervention → 续跑下一年
  → job:done → shadow_live_session → demo.html?live=1（自动跳转）
```

断点续跑：`localStorage.shadow_gen_job_id` + `?job_id=` / 恢复面板。

---

## 4. 关键脚本分工

| 文件 | 职责 |
|------|------|
| `demo-intake-app.js` | 四层采集 UI、Persona 推导、handoff |
| `demo-intake-profile.js` | 浏览器端 `buildFullProfile`（与 server `intake-profile` 对齐） |
| `generate-client.js` | API 七年 SSE、介入弹窗、进入 Demo |
| `demo-engine.js` | 七年分页阅读、对话、Mock 介入 |
| `demo-data.js` | 故事数据 + `shadow_live_session` 注入 |
| `demo-hub-status.js` | 首页 API/RAG 状态条 |
| `demo-phaser-v1.js` | Visual layout 渲染 |

---

## 5. 本地开发

```bash
# 完整链路（Mock + API，端口 3000）
npm run demo:local

# 仅静态（5199，无 API）
npm run demo:preview
```

| 页面 | demo:local | demo:preview |
|------|------------|--------------|
| 首页 | `http://localhost:3000/` | 同左 |
| 采集+API | `/generate.html` | Intake UI 可用，API 不可用 |
| Mock 故事 | `/demo.html?story=…` | 同左 |
| 看板 | `/board.html` | 同左 |

API Key：配置 `shadow-corpus/archive/demo-v0.2/.env`（`STEPFUN_API_KEY` 等）。

---

## 6. GitHub Pages 部署规则

### 何时必须 push

改动以下任一项后，**同一会话内** `board:publish`（若涉及 visual/看板）+ commit + `push origin main`：

- `docs/`（页面、JS、CSS、`demo-layouts-v1.json`、`visual-assets/`）
- `shadow-corpus/visual/scenes/fuxduxian/draft/`
- `shadow-corpus/visual/registry/packs/`
- `shadow-corpus/06-task-progress/site.board.json` / `site.config.json`
- 看板构建脚本或 `board-site.template.html`

### 标准流程

```bash
npm run board:publish
git add docs shadow-corpus .github package.json .cursor/rules
git commit -m "…"
git push origin main
```

仅改 visual draft、未改 registry 时，至少：

```bash
npm run build:visual-demo
git add docs shadow-corpus/visual
git commit -m "…"
git push origin main
```

### 构建产物

| 命令 | 输出 |
|------|------|
| `npm run board:publish` | `docs/board.html`、`docs/board-data.json`、`demo-layouts-v1.json`、intake 浏览器包等 |
| `npm run build:visual-demo` | `docs/demo-layouts-v1.json`、manifest、纹理拷贝 |

**勿手改** `board.html` / `board-data.json`（会被 `board:publish` 覆盖）。  
**可手改** `index.html`、`generate.html`、`demo.html`、`pitch.html` 等对外页面。

### 在线 URL（示例仓库）

基址：`https://rachelzzz1921.github.io/shadow`

| 页面 | URL |
|------|-----|
| 首页 | `/` |
| Pitch | `/pitch.html` |
| 采集+生成 | `/generate.html` |
| 叙事 Demo | `/demo.html` |
| Visual | `/demo-phaser.html` |
| 看板 | `/board.html` |

### 禁止

- 只改本地 `docs/` 不 push，然后声称「预览已更新」
- 跳过 `board:publish` / `build:visual-demo` 直接 push 过期的 `board-data.json` 或 layout JSON
- 新建指向 `demo-live.html`、独立 `intake.html` 采集流的对外链接（兼容跳转除外）

---

## 7. 改页面时的检查清单

- [ ] 对外 CTA 是否指向 `generate.html`（非 `intake.html`）
- [ ] 团队入口是否指向 `board.html`（非 `/`）
- [ ] 首页是否仍为 `index.html`（`board:publish` 只写 `board.html`）
- [ ] Intake 完成是否写入上表 sessionStorage 键
- [ ] 改 visual 后是否 `build:visual-demo` 并 push
- [ ] `pitch.html` 路演 CTA 是否保持对外优先（→ generate / demo 样例）

---

## 8. 相关文档

- 部署速查：`docs/DEPLOY.md`（本文精简版）
- Cursor 规则：`.cursor/rules/github-pages-deploy.mdc`
- 路演文案：`shadow-corpus/docs/roadshow-shadow-agent-onepager.md`
- Visual UX：`shadow-corpus/visual/05-ui-design-document.md`
- 看板配置：`shadow-corpus/06-task-progress/site.board.json`
