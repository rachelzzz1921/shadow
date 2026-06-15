# Shadow Agent 路演一页说明

更新时间：2026-06-15

> **交互路演页（推荐）：** [pitch.html](../../docs/pitch.html) — 参照 I Ching「沿路看看」纵向翻页，GitHub Pages：`/pitch.html`  
> **对外首页：** `/` · **采集生成：** `/generate.html` · **团队看板：** `/board.html`

## 一句话

Shadow 不是一个单 prompt 故事生成器，而是一套 **平行人生叙事 Harness**：用户输入一个人生岔路口，系统用多 Agent 协作、时代语料、记忆检索、介入选择和规则评测，生成一条可回放、可追问、可审计的七年“影子人生”。

## 它解决什么

大多数 AI 叙事 demo 的问题是“会写，但不可控”：情绪忽高忽低、每年都有大事、结尾变鸡汤、用户介入不影响后续、生成失败后无法复盘。Shadow 的核心思路是把创作拆成一条受约束的生产线，让模型负责“写”，让 Harness 负责“结构、记忆、反馈和停止条件”。

## 怎么做出来的

Shadow 的底座是一个七阶段 Harness：

1. **需求层**：定义平行人生、pivotal 年、用户介入、final 重量感等验收口径。
2. **方案层**：把叙事拆成 Goal / Actor / Feedback / Memory / Stop 的闭环。
3. **编码层**：把每个 Agent 的 prompt 写成协议，而不是散落在代码里的提示词。
4. **自测层**：用 golden story 和 evaluator 检查节奏、介入、记忆、结尾。
5. **QA 层**：用 story-review 审 trace、prompt 改动和 live run。
6. **进度层**：记录 prompt 实验、迭代日志和任务状态。
7. **纠错层**：遇到 schema fail、eval error、敏感输入时停止并复盘。

## Agent 管线

主流程是 5-agent 管线：

```text
Persona → Beats → Year × 7 → Final → Dialogue
```

- **Persona Agent** 写人格卡：软肋、决策倾向、成长种子，决定后续七年的心理动力。
- **Beats Agent** 排七年节奏：2-3 个 pivotal 年，其余 quiet 年，避免“年年大事”。
- **Year Agent** 每次只写一年：读取人格卡、过去 memory、全局 beats、时代背景和用户介入。
- **Final Agent** 收束七年：不复述剧情，必须有 regret，不写“另一条路也好”的鸡汤。
- **Dialogue Agent** 让用户随时问影子：回答必须引用 memory_stream，像走过七年的人说话。

此外还有三层增强 Agent：

- **Fate Agent**：接入 2006-2026 中国大陆时代语料库，把宏观事件和微观际遇作为背景压力注入 Year Agent。
- **Scene Agents**：按亲情、爱情、友情、学业、事业、自我成长六域选择不同叙事 lens。
- **RAG Kit**：给 memory、world、Dialogue、harness 文档、trace 做统一检索，支持本地规则 fallback 和向量升级。

## 为什么不是普通 Prompt

普通 prompt 只有“输入 → 生成”。Shadow 是闭环：

```text
用户 profile
  → Persona 建人格约束
  → Beats 规划七年节奏
  → Fate / Scene / RAG 提供现实背景与上下文
  → Year 逐年生成并写入 memory_stream
  → pivotal 年允许用户介入
  → 下一年必须承接 user_intervention
  → Final 收束
  → Evaluator + trace 判断是否可用
```

关键不是让模型更“会编”，而是让模型在明确边界内创作：

- quiet 年必须短，pivotal 年才重。
- pivotal 年才有 intervention，quiet 年不能弹窗。
- 用户选择是“已发生事实”，下一年不能忽略。
- Dialogue 必须引用记忆，不能凭空编。
- Final 必须有真实遗憾，不能强行治愈。

## 数据与记忆

Shadow 有四类记忆 / 语料：

- **memory_stream**：每年沉淀一个可引用的具体瞬间，支撑后续年份和 Dialogue。
- **world corpus**：2006-2026 每年真实 macro / micro 时代语料，按六域权重抽样。
- **harness docs**：整个项目的协议、skill、评测标准可被 RAG 检索，帮助 Agent 自我导航。
- **run trace**：每次 live run 记录 stage、intervention、eval、stop_reason，方便复盘。

## 质量怎么保证

质量不是靠“感觉不错”，而是三道门：

1. **Schema**：Zod 契约强制 Persona、Beats、Year、Final、Dialogue 的字段结构。
2. **Evaluator**：规则检查 pivotal 数量、quiet 长度、介入位置、memory 抽象度、final 鸡汤等反模式。
3. **Golden Story**：以“复读线”作为人工标定样本，验证 prompt 修改不会破坏核心体验。

## 可展示亮点

- 用户不是只能观看，还能在 pivotal 年介入影子的选择。
- 介入不是 UI 假按钮，会写入 session，并进入下一年 prompt。
- 每年生成都有 trace，可看到哪一步失败、为什么失败、eval 给了什么 warn。
- Fate / Scene / RAG 都是可替换层，不把业务逻辑焊死在一个 prompt 里。
- 无 key、无向量库时仍能走规则 fallback；有向量后可升级为 hybrid retrieval。

## 对外讲法

可以把 Shadow 讲成一句话：

> 我们不是在做一个“会写故事的 AI”，而是在做一个能被干预、能记住、能复盘、能持续变好的叙事 Agent Harness。

如果路演只讲一个技术点，就讲这个：

> Prompt 负责表达，Harness 负责因果。Shadow 的产品力来自二者分工。

## 关键词

平行人生 · Multi-Agent · Narrative Harness · Memory Stream · User Intervention · Fate Agent · Scene Agents · Hybrid RAG · Golden Eval · Trace Review
