# Scene Agents — Reference

## 文件地图

```
shadow-corpus/03-coding/prompts/scene-agents/
├── README.md
├── scene-agents-prompts.md    # 人工终稿（九节合一）
├── base-prompt.md
├── scene-router.md
├── family.md … self-growth.md
├── output-schema.md
└── index.mjs                  # ESM loader

archive/demo-v0.2/lib/
├── scene-agents-bridge.js     # CJS loader + profile → scene
└── scenario-classify.js       # → world/lib/scenario-domains.mjs

world/lib/scenario-domains.mjs # 关键词分类（与 LLM Router 互补）
```

## 编排模型（当前 vs P2）

| 层 | 当前（archive demo） | P2 目标（人工终稿） |
|----|---------------------|---------------------|
| 路由 | `classifyProfile` 关键词 | LLM Scene Router + 关键词交叉验证 |
| 叙事 | Persona → Beats → Year×7 → Final | Base + Scene lens → 七年 timeline JSON |
| 时代 | Fate → Year `# 时代际遇层` | 同上，写入 `constraintsUsed` |
| 追溯 | run trace | `agentTrace` 块 |

P2 前：**Year agent system 可叠加 scene lens**，schema 仍为逐年 `years[]`。

## buildSceneAgentSystem 拼接顺序

```
base-prompt.md
---
{scene}.md
---
output-schema.md   # 仅 P2 / 一次性生成时 includeOutputSchema: true
```

## Scene Router 输出契约

```jsonc
{
  "primaryScene": "academic",       // SCENARIO_DOMAINS 之一
  "secondaryTags": ["家庭期待"],    // 自由文本标签
  "reason": "…"
}
```

## agentTrace 输出契约（P2）

见 `output-schema.md` — 与 Fate `scenario_primary` 应对齐。

## 测试

```bash
npm test --prefix archive/demo-v0.2 -- test/scene-agents-bridge.test.js
```
