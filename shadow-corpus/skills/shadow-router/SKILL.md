---
name: shadow-router
description: Route Shadow Harness tasks to the correct skill among 80+ installed skills. Use when starting any task in this repo, when unsure which skill to use, or when multiple skills seem to overlap (TDD, debug, review, brainstorm).
---

# Shadow Skill Router

Shadow 安装了 80+ skill。本 skill 负责**选对一个**，避免重复或冲突。

## 第一步：读治理文件

1. [`skills/_governance/skills-manifest.json`](../_governance/skills-manifest.json) — 机器可读路由表
2. [`skills/_governance/SKILLS-GOVERNANCE.md`](../_governance/SKILLS-GOVERNANCE.md) — 人类可读完整说明

## 第二步：按任务类型路由

| 用户意图 | 首选 Skill | 备选 |
|----------|-----------|------|
| 写/改本地故事、golden | `story-authoring` | — |
| 审叙事、复盘 trace | `story-review` | `verification-before-completion` |
| 初始化/刷新项目文档 | `harness-init` | `setup-matt-pocock-skills` |
| 技术方案 / design | `design-generator` | `spec-driven-development` |
| 任务进度 / 看板 | `progress-tracker` | `to-issues` |
| 改进 lib 架构 | `improve-codebase-architecture` | `zoom-out`, `code-simplification` |
| 拷问设计方案 | `grill-with-docs` | `grill-me` |
| 写 ADR / 架构决策 | `documentation-and-adrs` | — |
| 改 lib/prompts + 测试 | `tdd` | `test-driven-development` |
| Bug / test fail | `systematic-debugging` | `diagnose` |
| 模糊需求 | `brainstorming` | `interview-me` |
| PR / 分支 review | `review` | `code-review-and-quality` |
| 改 public/index.html UI | `frontend-ui-engineering` | `vercel-composition-patterns`, `web-design-guidelines` |

## 第三步：按 Harness 阶段路由

对齐 `01-requirements/` … `07-debug-and-correction/`：

- **01** → brainstorming, spec-driven-development
- **02** → design-generator, improve-codebase-architecture, api-and-interface-design
- **03** → tdd, incremental-implementation, context-engineering
- **04** → tdd, story-authoring
- **05** → story-review
- **06** → progress-tracker
- **07** → systematic-debugging

## 冲突规则（必须遵守）

见 `skills-manifest.json` → `conflicts`。简述：

- **TDD**：lib/evaluator → `tdd`；新功能 → `test-driven-development`
- **Review**：叙事 → `story-review`；代码 PR → `review`
- **Init**：Shadow 树 → `harness-init`；CONTEXT/ADR → `setup-matt-pocock-skills`

## 不要

- 不要同时加载重叠 skill 的全文（浪费 context）
- 不要编辑 `skills/pool/` 里第三方副本 — Shadow 领域 skill 改 `skills/shadow/`
- 不要用通用 harness-init 模板覆盖 `01–07` 已有文档

## 维护

- 新增 npx skill：`npx skills add <repo> --skill <name> -y -a cursor`，然后更新 `skills-manifest.json`
- 改 Shadow skill：编辑 `skills/shadow/` 或 `skills/harness/`，运行 `skills/sync-cursor-links.sh`
