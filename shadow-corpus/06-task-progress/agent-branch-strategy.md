# Agent 分工与分支策略（占位 · T-003）

> **人签**：P3 在 kickoff 确认后改 `confirmed: true` 并填真名。

```yaml
confirmed: false
updated: 2026-06-14
```

## 工具分工

| 场景 | 主工具 | 操作人 | 说明 |
|------|--------|--------|------|
| 多文件方案 / subagent | Claude Code | P3 | CHG 设计、writing-plans |
| lib 实现 / executing-plans | Codex | P3 或 P5 | `archive/demo-v0.2/lib/*` |
| 文档 / corpus 小改 | Cursor Agent | 全员 | `shadow-corpus/*`, `docs/demo*` |
| 叙事改稿 | 人 + CC | P2 | **不**让 Agent 改四本 golden JSON |
| Dialogue / Fate prompt 终稿 | 人 | P2 | Agent 只留 hook + placeholder |

## 分支策略

| 分支前缀 | 用途 | 合并目标 |
|----------|------|----------|
| `feat/CHG-*` | 按 change 隔离 | `main` via PR |
| `docs/*` | 纯文档 | 可直接合（仍走 PR） |
| `agent/*` | Agent 批量任务 | PR + npm test 绿 |

**规则**

1. 一 CHG 一长期分支，小步 commit；禁止 force-push `main`。
2. Agent 改 `lib/` 或 `test/` 必须 `npm test` 绿再 PR。
3. Golden JSON 变更需 P2 review + `npm run test:golden`。
4. `docs/demo.html` 与 archive demo 可并行，以 corpus 契约为准。

## PR 检查清单（Agent 自测）

- [ ] `npm test`
- [ ] `npm run test:golden`（若动 story / evaluator）
- [ ] `npm run board:publish`（若动 registry）
- [ ] 队友占位项在 artifact 里标 `[PLACEHOLDER]`

## 队友待替

- [ ] P3 确认 Codex 账号与 quota
- [ ] P5 确认 Cursor hooks / CI 触发
- [ ] 真名写入 [`team-roster.md`](../team-roster.md)
