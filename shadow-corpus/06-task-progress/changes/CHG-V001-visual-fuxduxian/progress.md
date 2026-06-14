---
change_id: CHG-V001
title: 复读线视觉第一期（7景+7动画+Phaser）
phase: dev-testing
blocked: false
blocked_reason: ""
assignee: P2
exec_plan: PLAN-2026Q2-shadow-corpus
updated_at: 2026-06-14
---

# CHG-V001 — Visual 第一期

**Gate G-N1：** 叙事 v2 签字前，layout 均为 draft。

## Artifacts

- [x] visual/ 模块骨架
- [x] 12 审美标杆 CASE → [`references/aesthetic-cases.md`](../../visual/references/aesthetic-cases.md)
- [x] Phaser engine 脚手架 → [`visual/engine/`](../../visual/engine/)
- [x] 7× layout.json draft → [`visual/scenes/fuxduxian/`](../../visual/scenes/fuxduxian/)
- [x] [`assets.csv`](../../visual/registry/assets.csv) 30 行占位 PX-PH-*
- [x] [`asset-sourcing-guide.md`](../../visual/registry/asset-sourcing-guide.md)（V-002 占位）
- [x] 静态 demo overlay → `docs/demo-visual.js`
- [x] [`visual-review-checklist.md`](../../visual/stories/fuxduxian/visual-review-checklist.md)（V-006 占位）
- [x] [`v2-to-golden-sync.md`](../../visual/stories/fuxduxian/v2-to-golden-sync.md)（V-008 占位）
- [ ] narrative-draft-v2.md 终稿（P2）
- [ ] 真实素材替换 PX-PH-*
- [ ] G-N1 人审 → layout `approved`

## 依赖

- 叙事：G-N1 后锁像素与 golden 同步
- 技术：静态 demo 已可预览；Phaser 完整播放在 archive/index 可选
