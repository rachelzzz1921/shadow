# Harness 迭代日志

计划：[`docs/plans/2026-06-14-harness-wave4-iteration.md`](../docs/plans/2026-06-14-harness-wave4-iteration.md)

| 轮次 | 摘要 | 任务 |
|------|------|------|
| I-1…I-5 | demo v2 · smoke · eval | H-001–H-005 ✅ |
| I-6 | Dialogue + Phaser + smoke:full | H-006–H-008 ✅ |
| I-7 | Fate hook + archive visual + API | H-009–H-011 ✅ |
| I-8 | Live index `#fateOverlay` + offline snippets | H-012 ✅ |
| I-10 | Playwright E2E（`SHADOW_E2E=1` mock + generate→demo 闭环） | A ✅ |
| I-11 | Golden 双轨 CI + `test.yml` + stage_timings / fast fate | B/C ✅ |
| I-12 | Generate 进度屏 + `job_id` demo 回退 + 介入后 poll 续跑 | D ✅ |
| I-13 | 设计系统 v0.1 + site-chrome + index/pitch 双路径入口 | UX-1 ✅ |
| I-14 | Generate 阶段时间轴 + 介入卡片化 + timing hint | UX-2 ✅ |
| I-15 | Demo live 接手 strip + API 错误态 + board 移动表格 | UX-3 ✅ |
| I-16 | ECC 通路 debug：`demo-intake-profile.js` 打包语法错误 + 离线 intake→demo E2E | ECC-1 ✅ |

### I-9 — 下一轮

**候选：** index 对话走 `/api/dialogue` placeholder · T-020 自动化填表 · G-N1 golden apply  
**Blockers：** P2 prompt · 人 Gate

## 验证命令

```bash
npm test
npm run test:golden
npm run test:e2e          # SHADOW_E2E=1 + Playwright
npm run harness:smoke:full
npm run dev --prefix shadow-corpus/archive/demo-v0.2
# SHADOW_HTTP_TEST=1 npm test --prefix shadow-corpus/archive/demo-v0.2 -- test/story-jobs-http.test.js
```
