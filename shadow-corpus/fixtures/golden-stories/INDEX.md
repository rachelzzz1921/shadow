# Shadow 四套剧本 — 路径索引

更新时间：2026-06-14

Demo 本地预生成共 **4 套** `LOCAL_STORIES`（见产品需求 [`01-shadow-product-requirements.md`](../../01-requirements/01-shadow-product-requirements.md)）。

| # | 线名 | 影子 | 岔路口 (choice) | 状态 |
|---|------|------|-----------------|------|
| 0 | **复读线** | 阿岚 | 如果当年我去复读了 | ✅ Golden 已抽出 |
| 1 | **游戏策划线** | 林屿 | 如果当年我没有出国，留在上海做游戏策划 | 📦 仅在 demo |
| 2 | **住院医师线** | 沈念 | 如果当年我没有考研，而是留在成都做住院医师 | 📦 仅在 demo |
| 3 | **武汉留下线** | 周原 | 如果当年我没有去深圳，而是和爱人一起留在武汉 | 📦 仅在 demo |

---

## 0 · 复读线（阿岚）

| 用途 | 路径 |
|------|------|
| **Golden JSON（机器可读 · 验收源）** | [`复读线.json`](./复读线.json) |
| **Golden 说明（人读 · 质量标准）** | [`复读线.md`](./复读线.md) |
| **Eval 测试引用（同内容副本）** | [`../../04-dev-testing/golden-stories/复读线.json`](../../04-dev-testing/golden-stories/复读线.json) |
| **契约样例（结构参照）** | [`../../archive/demo-v0.2/lib/contract.example.json`](../../archive/demo-v0.2/lib/contract.example.json) |
| **Demo 内嵌完整剧本** | [`../../archive/demo-v0.2/public/index.html`](../../archive/demo-v0.2/public/index.html) → `LOCAL_STORIES[0]`（约 L2001–2125） |
| **Demo 默认 profile 输入** | 同上 → `DEMO_INPUTS[0]`（约 L1972–1980） |
| **Visual 第一期** | [`../../visual/stories/fuxduxian/`](../../visual/stories/fuxduxian/) |
| **Visual story_id** | `fuxduxian` |
| **场景 brief** | [`../../visual/stories/fuxduxian/scene-briefs.md`](../../visual/stories/fuxduxian/scene-briefs.md) |
| **叙事待改清单** | [`../../visual/stories/fuxduxian/narrative-gaps.md`](../../visual/stories/fuxduxian/narrative-gaps.md) |

**验收：** `npm test --prefix shadow-corpus/archive/demo-v0.2`

---

## 1 · 游戏策划线（林屿）

| 用途 | 路径 |
|------|------|
| **完整剧本（唯一源）** | `shadow-corpus/archive/demo-v0.2/public/index.html` → `LOCAL_STORIES[1]`（L2126–2230） |
| **Profile 输入** | 同上 → `DEMO_INPUTS[1]`（L1981–1986） |
| **Golden JSON** | _未抽出_（计划 CHG-002） |

**premise：** 你没有出国，留在上海，从一张游戏策划表开始，把未选的人生写成七年。

---

## 2 · 住院医师线（沈念）

| 用途 | 路径 |
|------|------|
| **完整剧本（唯一源）** | `shadow-corpus/archive/demo-v0.2/public/index.html` → `LOCAL_STORIES[2]`（L2231–2335） |
| **Profile 输入** | 同上 → `DEMO_INPUTS[2]`（L1987–1992） |
| **Golden JSON** | _未抽出_ |

**premise：** 你没有去读研，而是留在成都，从一间小诊所开始，把另一种人生走成七年。

---

## 3 · 武汉留下线（周原）

| 用途 | 路径 |
|------|------|
| **完整剧本（唯一源）** | `shadow-corpus/archive/demo-v0.2/public/index.html` → `LOCAL_STORIES[3]`（L2336–2440） |
| **Profile 输入** | 同上 → `DEMO_INPUTS[3]`（L1993–1998） |
| **Golden JSON** | _未抽出_ |

**premise：** 你没有分手，也没有去深圳，而是和爱人一起留在了武汉，把日子过成七年。

---

## 共用路径

| 用途 | 路径 |
|------|------|
| 四套剧本容器 | `shadow-corpus/archive/demo-v0.2/public/index.html` |
| Zod 契约 | `shadow-corpus/archive/demo-v0.2/lib/schemas.js` |
| Eval 规则 | `shadow-corpus/archive/demo-v0.2/lib/evaluator.js` |
| 5-agent Prompt | `shadow-corpus/archive/demo-v0.2/lib/prompts.js` |
| 叙事协议 | `shadow-corpus/03-coding/01-narrative-prompt-protocol.md` |
| Eval rubric | `shadow-corpus/04-dev-testing/01-narrative-eval-rubric.md` |
