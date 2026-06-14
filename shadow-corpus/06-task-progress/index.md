# 第六章：任务进度管理

> 五个阶段解决「怎么做」，进度管理解决「现在在哪里、改了什么」。

## 文章列表

| 序号 | 标题 | 状态 |
|------|------|------|
| 01 | [Run Trace 规范](./01-run-trace-spec.md) | ✅ |
| 02 | [Prompt 实验日志](./02-prompt-experiments-log.md) | ✅ |
| 03 | [Progress 文件规范](./03-progress-file.md) | ✅ |
| 04 | [五人团队执行计划](./04-team-execution-plan.md) | ✅ |
| 05 | [任务管理系统 CLI](./05-task-system.md) | ✅ |
| — | [团队花名册](./team-roster.md) | 📝 待填真名 |
| — | [Kickoff 议程 T-001](./kickoff-agenda-T001.md) | 占位 |
| — | [Agent 分支策略](./agent-branch-strategy.md) | T-003 |
| — | [共读清单 T-002](./reading-checklist-T002.md) | 占位 |
| — | [Harness 迭代日志](./harness-iteration-log.md) | Wave 4 I-1…I-5 |
| — | [Wave 4 计划](../docs/plans/2026-06-14-harness-wave4-iteration.md) | CHG-H001 |
| — | [全链路看板 BOARD.md](./BOARD.md) | v2 + CLI 自动区 |
| — | [任务库 registry.json](./tasks/registry.json) | 40 项 |
| — | [变更进度 `./changes/`](./changes/) | 进行中 |

## 任务管理 Skill

| 场景 | Skill |
|------|-------|
| 拆单排期 | `planning-and-task-breakdown` |
| 看板 / 阶段 | `progress-tracker` |
| Agent 实现计划 | `writing-plans` → `executing-plans` |
| 并行独立任务 | `dispatching-parallel-agents` |
| 开 Issue | `to-issues` |

## 任务 CLI

```bash
npm run tasks -- ready          # 可立即开始
npm run tasks -- mine P2        # 我的任务 + 等待池
npm run tasks -- critical       # 关键路径
npm run tasks -- start T-007    # 标记进行中
npm run tasks -- done T-007     # 完成
npm run board                   # 刷新看板并打印
```

详见 [`05-task-system.md`](./05-task-system.md)

**可读版任务库** → [`tasks/TASK-LIBRARY.md`](./tasks/TASK-LIBRARY.md)（`npm run board` 自动生成）

## GitHub Pages 共享看板

在线团队看板部署说明 → [`../../docs/DEPLOY.md`](../../docs/DEPLOY.md)

```bash
npm run board:publish   # 生成 docs/index.html
```

## 三层机制

```
层零：tasks/registry.json + shadow-tasks CLI（任务级依赖与派单）
层一：progress.md（每 change 一条）
层二：post-progress-update Hook（关键产物写入时推进阶段）
层三：prompt-experiments-log + runs/*.json（变更与运行追溯）
```

## 快速命令

```bash
# 查看最近 trace（归档 demo）
ls -lt shadow-corpus/archive/demo-v0.2/runs/*.json 2>/dev/null | head

# Golden eval
npm test
npm run test:golden

# v2 视觉字段 → golden（G-N1 后 --apply）
npm run sync:golden-v2

# 同步 Skill 到 Cursor
npm run sync-skills
```
