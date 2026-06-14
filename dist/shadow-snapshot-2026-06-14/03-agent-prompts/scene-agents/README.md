# Shadow 六场景 Agent 提示词

更新时间：2026-06-14  
来源：人工终稿（微信文档入库）

## 文件地图

| 文件 | 用途 |
|------|------|
| [`scene-agents-prompts.md`](./scene-agents-prompts.md) | **完整 canonical 文档**（九节合一，人审基准） |
| [`base-prompt.md`](./base-prompt.md) | Base：平行人生推演总提示词 |
| [`scene-router.md`](./scene-router.md) | Scene Router：六域路由 |
| [`family.md`](./family.md) … [`self-growth.md`](./self-growth.md) | 六域场景 Agent system prompt |
| [`output-schema.md`](./output-schema.md) | 最终 JSON 契约（含 `agentTrace`） |
| [`index.mjs`](./index.mjs) | 程序化加载：`loadScenePrompt()` / `buildYearSystemWithScene()` |

## 与现有 5-agent 管线的关系

当前归档 demo（Persona → Beats → Year×7 → Final → Dialogue）**仍为主路径**。

六场景 Agent 是 **Year 叙事层的场景 lens**：

```
用户 profile
  → Scene Router（scene-router.md）→ primaryScene + secondaryTags
  → Fate Agent（时代背景 + scenario_weights）
  → Year Agent system = base-prompt + {scene}.md + 叙事协议 quiet/pivotal 口径
```

完整七年一次性 JSON（`output-schema.md`）是 **P2 编排目标**；接入前 Year schema 不变。

## 代码接线

| 模块 | 路径 |
|------|------|
| Prompt 加载 | `03-coding/prompts/scene-agents/index.mjs` |
| CJS bridge | `archive/demo-v0.2/lib/scene-agents-bridge.js` |
| 场景分类 | `world/lib/scenario-domains.mjs`（关键词路由，与 Scene Router 互补） |
| Skill | `skills/shadow/scene-agents/SKILL.md` |

## 改 prompt 时

1. 先改本节对应 `.md`，再同步 [`scene-agents-prompts.md`](./scene-agents-prompts.md) 保持一致
2. 更新 [`01-narrative-prompt-protocol.md`](../../01-narrative-prompt-protocol.md) 若口径变
3. 追加 [`06-task-progress/02-prompt-experiments-log.md`](../../../06-task-progress/02-prompt-experiments-log.md)
