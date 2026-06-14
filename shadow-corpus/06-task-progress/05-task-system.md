# 任务管理系统

Shadow 任务管理：**结构化 registry + CLI + 看板自动同步**。

## 架构

```
tasks/registry.json     ← 唯一真相（ID、依赖、负责人、阶段、Gate）
        ↓
scripts/shadow-tasks.js   ← CLI：list / ready / mine / start / done / sync
        ↓
tasks/TASK-LIBRARY.md     ← 可读版任务库（自动生成）
BOARD.md（TASK-AUTO 区）   ← npm run board 自动刷新
```

与 **`progress-tracker`** skill 的关系：

| 层级 | 工具 | 粒度 |
|------|------|------|
| Change 级 | `changes/*/progress.md` + progress-tracker | CHG-001 整包在哪个 Harness 阶段 |
| Task 级 | `tasks/registry.json` + shadow-tasks | T-014 谁做、依赖谁、可否并行 |

## 任务字段

| 字段 | 说明 |
|------|------|
| `id` | T-001 或 W-01（等待池） |
| `status` | todo · in_progress · done · blocked · cancelled |
| `phase` | 01-requirements … 07-debug · done · backlog |
| `assignee` | P1–P5 |
| `executor` | human · cc · cx · human+cx |
| `depends_on` | 前置任务 ID 数组 |
| `gates` | G0–G5 人工签字点 |
| `wave` | 0–5 执行波次 |
| `parallel_ok` | 是否可与同 wave 其他任务并行 |
| `optional` | `true` = ◇ 可选，不挡主线 |
| `tags` | waiting-pool · gate · p0 等 |

## CLI 命令

```bash
# 根目录
npm run tasks -- <command>

# 或直接进入目录
node shadow-corpus/06-task-progress/scripts/shadow-tasks.js <command>
```

| 命令 | 作用 |
|------|------|
| `list` | 筛选列表（--assignee --status --phase --change --wave --tag） |
| `show T-001` | 单任务详情 + deps 是否满足 |
| `ready` | **依赖已满足、可立即开始**的 todo |
| `mine P2` | 某成员：可执行 + 等依赖 + 等待池 |
| `critical` | CHG-001 关键路径 + 人工 Gate |
| `start T-001` | 标记进行中 |
| `done T-001` | 标记完成（写 completed_at） |
| `block T-001 原因` | 阻塞 |
| `unblock T-001` | 解除阻塞 |
| `assign T-001 P3` | 改负责人 |
| `add "标题" --assignee P1 --priority P0` | 新增任务 |
| `board` | 打印看板 |
| `sync` | **写回 BOARD.md 自动生成区** |

## 日常工作流

### PM（P1）

```bash
npm run tasks -- critical
npm run tasks -- list --status todo --priority P0
npm run tasks -- sync    # Standup 前刷新看板
```

### 工程（P3）

```bash
npm run tasks -- mine P3
npm run tasks -- ready   # 派给 Codex 前先确认 deps
npm run tasks -- done T-011
```

### Agent 长跑时（全员）

```bash
npm run tasks -- mine P2   # 底部会列出 waiting-pool
npm run tasks -- list --tag waiting-pool
```

### 新增任务

```bash
npm run tasks -- add "修复 eval warn 阈值" \
  --assignee P4 --phase 04-dev-testing --change CHG-001 \
  --depends T-018 --priority P1
npm run tasks -- sync
```

## 人工 Gate

| Gate | 任务示例 | 解锁 |
|------|----------|------|
| G0 | T-004 P1 签 P0 scope | T-010 及以后 |
| G1 | T-007 红线、T-016 prompt | 叙事进代码 |
| G2 | T-013 方案评审 | T-014–016 Codex |
| G3 | T-018 test 绿 | T-019–020 QA |
| G4 | T-020 live 抽检 | T-022 |
| G5 | T-022 go/no-go | Wave 5 |

## 维护约定

1. **完成任务** → `done T-xxx` → `sync`
2. **不要只改 BOARD** — 改 registry.json 或通过 CLI
3. **Change 阶段变更** — 同时更新 `changes/*/progress.md`
4. **Standup** — `critical` + `ready` + `sync`

## 相关

- 看板：[`BOARD.md`](./BOARD.md)
- 五人排期：[`04-team-execution-plan.md`](./04-team-execution-plan.md)
- Progress 规范：[`03-progress-file.md`](./03-progress-file.md)
