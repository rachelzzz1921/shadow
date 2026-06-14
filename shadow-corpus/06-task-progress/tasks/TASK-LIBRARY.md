# 任务库（可读版）

> **计划** `PLAN-2026Q2-shadow-corpus` · **更新** 2026-06-14  
> 机器源文件 → [registry.json](./registry.json) · 看板 → [BOARD.md](../BOARD.md)  
> 刷新：`npm run board`

## 图例

- **●** 必做 · **◇** 可选
- 状态：✅ 完成 · 🟡 进行中 · ⬜ 待办 · 🔴 阻塞
- 执行：👤 人工 · 🤖CC Claude Code · 🤖CX Codex

## 团队

- **P1** — 产品 / PM
- **P2** — 叙事 / 内容
- **P3** — 工程 Lead
- **P4** — QA / 评测
- **P5** — 工具 / 集成

## Change 目录

| ID | 名称 | 说明 | 进度 |
|----|------|------|------|
| [INFRA-001](../changes/INFRA-001-team-onboarding/progress.md) | 团队 Onboarding | Kickoff、花名册、Agent 分工、共读 golden | 0/4 |
| [CHG-000](../changes/CHG-000-corpus-reorg/progress.md) | Corpus 整合 | 唯一入口确认、gap 扫描、skills 基线 | 1/4 |
| [CHG-001](../changes/CHG-001-p0-migration/progress.md) | P0 三项迁移 | memory 检索 · reflection · intervention re-plan | 0/16 |
| [CHG-V001](../changes/CHG-V001-visual-fuxduxian/progress.md) | Visual 复读线 | 叙事 v2 · 像素素材 · Phaser · 7 年 layout | 0/8 |
| CHG-002 | 第二条 Golden | Wave 5 可选 backlog | 0/1 |
| CHG-003 | 多 Run 对比 | Wave 5 可选 backlog | 0/1 |

## 全部任务

