# Shadow 五人团队执行计划

更新时间：2026-06-14  
计划 ID：`PLAN-2026Q2-shadow-corpus`  
状态：**进行中** — 统筹包已就绪，P0 能力迁移待启动

> 本计划由 **`planning-and-task-breakdown`** 拆单，用 **`progress-tracker`** 维护看板，Agent 侧用 **`writing-plans` → `executing-plans`**（Codex）或 **`subagent-driven-development`**（Claude Code 有 subagent 时）。

---

## 1. 用哪些 Skill

| 你要做的事 | Skill | 谁 invoke |
|-----------|-------|-----------|
| 拆任务、排依赖、估 scope | `planning-and-task-breakdown` | P3 工程 Lead |
| 写可执行的逐步计划（给 Agent） | `writing-plans` | P3 → 交给 Codex |
| 按计划逐步实现 + checkpoint | `executing-plans` | Codex |
| 并行独立子任务 | `dispatching-parallel-agents` | Claude Code |
| 看板 / 阶段 / 阻塞 | `progress-tracker` | P5 工具 / PM |
| 拆 GitHub Issue | `to-issues` | P5 |
| 技术方案 | `design-generator` | Claude Code |
| 改 lib + 测试 | `tdd` | Codex |
| 叙事 golden / 本地故事 | `story-authoring` | P2（人主导，Agent 辅助起草） |
| 审 narrative / trace | `story-review` | P4 |
| Prompt 口径变更记录 | 人工 + `06-task-progress/02-prompt-experiments-log.md` | P2 |

**阶段 Skill 对照**（见 `skills/shadow-router/SKILL.md`）：01→brainstorming，02→design-generator，03→tdd，04→tdd+story-authoring，05→story-review，06→progress-tracker，07→systematic-debugging。

---

## 2. 五人分工（固定角色）

| 代号 | 角色 | 主要负责 | 几乎只能人做 |
|------|------|----------|--------------|
| **P1** | 产品 / PM | 优先级、范围、验收签字、对外 demo 叙事 | 定「做不做 / 先做什么」、最终 go/no-go |
| **P2** | 叙事 / 内容 | Golden 故事、Prompt 语气、介入选项文案 | 叙事是否「像人、有重量、不鸡汤」 |
| **P3** | 工程 Lead | 架构、Agent 任务单、Code Review | 合并权、技术取舍、依赖顺序 |
| **P4** | QA / 评测 | Eval rubric、golden 回归、live 抽检 | warn 是否可接受、敏感内容 |
| **P5** | 工具 / 集成 | Corpus、hooks、skills 同步、trace 归档 | CI/密钥、环境变量、跑批调度 |

**原则：** 文档口径和人审叙事 **不能** 全权交给 Agent；Agent 适合 **扩写、实现、测试、批量 run、文档骨架**。

---

## 3. 工作类型图例

| 标记 | 含义 |
|------|------|
| 👤 | **仅人** — 必须人工完成或人工签字后才能继续 |
| 🤖CC | **Claude Code** — 长上下文、多文件、subagent |
| 🤖CX | **Codex** — 按计划逐步改代码、跑 test |
| 👤+🤖 | 人定口径，Agent 执行 |
| ⏳ | **等待期填充** — Agent 长跑 / API 生成 / batch run 时并行做 |

---

## 4. 依赖总序（不能乱）

```
Wave 0 对齐（人）
    ↓
Wave 1 基线（Agent 可并行）+ 人审口径文档
    ↓
Wave 2 P0 方案 👤签字 → writing-plans（Agent）
    ↓
Wave 3 P0 实现（Agent 为主，P3 review gate）
    ↓
Wave 4 QA + 第二条 golden + prompt 迭代
    ↓
Wave 5 P1 增强（多 run 对比、report）
```

**硬依赖：**

1. P0 **需求口径**（P1+P2 签字）→ 才能写 design / plans  
2. **design.md 等价物**（02 文档更新）→ 才能 coding  
3. **npm test + golden** 绿 → 才能 QA 签字  
4. **story-review 人审** → 才能标记 done  

---

## 5. 进度看板（当前）

| requirements | design | coding | dev-testing | qa-testing |
|---|---|---|---|---|
| CHG-000 corpus统筹 | CHG-001 P0方案 | — | CHG-000 test基线 | — |
| (P1✅ P2⏳) | (P3 待启动) | | (P5✅) | |

**Totals:** requirements=1  design=1  coding=0  dev-testing=1  qa-testing=0  
**Blocked:** 0  

变更详情见 [`changes/`](./changes/) 目录下各 `progress.md`。

---

## 6. 分 Wave 任务排布

### Wave 0 — 团队对齐（第 1 天上午，全 👤）

| 序 | 任务 | 负责 | 产出 | 时长 |
|----|------|------|------|------|
| 0.1 | Kickoff：确认五人角色与本周目标 | P1 | 口头 + 本表角色列填真名 | 30min |
| 0.2 | 共读 `MANIFEST.md` + 复读线 golden | 全员 | 每人 3 条「不可退让」 | 45min |
| 0.3 | 确认 Agent 分工：CC vs Codex 谁开哪个 session | P3+P5 | 会话账号 / 分支策略 | 15min |
| 0.4 | P1 签字：P0 三项做不做、顺序是否同意 | P1 | 在 CHG-001 progress 里记 `approved` | 15min |

