---
name: scene-agents
description: >-
  Operates Shadow's six scene Shadow Agents — base prompt, Scene Router, and
  per-domain lenses (family/love/friendship/academic/career/self_growth).
  Use when wiring scene routing, augmenting Year agent prompts, or implementing
  the P2 seven-year scene orchestrator with agentTrace JSON output.
---

# Scene Agents — 六场景平行人生推演

Shadow 在 **Fate Agent（时代背景）** 之上，按人生岔路口类型启用 **六域场景 lens**，指导七年叙事口径。

与 `fate-agent` 分工：fate-agent 管时代际遇与六域权重；scene-agents 管**叙事原则 + 场景推演边界 + 对话风格**。

与 `story-authoring` 分工：story-authoring 写 golden 正文与验收；scene-agents 管 **prompt 源码**与路由契约。

## 何时 invoke（触发词）

- 场景 Agent、六场景、Scene Router、primaryScene
- family / love / friendship / academic / career / self_growth 场景 prompt
- agentTrace、scene lens、Year prompt 注入
- 人工提示词入库、迭代场景推演规则

**不要**用本 skill 替代：`fate-agent`（语料/权重）、`story-review`（审叙事质量）。

## 第一步：选任务类型

```
用户要什么？
├─ 改场景 prompt 文案 ───────→ 03-coding/prompts/scene-agents/*.md
├─ 接 Year agent / demo ─────→ archive/demo-v0.2/lib/scene-agents-bridge.js
├─ Scene Router 行为 ────────→ scene-router.md + scenario-domains.mjs
├─ 完整七年 JSON 契约 ───────→ output-schema.md（P2 编排）
└─ 与 5-agent 管线对齐 ──────→ 01-narrative-prompt-protocol.md § Scene Agents
```

## 第二步：必读（按顺序）

| 顺序 | 文件 | 何时 |
|------|------|------|
| 1 | [`03-coding/prompts/scene-agents/README.md`](../../03-coding/prompts/scene-agents/README.md) | 总览与文件地图 |
| 2 | [`scene-agents-prompts.md`](../../03-coding/prompts/scene-agents/scene-agents-prompts.md) | 人工终稿 canonical |
| 3 | [`02-technical-design/04-scenario-weight-system.md`](../../02-technical-design/04-scenario-weight-system.md) | 六域与 Fate 权重 |
| 4 | [`reference.md`](reference.md) | 加载 API、接线点 |
| 5 | [`01-narrative-prompt-protocol.md`](../../03-coding/01-narrative-prompt-protocol.md) | 与 Year quiet/pivotal 口径对齐 |

## 六域与文件

| `scenario` | 中文 | Prompt 文件 |
|------------|------|-------------|
| `family` | 亲情 | `family.md` |
| `love` | 爱情 | `love.md` |
| `friendship` | 友情 | `friendship.md` |
| `academic` | 学业 | `academic.md` |
| `career` | 事业 | `career.md` |
| `self_growth` | 自我成长 | `self-growth.md` |

共享：`base-prompt.md`（总原则）、`scene-router.md`（路由）、`output-schema.md`（P2 JSON）。

## 程序化加载

```javascript
// ESM
import {
  loadScenePrompt,
  buildSceneAgentSystem,
  loadSceneRouterPrompt
} from '../../03-coding/prompts/scene-agents/index.mjs';

const system = buildSceneAgentSystem('academic');

// CJS（archive demo）
const bridge = require('./lib/scene-agents-bridge');
const { system, scene } = await bridge.buildSceneYearSystem(profile);
```

## 改 prompt 流程

1. 改对应 `.md` → 同步 `scene-agents-prompts.md`
2. 更新 `01-narrative-prompt-protocol.md` 若口径变
3. 追加 `06-task-progress/02-prompt-experiments-log.md`
4. `npm test --prefix archive/demo-v0.2`（含 scene-agents-bridge 测试）

## 验收清单

- [ ] 六域 `.md` 与 canonical 一致
- [ ] `index.mjs` / bridge 能加载全部 scene
- [ ] Scene Router 输出 `primaryScene` 与 `scenario-domains` 键名一致
- [ ] Year agent 注入后 golden eval 不回归（接入代码后）
