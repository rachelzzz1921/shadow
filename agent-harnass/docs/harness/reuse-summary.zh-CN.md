# HARNESS 调研摘要与复用映射

更新时间：2026-06-10

用途：把图片里的 Loop Engineering 思路，以及 OpenAI、Google/DeepMind、Anthropic 的 agent 资料，压缩成后续工程复用时能快速检索的一页。

## 1. 图片内容抽取

图片核心判断：

- 传统 Prompt/Workflow 是开环：人提出任务，AI 生成结果，人检查，发现问题再提示。
- Loop Engineering 是闭环：系统发现任务，Agent 执行，自动验证，写入记忆或任务板，再决定下一步。
- 一句话区别：传统模式是“人在循环里”，Loop Engineering 是“系统在循环里”。
- 闭环的 6 个关键部件：目标、执行者、环境、反馈、记忆、停止条件。
- Prompt Engineering 解决“怎么问”；Context Engineering 解决“给 AI 看什么”；Loop/Harness Engineering 解决“以后这类事怎么不用人反复盯”。

工程化翻译：

- 目标：任务、验收标准、风险边界。
- 执行者：主 Agent、子 Agent、脚本、人类 reviewer。
- 环境：代码库、浏览器、API、数据库、CI、权限、沙箱。
- 反馈：测试、日志、CI、截图、监控、人工审核。
- 记忆：文档、任务板、Issue、progress log、source map。
- 停止条件：完成、失败、风险、低置信度、预算耗尽、交给人。

## 2. 三家公司资料到 HARNESS 模块的映射

| 来源 | 代表资料 | HARNESS 可复用模块 |
| --- | --- | --- |
| OpenAI | Agents SDK、A practical guide to building agents、Harness Engineering、Lilian Weng agent 综述 | agent loop、tools、handoffs、guardrails、tracing、AGENTS.md、repo-native memory |
| Google/DeepMind | Agents whitepaper、ADK、A2A、SIMA、AI Harness Engineering paper | model + tools + orchestration、sessions、artifacts、evals、multi-agent protocol、runtime substrate |
| Anthropic | Building effective agents、Effective context engineering、Agent Skills、MCP、多代理研究系统 | workflows vs agents、prompt chaining、routing、orchestrator-worker、evaluator-optimizer、context compaction、SKILL.md |

## 3. 专家与作者索引

| 公司 | 人物或团队 | 可复用观点 |
| --- | --- | --- |
| OpenAI | Jakub Pachocki | 首席科学家视角下，安全、权限、guardrails、升级/停止条件必须进入 agent harness，而不是事后补丁。 |
| OpenAI | Lilian Weng | Agent 可以拆成 planning、memory、tool use、reflection；这正好对应 harness 的目标、记忆、工具、反馈循环。 |
| OpenAI | Ryan Lopopolo | Harness Engineering 强调 repo 是系统记录，`AGENTS.md` 是入口，测试、CI、日志、截图、skills 都是 agent 的工作环境。 |
| Google | Jeff Dean | Agent 不是单个 prompt，而是模型、系统、工具接口、可观测性、产品环境的整体工程。 |
| Google | ADK/A2A 团队 | 生产级 agent 需要 sessions、artifacts、evals、callbacks、A2A/MCP 边界和多 agent 协议。 |
| Anthropic | Erik S.、Barry Zhang | 先用 workflow，再上 agent；优先选择 prompt chaining、routing、parallelization、orchestrator-worker、evaluator-optimizer 等简单模式。 |
| Anthropic | Prithvi Rajasekaran、Ethan Dixon、Carly Ryan、Jeremy Hadfield 等 | Context 是有限资源，需要 just-in-time retrieval、compaction、结构化笔记和 subagents。 |
| Anthropic | Barry Zhang、Keith Lazuka、Mahesh Murag | Skills 是可发现、可分层加载的程序化能力包，不是把所有经验塞进一个长 prompt。 |

说明：Anthropic 当前公开公司页没有稳定展示“Chief Scientist”字段，因此本仓库不硬造头衔，改用 Anthropic 官方工程文章作者与公司级研究定位来归档。

## 4. 论文与模式索引

| 模式 | 来源 | 复用方法 |
| --- | --- | --- |
| ReAct | Synergizing Reasoning and Acting in Language Models | 把 reasoning、action、observation 做成循环，适合工具调用任务。 |
| Reflexion | Language Agents with Verbal Reinforcement Learning | 失败后写反思，作为下一次重试的 memory/feedback。 |
| Voyager | An Open-Ended Embodied Agent with Large Language Models | 把成功轨迹升级为 skill library。 |
| Generative Agents | Interactive Simulacra of Human Behavior | 分离短期上下文、长期记忆、反思、规划。 |
| SWE-agent | Agent-Computer Interfaces Enable Automated Software Engineering | 优化 agent-computer interface：文件视图、shell、测试、编辑、观察结果。 |
| AI Harness Engineering | A Runtime Substrate for Foundation-Model Software Agents | 把任务规范、上下文选择、工具权限、验证、可观测性、干预记录做成运行时基座。 |

## 5. 后续复用方式

新建一个 agent workflow 时，直接复制这个结构：

```text
目标：
执行者：
环境：
上下文：
工具：
反馈：
记忆：
停止条件：
验收证据：
升级/交给人：
```

如果某个流程会重复 3 次以上，把它升级成 skill：

```text
skills/<name>/SKILL.md
- 什么时候使用
- 输入是什么
- 步骤是什么
- 要查哪些来源
- 输出什么文件
- 怎么验证
- 什么时候停止或交给人
```

## 6. 当前仓库产物

- `AGENTS.md`：给未来 agent 的入口和工作规则。
- `agent.md`：主要 HARNESS 工程 playbook。
- `docs/harness/source-map.md`：来源地图和证据链。
- `docs/harness/expert-index.md`：专家、作者、团队和模式索引。
- `docs/harness/reuse-summary.zh-CN.md`：中文速查与复用映射。
- `skills/harness-maintenance/SKILL.md`：后续维护这套文档的 skill。

