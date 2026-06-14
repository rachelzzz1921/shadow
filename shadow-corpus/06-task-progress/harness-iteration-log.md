# Harness 迭代日志

计划：[`docs/plans/2026-06-14-harness-wave4-iteration.md`](../docs/plans/2026-06-14-harness-wave4-iteration.md)

| 轮次 | 摘要 | 任务 |
|------|------|------|
| I-1…I-5 | demo v2 · smoke · eval | H-001–H-005 ✅ |
| I-6 | Dialogue + Phaser + smoke:full | H-006–H-008 ✅ |
| I-7 | Fate hook + archive visual + API | H-009–H-011 ✅ |
| I-8 | Live index `#fateOverlay` + offline snippets | H-012 ✅ |

### I-9 — 下一轮

**候选：** index 对话走 `/api/dialogue` placeholder · T-020 自动化填表 · G-N1 golden apply  
**Blockers：** P2 prompt · 人 Gate

## 验证命令

```bash
npm test
npm run harness:smoke:full
npm run dev --prefix shadow-corpus/archive/demo-v0.2
# 浏览器：生成影子人生 → 每年 topbar 见时代 overlay
# SHADOW_HTTP_TEST=1 npm test  # 可选 HTTP 探针
```
