# Shadow Harness 框架示意图

更新时间：2026-06-14

> **交互版：** 在 Cursor 中打开 Canvas [`shadow-harness-framework`](../../canvases/shadow-harness-framework.canvas.tsx)  
> **闭环详解：** [01-shadow-harness-loop.md](./01-shadow-harness-loop.md)

---

## 1. 总览：三层 + 横切

```mermaid
flowchart TB
  subgraph UX["用户层"]
    U[Profile 岔路口] --> N[七年叙事 + 介入 + 对话]
    N --> V[像素风 Visual A/B/C]
  end

  subgraph H["Harness 横切"]
    direction LR
    C[可约束] --- E[可评估] --- T[可追溯] --- X[可扩展]
  end

  subgraph ENG["工程层 01–07"]
    R1[01 需求] --> R2[02 方案] --> R3[03 编码]
    R3 --> R4[04 自测] --> R5[05 QA] --> R6[06 进度] --> R7[07 纠错]
    R7 -.-> R1
  end

  subgraph LOOP["六要素闭环"]
    direction LR
    G[Goal] --> A[Actor] --> Env[Environment]
    Env --> F[Feedback] --> M[Memory] --> S[Stop]
    S -.-> G
  end

  UX --> ENG
  H --- ENG
  LOOP --- ENG
```

---

## 2. 六要素闭环（Shadow 落地）

```mermaid
flowchart LR
  subgraph Goal
    G1[七年平行人生]
    G2[pivotal 介入]
    G3[golden + eval 验收]
  end

  subgraph Actor
    P[Persona]
    B[Beats]
    Y[Year×7]
    F[Final]
    D[Dialogue]
    U[User 介入]
  end

  subgraph Feedback
    Z[Zod schema]
    EV[evaluator.js]
    SR[story-review 👤]
  end

  subgraph Memory
    MS[memory_stream]
    DOC[01–07 文档]
    SK[Skills]
    TR[runs trace]
  end

  Goal --> Actor
  Actor --> Feedback
  Feedback --> Memory
  Memory --> Actor
```

| 要素 | Shadow 落点 | 目录/文件 |
|------|-------------|-----------|
| **Goal** | 验收标准、golden | `01-requirements/`, `fixtures/golden-stories/` |
| **Actor** | 5-agent + User + Evaluator | `archive/demo-v0.2/lib/`, `03-coding/` |
| **Environment** | Node + LLM + Web + Visual | `archive/`, `visual/engine/` |
| **Feedback** | 机械 eval + 人工 review | `04-dev-testing/`, `05-qa-testing/` |
| **Memory** | 故事 + 文档 + trace | `memory_stream`, `06-task-progress/` |
| **Stop** | 完成 / error / 敏感 / 放弃 | `07-debug-and-correction/` |

---

## 3. SDLC 七阶段（01–07）

```mermaid
flowchart LR
  A1["01 需求<br/>brainstorming"] --> A2["02 方案<br/>design-generator"]
  A2 --> A3["03 编码<br/>tdd"]
  A3 --> A4["04 自测<br/>tdd + story-authoring"]
  A4 --> A5["05 QA<br/>story-review"]
  A5 --> A6["06 进度<br/>progress-tracker"]
  A6 --> A7["07 纠错<br/>systematic-debugging"]
  A7 -.-> A1

  H[Hooks + 81 Skills] -.-> A1
  H -.-> A3
  H -.-> A6
```

| 阶段 | 目录 | 首选 Skill |
|------|------|------------|
| 01 | [`01-requirements/`](../01-requirements/) | brainstorming |
| 02 | [`02-technical-design/`](./) | design-generator |
| 03 | [`03-coding/`](../03-coding/) | tdd |
| 04 | [`04-dev-testing/`](../04-dev-testing/) | tdd, story-authoring |
| 05 | [`05-qa-testing/`](../05-qa-testing/) | story-review |
| 06 | [`06-task-progress/`](../06-task-progress/) | progress-tracker |
| 07 | [`07-debug-and-correction/`](../07-debug-and-correction/) | systematic-debugging |

---

## 4. Live 叙事管线（5-Agent）

```mermaid
sequenceDiagram
  participant User
  participant API as server.js
  participant P as Persona
  participant B as Beats
  participant Y as Year
  participant F as Final
  participant E as Evaluator

  User->>API: POST /story/start
  API->>P: 人格卡
  P->>B: 七年节奏
  B->>E: eval beats
  loop 7 years
    User->>API: POST /story/year
    opt pivotal
      User->>Y: intervention
    end
    Y->>E: eval year
  end
  User->>API: POST /story/final
  API->>F: 收束
  F->>E: eval story
  API->>API: write runs/{id}.json
```

---

## 5. Visual 呈现链（并行）

```mermaid
flowchart LR
  S[网上像素素材] --> X[Excel/CSV 建档]
  X --> C[标杆案例人审]
  N[年叙事文本] --> AI[AI layout JSON]
  X --> AI
  AI --> H[人审构图]
  H --> P[Phaser 渲染]
  P --> UX[体验 A/B/C]
```

详见 [`visual/01-pipeline.md`](../visual/01-pipeline.md)

---

## 6. 语料库结构

```text
shadow-corpus/
├── 01-requirements/ … 07-debug-and-correction/   ← Harness 文档
├── skills/          ← 81 Skill（shadow + harness + pool）
├── fixtures/        ← golden stories
├── visual/          ← 像素风模块
├── tooling/         ← hooks + subagents
├── archive/demo-v0.2/  ← 归档实现参考
└── 06-task-progress/   ← 看板 + registry
```

---

## 7. 与通用 Harness 的关系

```text
agent-harnass/          Context + Harness 元框架（研究语料）
        ↓
shadow-corpus/          Shadow 领域落地（叙事 + eval + visual）
        ↓
jackhoward24 四支柱      可约束 · 可评估 · 可追溯 · 可扩展
```

通用参考：[`agent-harnass/`](../../agent-harnass/README.md) · 外部 Canvas：[`harness-engineering-in-ai-coding`](../../canvases/harness-engineering-in-ai-coding.canvas.tsx)