**Wave 0 完成标准：** 真名写入 [`team-roster.md`](./team-roster.md)，P0 scope 无争议。

---

### Wave 1 — 基线 + 口径（第 1 天下午）

| 序 | 任务 | 负责 | 类型 | 依赖 |
|----|------|------|------|------|
| 1.1 | `./shadow-corpus/skills/sync-cursor-links.sh` + `npm test` 基线报告 | P5 | 🤖CX 可执行 | — |
| 1.2 | Corpus gap 扫描（缺哪些 02/03 文档） | P3 | 🤖CC `harness-init` | — |
| 1.3 | **复读线红线清单**（6 条质量标准扩写） | P2 | 👤 | 0.2 |
| 1.4 | **Eval rubric 与 golden 字段对齐检查** | P4 | 👤 | 0.2 |
| 1.5 | 更新 `team-roster.md` + 各 CHG assignee | P5 | 👤 | 0.1 |

**并行：** 1.1 ∥ 1.2 ∥ 1.3 ∥ 1.4  

#### ⏳ 等待 1.1 / 1.2 时（Agent 在跑）

| 谁 | 做什么 |
|----|--------|
| P2 | 起草 **Persona / Beats** prompt 改进笔记 → `02-prompt-experiments-log.md` |
| P4 | 读 `story-review` skill，做 1 份空白抽检表模板 |
| P1 | 写 5 分钟对外介绍话术（无 demo 也能讲清 Shadow） |
| P5 | 把 hooks 路径在 `.claude/settings.json` 核对一遍 |

---

### Wave 2 — P0 方案与计划（第 2 天）

| 序 | 任务 | 负责 | 类型 | 依赖 |
|----|------|------|------|------|
| 2.1 | P0 三项需求写入 02/03 文档（memory 检索 / reflection / re-plan） | P2+P1 | 👤 口径 | 1.3, 1.4 |
| 2.2 | 技术方案：`02-technical-design/02-p0-memory-reflection-replan.md` | P3 | 🤖CC `design-generator` → 👤 P3 审 | 2.1 |
| 2.3 | 实现计划：`docs/plans/2026-06-14-p0-implementation.md` | P3 | 🤖CC `writing-plans` | 2.2 |
| 2.4 | **方案评审会**（30min） | P1+P2+P3+P4 | 👤 签字 | 2.2 |

**P0 三项（来自 migration-roadmap）：**

1. Memory 检索 — Final 前筛选 `memory_stream`  
2. Reflection — pivotal 年后写入反思条目  
3. Intervention re-plan — 干预后更新后续 beat seed  

#### ⏳ 等待 2.2 / 2.3（CC 写长文档时）

| 谁 | 做什么 |
|----|--------|
| P2 | **Prompt 工程**：写 3 版 Persona system prompt 变体（只 markdown，不改代码） |
| P4 | 定义「reflection 条目」人工验收标准（几条 bullet） |
| P5 | `to-issues` 把 2.3 计划拆成 3 个 GitHub Issue（若用 gh） |
| P1 | 确认 P1 增强（多 run 对比）是否进本周，不进则标 P1 backlog |

---

### Wave 3 — P0 实现（第 3–5 天）

**顺序：** 2.3 计划中的 Task 顺序为准；**默认垂直切片**：每项能力单独 PR / 分支。

| 序 | 任务 | 负责 | 类型 | 依赖 |
|----|------|------|------|------|
| 3.1 | Task A：memory 检索（lib + test） | Codex | 🤖CX `executing-plans`+`tdd` | 2.4 |
| 3.2 | Task B：reflection 步骤（协议 + lib） | Codex | 🤖CX | 2.4 |
| 3.3 | Task C：intervention re-plan（prompts + beats 更新） | P2 写 prompt + Codex 接线 | 👤+🤖 | 2.4 |
| 3.4 | **Code Review gate** | P3 | 👤 阻塞 | 3.1–3.3 each |
| 3.5 | 合并 + `npm test` 全绿 | P3+P5 | 🤖CX / 👤 | 3.4 |

**可并行（无共享文件冲突时）：**

- 3.1 memory 检索 ∥ 3.2 reflection（不同 lib 模块）  
- **不可并行：** 3.3 re-plan 与改 `prompts.js` 全局结构 — 等 3.1/3.2 合并或锁文件  

Claude Code 若同时开：`dispatching-parallel-agents` 仅用于 **3.1 vs 3.2** 这种独立测试文件域。

#### ⏳ 等待 live run / Codex 长跑 / API 生成时

