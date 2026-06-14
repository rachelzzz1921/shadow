---
name: harness-init
description: Initialize or refresh Shadow Harness documentation (CLAUDE.md, AGENTS.md, 01–07 stage docs, example context). Use for /init, "set up harness", new agent onboarding, or after major restructure. Shadow-aware fork of jackhoward24/harness-init.
---

# Harness Init — Shadow

为 Shadow 项目初始化或刷新 AI 编程 Harness 上下文。

## 何时使用

- 新 agent 接入 / `/init`
- 目录结构大改后
- `CLAUDE.md` 或 `AGENTS.md` 过期

## Shadow 优先结构（已有则更新，不覆盖实质内容）

```
shadow/
├── CLAUDE.md              # Stack、命令、Do Not
├── AGENTS.md              # 阅读顺序 + Skill 路由
├── CONTEXT.md             # 领域词汇（可选，配合 improve-codebase-architecture）
├── docs/adr/              # 架构决策（可选）
├── 01-requirements/ … 07-debug-and-correction/
├── skills/shadow/         # 领域 Skill 源码（canonical）
├── skills/harness/        # Harness 框架 Skill 源码
├── .agents/skills/        # Agent 发现目录（含软链）
├── hooks/
└── example/shadow-demo/   # 可运行 demo
```

## 工作流

### 1. 检测项目状态

```bash
test -f CLAUDE.md && echo "has CLAUDE" || echo "missing CLAUDE"
test -d example/shadow-demo/lib && echo "has demo"
ls 01-requirements 02-technical-design 03-coding 2>/dev/null
```

### 2. 扫描（现有项目）

- 读 `README.md`、`02-technical-design/01-shadow-harness-loop.md`
- 读 `example/shadow-demo/` 的 package.json、lib/*.js 入口
- 读 `.agents/SKILLS-GOVERNANCE.md` 确认 Skill 路由

**Tech stack:** Node 20+, Zod, AI SDK, 单文件 `public/index.html`

### 3. 生成 / 更新文档

| 文件 | 规则 |
|------|------|
| `CLAUDE.md` | Stack、npm 命令、Do Not、Key Paths |
| `AGENTS.md` | 阅读顺序、01–07 导航、Skill 入口 → `.agents/SKILLS-GOVERNANCE.md` |
| `02-technical-design/03-demo-file-map.md` | lib/ 文件地图与文档对应 |
| 各阶段 `index.md` | 仅补缺失链接，不删 Shadow 专有内容 |

**不要**用通用模板覆盖已有的 `01-requirements/` … `07-debug-and-correction/` 实质文档。

### 4. 可选：通用 Harness 脚手架

若用户明确要求完整 jackhoward24 文档树，额外创建：

```
docs/DESIGN.md, docs/SECURITY.md, docs/exec-plans/, …
```

参考 `.agents/skills/harness-init/references/`（若存在）或 [jackhoward24/harness-engineering-in-ai-coding](https://github.com/jackhoward24/harness-engineering-in-ai-coding)。

### 5. 验证

```bash
npm test
npx skills list | head -5
```

### 6. 报告

输出 Created / Updated / Skipped 清单，并提示下一步：

1. 跑 `setup-matt-pocock-skills`（若尚无 CONTEXT.md / docs/adr/）
2. 读 `.agents/SKILLS-GOVERNANCE.md` 选择阶段 Skill

## 相关

- Skill 治理：`.agents/SKILLS-GOVERNANCE.md`
- 路由 Skill：`shadow-router`
- 同步脚本：`skills/sync-shadow-skills.sh`
