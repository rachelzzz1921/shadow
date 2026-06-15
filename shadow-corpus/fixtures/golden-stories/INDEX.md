# Shadow Golden 故事 — 路径索引

更新时间：2026-06-14

Demo Mock 共 **4 条**已入库 Golden JSON（`docs/stories/` 同步副本供静态 fetch）。

| # | 线名 | 影子 | story_id | Golden JSON | 主域 |
|---|------|------|----------|-------------|------|
| 0 | **复读线** | 阿岚 | `fuxduxian` | [`复读线.json`](./复读线.json) | academic |
| 1 | **出国读研线** | 林晚 | `linwan` | [`出国读研线-林晚.json`](./出国读研线-林晚.json) | academic |
| 2 | **心动爱情线** | 许星遥 | `heartbeat_line` | [`心动爱情线-许星遥.json`](./心动爱情线-许星遥.json) | love |
| 3 | **插画师线** | 周染 | `zhoudran` | [`插画师线-周染.json`](./插画师线-周染.json) | career |

---

## Demo 入口

| 用途 | 路径 |
|------|------|
| 故事切换 UI | [`docs/demo.html`](../../../docs/demo.html) · `?story=linwan` 等 |
| Catalog + 适配器 | [`docs/demo-stories.js`](../../../docs/demo-stories.js) |
| 静态 JSON | [`docs/stories/`](../../../docs/stories/) |
| 对外首页 | [`docs/index.html`](../../../docs/index.html) |
| 采集 + API | [`docs/generate.html`](../../../docs/generate.html) |
| 站点架构 | [`docs/SITE.md`](../../../docs/SITE.md) |

本地预览：`npm run demo:preview` → http://localhost:5199/demo.html

---

## 0 · 复读线（阿岚）

| 用途 | 路径 |
|------|------|
| Golden 说明 | [`复读线.md`](./复读线.md) |
| Visual | [`../../visual/stories/fuxduxian/`](../../visual/stories/fuxduxian/) |

**验收：** `npm test --prefix shadow-corpus/archive/demo-v0.2`

---

## 1 · 出国读研线（林晚）

**岔路口：** 如果当年我没有考公，而是自己攒钱出国读研  
**premise：** 瞒着所有人买了机票，伦敦七年。  
**来源：** hand-authored · 2026-06-14 入库

---

## 2 · 心动爱情线（许星遥）

**岔路口：** 如果当年我选择了那个让我心动的人  
**premise：** 现实里嫁给合适的人，影子里选了心动的人。  
**特色：** 含 `daily_events` 一日切片（Demo UI 已渲染）

---

## 3 · 插画师线（周染）

**岔路口：** 如果当年我没有选计算机，而是去做自由插画师  
**premise：** 志愿表上写下真正想要的，用七年承担答案。

---

## 共用

| 用途 | 路径 |
|------|------|
| Eval 规则 | [`../../04-dev-testing/01-narrative-eval-rubric.md`](../../04-dev-testing/01-narrative-eval-rubric.md) |
| 叙事协议 | [`../../03-coding/01-narrative-prompt-protocol.md`](../../03-coding/01-narrative-prompt-protocol.md) |
| 六场景 Agent | [`../../03-coding/prompts/scene-agents/`](../../03-coding/prompts/scene-agents/) |