| 状态 | ID | 任务 | 波次 | 阶段 | 负责 | 执行 | 依赖 | 产物 |
|------|-----|------|------|------|------|------|------|------|
| 🟡 | [T-001](../team-roster.md) | Kickoff：五人角色与本周目标 | W0 | 01 需求 | P1 | 👤 | — | [team-roster.md](../team-roster.md) |
| ⬜ **✓** | [T-002](../changes/INFRA-001-team-onboarding/progress.md) | 共读 MANIFEST + 复读线 golden（每人 3 条不可退让） | W0 | 01 需求 | P1 | 👤 | — | [change](../changes/INFRA-001-team-onboarding/progress.md) |
| ⬜ **✓** | [T-003](../team-roster.md#Agent账号) | 确认 CC / Codex 分工与分支策略 | W0 | 01 需求 | P3 | 👤 | — | [team-roster.md](../team-roster.md#Agent账号) |
| ⬜ | [T-009](../team-roster.md) | 更新 roster + 各 CHG assignee | W1 | 06 进度 | P5 | 👤 | T-001 | [team-roster.md](../team-roster.md) |
| ✅ | [T-005](../changes/CHG-000-corpus-reorg/progress.md) | skills sync + npm test 基线报告 | W1 | 04 自测 | P5 | 🤖CX | — | [change](../changes/CHG-000-corpus-reorg/progress.md) |
| ⬜ **✓** | [T-006](../changes/CHG-000-corpus-reorg/progress.md) | Corpus gap 扫描 | W1 | 06 进度 | P3 | 🤖CC | — | [change](../changes/CHG-000-corpus-reorg/progress.md) |
| ⬜ **✓** | [T-023](../changes/CHG-000-corpus-reorg/progress.md) | P1 确认 corpus 为唯一入口 | W1 | 05 QA | P1 | 👤 | ~~T-005~~ | [progress.md](../changes/CHG-000-corpus-reorg/progress.md) |
| ⬜ **✓** | ◇ [W-06](../skills/skills-lock.json) | skills sync + manifest 核对 | W— | 06 进度 | P5 | 👤 | — | [skills-lock.json](../skills/skills-lock.json) |
| ⬜ | [T-004](../changes/CHG-001-p0-migration/progress.md) | P1 签字：P0 三项 scope 与顺序 · Gate G0 | W0 | 01 需求 | P1 | 👤 | T-001, T-002 | [progress.md](../changes/CHG-001-p0-migration/progress.md) |
| ⬜ | [T-007](../fixtures/golden-stories/复读线.md) | 复读线红线清单（6 条质量标准） · Gate G1 | W1 | 01 需求 | P2 | 👤 | T-002 | [复读线.md](../fixtures/golden-stories/复读线.md) |
| ⬜ | [T-008](../04-dev-testing/01-narrative-eval-rubric.md) | Eval rubric 与 golden 字段对齐 | W1 | 04 自测 | P4 | 👤 | T-002 | [01-narrative-eval-rubric.md](../04-dev-testing/01-narrative-eval-rubric.md) |
| ⬜ | [T-010](../03-coding/01-narrative-prompt-protocol.md) | P0 需求写入 02/03 文档 | W2 | 01 需求 | P2 | 👤 | T-004, T-007 | [01-narrative-prompt-protocol.md](../03-coding/01-narrative-prompt-protocol.md) |
| ⬜ | [T-011](../02-technical-design/02-p0-memory-reflection-replan.md) | P0 技术方案文档 · Gate G2 | W2 | 02 方案 | P3 | 🤖CC | T-010 | [02-p0-memory-reflection-replan.md](../02-technical-design/02-p0-memory-reflection-replan.md) |
| ⬜ | [T-012](../docs/plans/2026-06-14-p0-implementation.md) | P0 实现计划（writing-plans） | W2 | 02 方案 | P3 | 🤖CC | T-011 | [2026-06-14-p0-implementation.md](../docs/plans/2026-06-14-p0-implementation.md) |
| ⬜ | [T-013](../changes/CHG-001-p0-migration/progress.md) | 方案评审会 + P1/P3 签字 · Gate G2 | W2 | 02 方案 | P1 | 👤 | T-011 | [change](../changes/CHG-001-p0-migration/progress.md) |
| ⬜ | [T-014](../archive/demo-v0.2/lib/) | 实现 memory 检索 | W3 | 03 编码 | P3 | 🤖CX | T-012, T-013 | [lib](../archive/demo-v0.2/lib/) |
| ⬜ | [T-015](../archive/demo-v0.2/lib/) | 实现 reflection 步骤 | W3 | 03 编码 | P3 | 🤖CX | T-012, T-013 | [lib](../archive/demo-v0.2/lib/) |
| ⬜ | [T-016](../archive/demo-v0.2/lib/prompts.js) | intervention re-plan prompt（人写）+ Codex 接线 · Gate G1 | W3 | 03 编码 | P2 | 👤+🤖 | T-012, T-013, T-010 | [prompts.js](../archive/demo-v0.2/lib/prompts.js) |
| ⬜ | [T-017](../changes/CHG-001-p0-migration/progress.md) | Code Review gate（P0 三项） | W3 | 03 编码 | P3 | 👤 | T-014, T-015, T-016 | [change](../changes/CHG-001-p0-migration/progress.md) |
| ⬜ | [T-018](../changes/CHG-001-p0-migration/progress.md) | 合并 + npm test 全绿 · Gate G3 | W3 | 04 自测 | P5 | 🤖CX | T-017 | [change](../changes/CHG-001-p0-migration/progress.md) |
| ⬜ | [T-019](../fixtures/golden-stories/复读线.json) | Golden 复读线 eval 回归 | W4 | 04 自测 | P4 | 🤖CX | T-018 | [复读线.json](../fixtures/golden-stories/复读线.json) |
| ⬜ | [T-020](../changes/CHG-001-p0-migration/progress.md) | Live 3 条 profile 抽检 · Gate G4 | W4 | 05 QA | P4 | 👤 | T-018 | [change](../changes/CHG-001-p0-migration/progress.md) |
| ⬜ | [T-021](../02-prompt-experiments-log.md) | Prompt 实验日志合并有效变体 | W4 | 06 进度 | P2 | 👤 | T-020 | [02-prompt-experiments-log.md](../02-prompt-experiments-log.md) |
| ⬜ | [T-022](../changes/CHG-001-p0-migration/progress.md) | P1 go/no-go 演示签字 · Gate G5 | W4 | 05 QA | P1 | 👤 | T-019, T-020 | [change](../changes/CHG-001-p0-migration/progress.md) |
| ⬜ **✓** | [V-001](../visual/stories/fuxduxian/narrative-draft-v2.md) | 复读线叙事 v2 改稿（visual_anchor + props） · Gate G-N1 | W1 | 01 需求 | P2 | 👤 | — | [narrative-draft-v2.md](../visual/stories/fuxduxian/narrative-draft-v2.md) |
| ⬜ **✓** | [V-002](../visual/registry/assets.csv) | 像素素材寻源（不用旧 zip，优质免费库） | W1 | 01 需求 | P5 | 👤 | — | [assets.csv](../visual/registry/assets.csv) |
| ⬜ | [V-003](../visual/references/aesthetic-cases.md) | 10–20 审美标杆案例入库 | W1 | 05 QA | P2 | 👤 | V-002 | [aesthetic-cases.md](../visual/references/aesthetic-cases.md) |
| ⬜ **✓** | [V-004](../visual/engine/) | Phaser engine 脚手架（读 layout JSON） | W2 | 03 编码 | P3 | 🤖CX | — | [engine](../visual/engine/) |
| ⬜ | [V-005](../visual/scenes/fuxduxian/) | AI 生成 7 年 layout JSON · Gate G-N1 | W2 | 02 方案 | P3 | 🤖CC | V-001, V-003 | [fuxduxian](../visual/scenes/fuxduxian/) |
| ⬜ | [V-006](../changes/CHG-V001-visual-fuxduxian/progress.md) | 7 特殊场景 + 7 日常动画人审 | W3 | 05 QA | P2 | 👤 | V-005, V-004 | [change](../changes/CHG-V001-visual-fuxduxian/progress.md) |
| ⬜ | [V-007](../visual/04-ux-flow.md) | 挂进 Shadow 体验流程（A/B/C 触发） | W3 | 03 编码 | P3 | 🤖CX | V-006 | [04-ux-flow.md](../visual/04-ux-flow.md) |
| ⬜ | [V-008](../fixtures/golden-stories/复读线.json) | 叙事 v2 回写 golden JSON | W3 | 04 自测 | P2 | 👤+🤖 | V-001, V-006 | [复读线.json](../fixtures/golden-stories/复读线.json) |
| ⬜ | ◇ [T-025](#task-t-025) | 第二条 golden 大纲 | W5 | backlog | P2 | 👤 | T-022 | — |
| ⬜ | ◇ [T-024](../03-run-comparison-template.md) | 多 run 对比模板 + 首表 | W5 | backlog | P4 | 👤+🤖 | T-022 | [03-run-comparison-template.md](../03-run-comparison-template.md) |
| ⬜ **✓** | ◇ [W-01](../02-prompt-experiments-log.md) | Persona prompt 变体 ×3 | W— | backlog | P2 | 👤 | — | [02-prompt-experiments-log.md](../02-prompt-experiments-log.md) |
| ⬜ **✓** | ◇ [W-02](#task-w-02) | Beats 节奏示例 ×2 | W— | backlog | P2 | 👤 | — | — |
| ⬜ **✓** | ◇ [W-03](#task-w-03) | Dialogue bad/good 对照表 | W— | backlog | P2 | 👤 | — | — |
| ⬜ **✓** | ◇ [W-04](#task-w-04) | story-review 空白抽检表 | W— | backlog | P4 | 👤 | — | — |
| ⬜ **✓** | ◇ [W-07](#task-w-07) | 对外 5min 话术 | W— | backlog | P1 | 👤 | — | — |
| ⬜ **✓** | ◇ [W-10](#task-w-10) | eval warn 决策树 | W— | backlog | P4 | 👤 | — | — |

## Wave 说明

- **Wave 0** — Kickoff & P0 scope 签字
- **Wave 1** — 基线建立 & 并行准备
- **Wave 2** — 需求/方案锁定
- **Wave 3** — 编码 & Visual 实现
- **Wave 4** — 自测 · QA · 发布签字
- **Wave 5** — 可选增强 backlog

## Gates

| Gate | 名称 | 负责人 | 解锁内容 |
|------|------|--------|----------|
| G0 | P0 scope 签字 | P1 | 02-design for CHG-001 |
| G1 | 叙事口径 | P2 | 03-coding prompts |
| G2 | 技术方案 | P3+P1 | writing-plans；Codex |
| G3 | Eval 绿 | P4 | 05-qa live |
| G4 | 叙事质量 | P4+P2 | go/no-go |
| G5 | 发布演示 | P1 | 对外 demo |
| G-N1 | 复读线叙事 v2 签字 | P2 | visual AI 布局批量 |

