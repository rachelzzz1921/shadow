# 对外 5 分钟话术（W-07 占位）

> 演示路径：`npm run demo:preview` → `/demo.html`（静态复读线）  
> Live：`npm run dev --prefix shadow-corpus/archive/demo-v0.2`

---

## 0:00–0:45 问题

「如果当年做了另一个选择，人生会怎样？」Shadow 用 **七年叙事 + 关键干预** 做平行人生，不是算命，是 **可评测的故事 harness**。

## 0:45–1:30 演示（静态）

1. 打开 demo — 阿岚复读线，像素场景 + 年切换  
2. 点 ** pivotal 干预** — 看 memory_stream 与下一年承接  
3. Shadow 对话框 — Dialogue agent hook（当前占位文案）

## 1:30–2:30 Harness 五件套

Goal → Actor（Year / Beats / Fate / Dialogue）→ Feedback（evaluator）→ Memory → Stop

- Golden：[`复读线.json`](../../fixtures/golden-stories/复读线.json) score 95  
- `npm test` 14/14 · `npm run test:golden`

## 2:30–3:30 P0 已落地（占位说明）

| 能力 | 状态 |
|------|------|
| Memory 检索 | ✅ 代码 |
| Reflection | ✅ 类型对齐 |
| Intervention re-plan | 🔶 规则占位，待人写 prompt |
| Fate 上下文 | 🔶 world corpus 采样占位 |

## 3:30–4:15 Visual 第一期

7 年 layout draft · Phaser 脚手架 · 静态 overlay — **等人审 G-N1**

## 4:15–5:00 下一步 / 队友

- P2：Dialogue + Fate prompt、叙事 v2  
- P1：G0 / go-no-go 签字  
- 第二条 golden（backlog）

---

**队友**：P1 改口吻与数据点；删 `[PLACEHOLDER]` 段后再对外。
