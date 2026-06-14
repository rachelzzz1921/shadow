# Live 三条 Profile 抽检（T-020 · Gate G4）

执行：P4 · 环境：`npm run dev --prefix shadow-corpus/archive/demo-v0.2`

## Profile 矩阵

| # | choice 关键词 | 干预年 | 选项 | 通过 |
|---|---------------|--------|------|------|
| 1 | 复读 / 阿岚 | 1 | 告诉父母 | ☐ |
| 2 | 复读 / 阿岚 | 4 | 承认不擅长 | ☐ |
| 3 | 复读 / 阿岚 | 6 | _默认_ | ☐ |

## 每条检查

- [ ] `/api/story/start` 返回 session + run_id
- [ ] topbar **时代 overlay**（`#fateOverlay`）与 narrative 年一致
- [ ] pivotal 选择后 overlay 含「你选了…」
- [ ] pivotal 年后 `user_intervention` 出现在下一年 prompt（见 trace）
- [ ] `memory_stream` 与年 narrative 不矛盾
- [ ] `final` eval score ≥ 85，无 errors
- [ ] trace 落盘 `runs/{run_id}.json`

## 已知占位（不算 fail）

- Fate / Dialogue 文案为 placeholder
- Re-plan 为规则引擎，非 LLM

## 结论

| Run ID | Score | 备注 |
|--------|-------|------|
| | | |
| | | |
| | | |

**P4 签字**：_待填_ · **日期**：_待填_
