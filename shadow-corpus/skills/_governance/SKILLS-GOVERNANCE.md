# Shadow Skill 融合治理

更新时间：2026-06-14

Shadow 安装了 **81** 个 Agent Skill（含 `shadow-router`）。本文档说明如何管理、路由、更新，避免 80 个 skill 互相打架。

---

## 1. 目录结构（三层）

```
shadow-corpus/skills/
├── _governance/
│   ├── SKILLS-GOVERNANCE.md      ← 本文件
│   └── skills-manifest.json      ← 机器可读路由 + 冲突表
├── shadow/                       ★ Shadow 领域 skill 源码（改这里）
│   ├── story-authoring/
│   ├── story-review/
│   ├── fate-agent/
│   └── harness-init/
├── harness/                      ★ Harness 框架 skill 源码
│   ├── design-generator/
│   └── progress-tracker/
├── shadow-router/                ★ 任务入口，先读这个
├── pool/                         ← 75 个第三方 skill 完整副本
├── skills-lock.json              ← npx skills 版本锁定
├── sync-cursor-links.sh          ← 同步到 ../../.cursor/skills
└── README.md

shadow/.cursor/skills/            ← Cursor 发现（由 sync 脚本生成的软链）
```

**原则**

| 类型 | 编辑位置 | 更新方式 |
|------|----------|----------|
| Shadow 领域 | `shadow-corpus/skills/shadow/` | 改完跑 `./shadow-corpus/skills/sync-cursor-links.sh` |
| Harness 框架 | `shadow-corpus/skills/harness/` | 同上 |
| 第三方（mattpocock 等） | `pool/` 不直接改 | `npx skills update` 后重新复制到 `pool/` |

---

## 2. 分层（Tier）

| Tier | 名称 | 数量 | 说明 |
|------|------|------|------|
| T0 | 路由 | 1 | `shadow-router` — 不确定用哪个时先 invoke |
| T1 | Shadow 领域 | 4 | story-* , fate-agent, harness-init |
| T2 | Harness 框架 | 2 | design-generator, progress-tracker |
| T3 | 架构 | 8 | improve-codebase-architecture, grill-with-docs, ADR… |
| T4 | 工程全流程 | 13 | addyosmani 24 包中的核心子集 |
| T5 | 工作流 | 9 | obra superpowers |
| T6 | Matt 运维 | 8 | diagnose, tdd, to-issues, review… |
| T7 | Vercel 前端 | 5 | composition-patterns, react-best-practices… |
| T8 | 可选 | 14 | 写作、Obsidian、pre-commit 等，按需 |

完整列表见 [`skills-manifest.json`](skills-manifest.json)。

---

## 3. Harness 阶段 → Skill 映射

与 `01-requirements/` … `07-debug-and-correction/` 对齐：

| 阶段 | 首选 Skill | 典型触发语 |
|------|-----------|-----------|
| 01 需求 | `brainstorming` | 「需求还不清楚」「帮我想想这个功能」 |
| 02 方案 | `design-generator` | 「写技术方案」「design doc」 |
| 02 架构 | `improve-codebase-architecture` | 「重构 lib」「架构改进」 |
| 03 编码 | `tdd` | 「改 prompts.js」「加 evaluator 规则」 |
| 04 自测 | `tdd` + `story-authoring` | 「加 golden story」「npm test 失败」 |
| 05 QA | `story-review` | 「审一下这条故事线」 |
| 06 进度 | `progress-tracker` | 「现在进度在哪」「看板」 |
| 07 纠错 | `systematic-debugging` | 「live run 失败了」「trace 复盘」 |

横切：

- **Init** → `harness-init`（Shadow 文档）+ `setup-matt-pocock-skills`（CONTEXT/ADR）
- **Review PR** → `review` 或 `code-review-and-quality`
- **UI** → `frontend-ui-engineering` + `web-design-guidelines`

---

## 4. 冲突消解（重要）

多个 skill 覆盖同一话题时，**只 invoke 一个 primary**：

### TDD

| Skill | 何时用 |
|-------|--------|
| **`tdd`** (mattpocock) | 改 `example/shadow-demo/lib/`、evaluator、契约 |
| **`test-driven-development`** (superpowers) | 新功能从零实现、red-green-refactor 严格流 |

### Debug

| Skill | 何时用 |
|-------|--------|
| **`systematic-debugging`** | 任何 bug / test fail 的第一响应 |
| **`diagnose`** | 性能回归、难复现问题 |
| **`debugging-and-error-recovery`** | 通用工程 triage 流程 |

### Code Review

| Skill | 何时用 |
|-------|--------|
| **`story-review`** | 叙事 JSON、golden、trace、prompt 改动 |
| **`review`** | Git 分支 / PR diff |
| **`code-review-and-quality`** | 通用 merge 前质量门 |

### 需求澄清

| Skill | 何时用 |
|-------|--------|
| **`brainstorming`** | 新功能 / 创意探索 |
| **`interview-me`** | 用户只给了一句话 |
| **`grill-me`** | 已有方案，要拷问 |

### Init

| Skill | 何时用 |
|-------|--------|
| **`harness-init`** | Shadow CLAUDE.md、01–07、demo 地图 |
| **`setup-matt-pocock-skills`** | CONTEXT.md、docs/adr/、issue tracker 配置 |

---

## 5. 常用命令

```bash
# 列出全部 skill
npx skills list

# 更新第三方 skill（不动 skills/shadow、harness 源码）
npx skills update

# 同步 Shadow 领域软链
./skills/sync-shadow-skills.sh

# 新装第三方 skill
npx skills add <owner/repo> --skill <name> -y -a cursor
# 然后更新 skills-manifest.json 的 tiers
```

---

## 6. 推荐工作流

### 新 Agent 接入

```
shadow-router → harness-init → AGENTS.md 阅读顺序 → 开始任务
```

### 架构改进一轮

```
setup-matt-pocock-skills → improve-codebase-architecture → grill-with-docs → documentation-and-adrs
```

### 改 Prompt / Evaluator

```
tdd → story-authoring（若改 golden）→ story-review → 追加 06-task-progress/02-prompt-experiments-log.md
```

### 新功能（非叙事）

```
brainstorming → spec-driven-development → planning-and-task-breakdown → incremental-implementation → test-driven-development
```

---

## 7. 来源与许可

| 仓库 | Skill 数 | 许可 |
|------|---------|------|
| [mattpocock/skills](https://github.com/mattpocock/skills) | 29 | MIT |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 24 | MIT |
| [obra/superpowers](https://github.com/obra/superpowers) | 14 | MIT |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | 9 | MIT |
| Shadow / Harness 本地 | 5 + router | 项目内 |

---

## 8. 维护 checklist

- [ ] 改 Shadow skill → 只改 `skills/shadow/` 或 `skills/harness/`
- [ ] 跑 `./skills/sync-shadow-skills.sh`
- [ ] 新装 npx skill → 更新 `skills-manifest.json`
- [ ] 阶段文档变更 → 检查 `shadow-router` 路由表是否仍准确
- [ ] 季度 → `npx skills update` + 跑 `npm test`