| 谁 | 做什么 |
|----|--------|
| P2 | Prompt 工程：Final / Dialogue prompt 变体 + 记入实验日志 |
| P2 | 第二条 golden 故事 **大纲**（仅人设+七年节奏，不写 JSON） |
| P4 | 用归档 demo 跑 2 次 live，填 story-review 清单草稿 |
| P5 | 更新 `progress-tracker` 看板 + trace 命名规范 |
| P1 | 整理「非目标」FAQ 给外部沟通 |

---

### Wave 4 — QA 与叙事验收（第 6 天）

| 序 | 任务 | 负责 | 类型 | 依赖 |
|----|------|------|------|------|
| 4.1 | Golden 复读线 eval 回归 | P4 | 🤖CX `npm test` + 👤 看 warn | 3.5 |
| 4.2 | Live 3 条 profile 抽检 | P4+P2 | 👤 叙事签字 | 3.5 |
| 4.3 | `story-review` 全清单过一遍 | P4 | 👤 | 4.2 |
| 4.4 | Prompt 实验日志：合并本周有效变体 | P2 | 👤 选 1 版进协议 | 4.2 |
| 4.5 | P1 **go/no-go** 演示 | P1 | 👤 | 4.3 |

---

### Wave 5 — P1 增强（第 7 天起，可并行 backlog）

| 序 | 任务 | 负责 | 类型 |
|----|------|------|------|
| 5.1 | 多 run 对比模板 + 填 1 表 | P4+P5 | 👤+🤖 |
| 5.2 | 强化 `story-review` trace 检查项 | P3 | 🤖CC |
| 5.3 | 第二条 golden JSON（若大纲已 ready） | P2 | 👤 主笔，`story-authoring` 辅助 |

---

## 7. Agent 会话 playbook

### Claude Code 适合

- 多文件 refactor、corpus 文档、design-generator、writing-plans  
- 有 subagent：`subagent-driven-development` 跑 3.1∥3.2  
- **开 session 前：** P3 贴 `CHG-xxx` + 计划文件路径 + 「不要改 01 需求口径」

### Codex 适合

- `executing-plans` 逐步执行 `docs/plans/*.md`  
- `tdd` 改 `archive/demo-v0.2/lib/`  
- **开 session 前：** 计划已存在、分支已切、测试基线绿  

### 每次 Agent 任务单模板（P3 填写）

```markdown
## Agent Task
- Change: CHG-00X
- Skill: executing-plans | tdd | design-generator
- Plan: shadow-corpus/docs/plans/YYYY-MM-DD-xxx.md
- Do NOT: 改 01-requirements 口径 / 跳过 npm test
- Done when: npm test 7/7 + progress.md 更新到 dev-testing
- Reviewer: @P3
```

---

## 8. 等待期任务池（随时可做）

Agent 或 API 在跑时，从池里捞 **不依赖其输出** 的任务：

| ID | 任务 | 负责 | 预估 |
|----|------|------|------|
| W-01 | Persona prompt 变体 ×3 | P2 | 1h |
| W-02 | Beats pivotal/quiet 节奏示例 ×2 | P2 | 1h |
| W-03 | Dialogue ≤30 字 bad/good 对照表 | P2 | 45min |
| W-04 | story-review 空白抽检表 | P4 | 30min |
| W-05 | 实验日志条目补全 | P2 | 20min |
| W-06 | skills sync + manifest 核对 | P5 | 20min |
| W-07 | 对外 5min 话术润色 | P1 | 30min |
| W-08 | run trace 目录清理规范 | P5 | 20min |
| W-09 | 第二条 golden 大纲 | P2 | 1.5h |
| W-10 | eval warn 决策树（人判） | P4 | 45min |

---

## 9. Checkpoint 日历

| 日 | Checkpoint | 参与 | 通过条件 |
|----|------------|------|----------|
| D1 末 | Wave 1 完成 | 全员 | 基线 test 绿 + 红线清单 + assignee 就绪 |
| D2 末 | Wave 2 完成 | P1–P4 | P0 方案 👤 签字 + 计划文件存在 |
| D5 末 | Wave 3 完成 | P3+P4 | 3.5 合并，test 绿 |
| D6 末 | Wave 4 完成 | P1+P4 | story-review 签字 + go/no-go |
| D7+ | P1 backlog | 按需 | 多 run 表 / 第二 golden |

---

## 10. 风险

| 风险 | 缓解 |
|------|------|
| Agent 改 prompt 口径未经 P2 | 03 协议变更必须 P2 在实验日志签字 |
| 五人同时改 corpus 冲突 | P5 管 merge；文档按 CHG 分文件 |
| Live API 慢 / 限流 | 等待期做 W-01–W-10；batch 放非高峰 |
| Codex/CC 重复做同一 task | P3 任务单 + progress.md assignee 唯一 |

---

## 11. 相关文件

- 迁移范围：[`../knowledge/research/migration-roadmap-p0-p3.md`](../knowledge/research/migration-roadmap-p0-p3.md)
- Progress 规范：[`03-progress-file.md`](./03-progress-file.md)
- Prompt 实验：[`02-prompt-experiments-log.md`](./02-prompt-experiments-log.md)
- 团队花名册：[`team-roster.md`](./team-roster.md)
