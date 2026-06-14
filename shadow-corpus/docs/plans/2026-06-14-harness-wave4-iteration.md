# Harness Wave 4 持续迭代计划

> **Skill 链**：`shadow-router` → `writing-plans`（本文）→ `executing-plans`（按轮执行）→ `progress-tracker`（看板 / CHG 进度）  
> **Change**：CHG-H001 · **Plan**：PLAN-2026Q2-shadow-corpus  
> **更新**：2026-06-14

**Goal：** 把 Shadow Harness 从「P0 代码占位」推进到 **可演示、可评测、可迭代的 closed loop**——静态 demo、archive live、eval、visual、队友 hook 同一契约。

**Architecture：** 按 Harness Loop 五件套（Goal / Actor / Feedback / Memory / Stop）拆 **垂直切片**；每轮迭代 = 1 个可验证切片 + 看板任务 + `harness-iteration-log.md` 一条记录。人 Gate 不挡 Agent 切片，但 Agent 不替人签字。

**Tech Stack：** Node 20 · `archive/demo-v0.2` · `docs/demo*` · `fixtures/golden-stories` · `shadow-tasks` CLI

---

## 迭代节奏（持续）

```text
Plan（writing-plans）→ Execute（executing-plans）→ Verify（npm test + test:golden）→ Log → board:publish
```

| 轮次 | 主题 | 验收 |
|------|------|------|
| **I-1** | 静态 demo ↔ v2 视觉字段 | demo 显示 visual_anchor |
| **I-2** | Live harness smoke + trace | 新测试绿；trace 含 fate/replan |
| **I-3** | Evaluator 视觉一致性 | 部分有 visual 时 warn 缺失年 |
| **I-4** | 文档路径对齐 Harness Loop | 01-loop 指向 archive/demo |
| **I-5** | T-020 半自动（mock runtime） | harness-smoke 覆盖 3 intervention 路径 |
| **I-6+** | 队友替换 placeholder | Dialogue/Fate prompt · G-N1 · V-008 apply |

日志 → [`../../06-task-progress/harness-iteration-log.md`](../../06-task-progress/harness-iteration-log.md)

---

## I-1：静态 Demo 挂 v2 视觉（H-001）

**Files:**
- Modify: `docs/demo-data.js` — `V2_VISUAL` + `normalizeYear` merge
- Modify: `docs/demo-engine.js` — 渲染 visual_anchor / key_props
- Modify: `docs/demo-visual.js` — overlay 读 `data-visual-anchor`
- Modify: `docs/demo-theme.css` — `.yr-visual-block` 样式

**Verify:** `npm run demo:preview` 手动；年 1 页见 visual_anchor 文案

---

## I-2：Live Harness Smoke（H-002）

**Files:**
- Create: `archive/demo-v0.2/test/harness-smoke.test.js`
- Modify: `archive/demo-v0.2/test/story-session.test.js` — trace 断言 `fate:sampled`

**Verify:** `npm test` — 新增用例绿

---

## I-3：Evaluator 视觉一致性（H-003）

**Files:**
- Modify: `archive/demo-v0.2/lib/evaluator.js` — `evaluateVisualConsistency`
- Modify: `archive/demo-v0.2/test/evaluator.test.js`

**Verify:** golden 无 visual 字段时 score 不变；部分有时 warn

---

## I-4：Harness Loop 文档对齐（H-004）

**Files:**
- Modify: `02-technical-design/01-shadow-harness-loop.md` — 路径 `archive/demo-v0.2`
- Modify: `06-task-progress/corpus-gap-scan.md` — Wave 4 缺口关闭项

---

## I-5：半自动 Live 抽检脚本（H-005）

**Files:**
- Create: `shadow-corpus/tooling/scripts/harness-live-smoke.mjs` — mock queue 跑 7 年
- Modify: root `package.json` — `npm run harness:smoke`

**Verify:** exit 0；输出 eval score

---

## 人 Gate（不自动化）

| Gate | 任务 | 产物 |
|------|------|------|
| G0 | T-004 | `gates/G0-p0-scope-signoff.md` |
| G2 | T-013 | `gates/G2-design-review.md` |
| G3 | T-017 | `05-qa-testing/04-p0-code-review-checklist.md` |
| G4 | T-020 | `05-qa-testing/05-live-profile-spotcheck.md` |
| G5 | T-022 | `gates/G4-go-no-go.md` |

---

## 下一轮（I-6）候选

1. Phaser engine 挂 archive `public/index.html`（V-007 深化）
2. `sync:golden-v2:apply` + eval visual 规则启用
3. Dialogue agent hook 契约测试（mock，不碰 prompt 正文）
4. 第二条 golden T-025 选题后垂直切片

---

## 完成定义（Wave 4 Agent 侧）

- [ ] I-1 … I-5 全部 verify 绿
- [ ] CHG-H001 progress → dev-testing
- [ ] `harness-iteration-log.md` ≥ 1 条记录
- [ ] 看板 H-001…H-005 done
