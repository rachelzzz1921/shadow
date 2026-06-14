# Shadow Corpus — 目录统筹

更新时间：2026-06-14  
本文件是 **shadow-corpus/** 的总索引。所有文字、Skill、夹具、工具配置均在此目录内。

---

## 1. 入口文件

| 文件 | 用途 |
|------|------|
| [`README.md`](README.md) | 项目总览 |
| [`MANIFEST.md`](MANIFEST.md) | 本索引 |
| [`AGENTS.md`](AGENTS.md) | Agent 阅读顺序 |
| [`CLAUDE.md`](CLAUDE.md) | AI 编程约束 |

---

## 2. Harness 七阶段（01–07）

| 阶段 | 目录 | 核心内容 |
|------|------|----------|
| 01 需求 | [`01-requirements/`](01-requirements/) | 产品目标、介入需求、验收口径 |
| 02 方案 | [`02-technical-design/`](02-technical-design/) | Harness 架构、API 契约、5-agent 管线 |
| 03 编码 | [`03-coding/`](03-coding/) | 叙事 Prompt 协议、改 prompt 流程 |
| 04 自测 | [`04-dev-testing/`](04-dev-testing/) | Evaluator 规则、golden 引用、`npm test` 说明 |
| 05 QA | [`05-qa-testing/`](05-qa-testing/) | story-review 门禁、E2E 场景 |
| 06 进度 | [`06-task-progress/`](06-task-progress/) | Run trace、prompt 实验日志 |
| 07 纠错 | [`07-debug-and-correction/`](07-debug-and-correction/) | Stop 策略、trace 复盘、纠错循环 |

每阶段目录含 `index.md` 作为子索引。

---

## 3. 知识库（knowledge/）

| 路径 | 内容 |
|------|------|
| [`knowledge/research/stanford-generative-agents.md`](knowledge/research/stanford-generative-agents.md) | 斯坦福小镇：记忆检索、反思、干预重规划 |
| [`knowledge/research/mirofish-swarm-simulation.md`](knowledge/research/mirofish-swarm-simulation.md) | MiroFish：GraphRAG、沙盒对比、ReportAgent |
| [`knowledge/research/migration-roadmap-p0-p3.md`](knowledge/research/migration-roadmap-p0-p3.md) | 可迁移能力路线图 P0–P3 |
| [`knowledge/external/agent-harnass-index.md`](knowledge/external/agent-harnass-index.md) | 通用 Harness 研究语料索引（仓库内 `agent-harnass/`） |

---

---

## 4. Visual 呈现（visual/）

| 路径 | 说明 |
|------|------|
| [`visual/README.md`](visual/README.md) | 像素风模块总览 |
| [`visual/01-pipeline.md`](visual/01-pipeline.md) | 素材→Excel→AI 布局→Phaser |
| [`visual/stories/fuxduxian/`](visual/stories/fuxduxian/) | 第一期：复读线 7 景 + 7 动画 |
| Change | `CHG-V001` |

**注意：** 复读线文案先改 v2（`narrative-gaps.md`），再锁视觉 layout。

---

## 5. Skill 体系（skills/）

```
skills/
├── README.md
├── skills-lock.json              # npx skills 版本锁定
├── sync-cursor-links.sh          # 同步到 .cursor/skills
├── _governance/
│   ├── SKILLS-GOVERNANCE.md      # 融合治理（分层、冲突、工作流）
│   └── skills-manifest.json      # 机器可读路由表
├── shadow/                       # ★ Shadow 领域（改这里）
│   ├── story-authoring/
│   ├── story-review/
│   ├── fate-agent/
│   └── harness-init/
├── harness/                      # ★ Harness 框架
│   ├── design-generator/
│   └── progress-tracker/
├── shadow-router/                # ★ 任务入口路由
└── pool/                         # 75 个第三方 Skill（完整副本）
```

**统计**：Shadow 自有 4 + Harness 2 + 路由 1 + 第三方 75 = **82**

---

## 6. 夹具（fixtures/）

| 路径 | 说明 |
|------|------|
| [`fixtures/golden-stories/复读线.json`](fixtures/golden-stories/复读线.json) | Golden 故事 JSON（evaluator 基准） |
| [`fixtures/golden-stories/复读线.md`](fixtures/golden-stories/复读线.md) | 复读线叙事说明与验收要点 |

## 7. 世界语料（world/）

| 路径 | 说明 |
|------|------|
| [`world/README.md`](world/README.md) | 2006–2026 中国大陆时代语料库 + Supabase seed |
| [`world/data/years/`](world/data/years/) | 冻结 JSON（21 年 × macro≥30 micro≥80） |
| [`01-requirements/03-fate-agent-requirements.md`](01-requirements/03-fate-agent-requirements.md) | 命运 Agent 需求 |

## 8. 工具（tooling/）

| 路径 | 说明 |
|------|------|
| [`tooling/hooks/`](tooling/hooks/) | Post/Pre tool hooks（test、spec-check、progress） |
| [`tooling/agents/`](tooling/agents/) | Subagent：`story-reviewer`、`debug-analyst` |
| [`tooling/claude-settings.json`](tooling/claude-settings.json) | Claude Code hook 配置模板 |

---

## 7. 归档（archive/）

| 路径 | 说明 |
|------|------|
| [`archive/demo-v0.2/`](archive/demo-v0.2/) | 旧版 Node demo：server、lib、public、test、runs |

**推翻 demo 的含义**：demo 不再作为项目主结构；契约与 evaluator 逻辑以文档 + fixtures + 归档代码三方对照。

---

## 8. 推荐阅读顺序

1. [`AGENTS.md`](AGENTS.md)
2. [`02-technical-design/01-shadow-harness-loop.md`](02-technical-design/01-shadow-harness-loop.md)
3. [`03-coding/01-narrative-prompt-protocol.md`](03-coding/01-narrative-prompt-protocol.md)
4. [`fixtures/golden-stories/复读线.md`](fixtures/golden-stories/复读线.md)
5. [`skills/_governance/SKILLS-GOVERNANCE.md`](skills/_governance/SKILLS-GOVERNANCE.md)
6. [`knowledge/research/migration-roadmap-p0-p3.md`](knowledge/research/migration-roadmap-p0-p3.md)

---

## 9. 仓库根目录关系

```
shadow/                          # 工作区根
├── README.md                    # 指向 shadow-corpus/
├── shadow-corpus/               # ★ 本统筹包（主内容）
├── .cursor/skills/              # Cursor 发现（由 sync 脚本生成）
├── agent-harnass/               # 通用 Harness 研究（参考，未迁入 corpus）
└── archive/、assets/ 等         # 与 Shadow Harness 无关的素材
```
