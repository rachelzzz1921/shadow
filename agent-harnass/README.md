# Agent Harness Workspace

这个仓库是一套可复用的 AI Agent Harness 研究与工程实践资料库。它把“提示词怎么写”扩展成更完整的系统设计问题：模型看见什么、如何执行、如何验证、如何记忆、什么时候停止或升级给人。

核心主张：

```text
Prompt Engineering -> Context Engineering + Harness Engineering + Skill Engineering
```

## 这个仓库适合做什么

- 设计可重复运行的 agent 工作流，而不是一次性的 prompt。
- 把 OpenAI、Google / DeepMind、Anthropic 和论文里的 agent 模式沉淀成工程清单。
- 为未来的 coding agent、research agent、multi-agent workflow 或 skill package 提供参考。
- 维护一份带来源、日期和复用说明的 harness 知识库。

## 仓库结构

```text
.
├── AGENTS.md
├── agent.md
├── docs/
│   └── harness/
│       ├── expert-index.md
│       ├── reuse-summary.zh-CN.md
│       └── source-map.md
└── skills/
    └── harness-maintenance/
        └── SKILL.md
```

- `AGENTS.md`：给 coding agent 的仓库级操作规则和阅读顺序。
- `agent.md`：HARNESS Engineering Playbook，主工程手册。
- `docs/harness/reuse-summary.zh-CN.md`：中文速览，说明研究来源如何映射到可复用模块。
- `docs/harness/source-map.md`：来源地图，记录每个重要主张的来源、链接和复用方式。
- `docs/harness/expert-index.md`：专家、作者、团队和模式索引。
- `skills/harness-maintenance/SKILL.md`：维护、扩展、审计这套 harness 文档时使用的 Codex skill。

## 快速开始

1. 先读 `agent.md`，理解核心定义、最小闭环和设计模式。
2. 如果想快速了解全貌，读 `docs/harness/reuse-summary.zh-CN.md`。
3. 如果要修改任何来源相关的说法，先查 `docs/harness/source-map.md`。
4. 如果要追踪某个 provider、作者或论文模式，查 `docs/harness/expert-index.md`。
5. 如果要新增工作流、来源或 skill，按 `skills/harness-maintenance/SKILL.md` 的流程维护。

## 核心概念

### Context Engineering

设计模型能看见什么，包括目标、约束、成功标准、代码、文档、工具 schema、环境状态、历史决策和压缩后的长期上下文。

### Harness Engineering

设计 agent 被嵌入什么系统里，包括执行循环、工具注册、沙箱和权限、日志、追踪、测试、评估、人工审批、故障处理、重试、停止条件和交接路径。

### Skill Engineering

把可重复的任务方法封装成可发现、可渐进加载、可测试的程序化能力，例如 `SKILL.md`、脚本、模板、参考资料和验收清单。

## 最小 Harness Loop

一个可靠的 agent harness 至少要显式定义六个部分：

1. `Goal`：目标、约束和验收标准。
2. `Actor`：谁执行下一步，可能是 agent、subagent、脚本或人。
3. `Environment`：代码库、浏览器、API、数据源、凭据边界和可用工具。
4. `Feedback`：测试、日志、截图、trace、CI、eval、review 或人工确认。
5. `Memory`：持久文档、任务板、进度记录、source map、决策和产物。
6. `Stop condition`：完成、阻塞、不安全、低置信度、超预算或需要交接。

少了其中任何一项，系统仍然可能回答问题，但还不是一个可靠的 harness。

## 维护原则

- 把 harness work 当作系统设计，而不是 prompt 收集。
- 先更新 `docs/harness/source-map.md`，再修改 `agent.md` 里的广泛主张。
- provider 相关内容优先使用官方文档、官方博客、论文或项目仓库。
- 对会变化的事实保留日期和来源。
- 新增工作流时必须包含验收检查、反馈信号、停止条件和升级路径。
- 只有当流程能跨任务复用时，才沉淀成新的 skill。

## 推荐工作流

### 新增一个来源

1. 找到官方或一手来源。
2. 在 `docs/harness/source-map.md` 中记录来源、链接、日期和复用说明。
3. 如果来源对应某个作者、团队或论文模式，同步更新 `docs/harness/expert-index.md`。
4. 只有当来源能改变工程实践时，才更新 `agent.md`。

### 新增一个 Harness 模式

1. 用一段话写清目标和适用场景。
2. 明确 goal、actor、environment、feedback、memory 和 stop condition。
3. 写出验收检查和失败时的升级路径。
4. 把模式放进 `agent.md`，并在 `source-map.md` 记录证据。

### 新增一个 Skill

1. 确认流程会被重复使用。
2. 建立独立的 skill 目录和 `SKILL.md`。
3. 写清触发条件、工作流、需要读取的参考资料和输出标准。
4. 保持 progressive disclosure：默认只读必要信息，复杂材料按需加载。

## 当前状态

- 主 playbook 已在 `agent.md`。
- 来源地图和专家索引已在 `docs/harness/`。
- 仓库自带一个维护 skill：`harness-maintenance`。
- 这个仓库没有构建步骤、运行时依赖或测试命令；它目前是文档和方法库。

