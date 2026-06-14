# 阶段三：编码与 Code Review

本阶段覆盖 AI 辅助编码（prompt 实现）与自动化审查流程。

## 文章列表

| 序号 | 标题 | 状态 |
|------|------|------|
| 01 | [叙事 Prompt 协议](./01-narrative-prompt-protocol.md) | ✅ |
| 02 | [Prompt 变更协议](./02-prompt-change-protocol.md) | ✅ |
| — | [六场景 Agent 提示词](./prompts/scene-agents/README.md) | ✅ 2026-06-14 入库 |

## 编码流水线

```
openspec spec / 需求文档
  ↓
加载 CLAUDE.md + 叙事协议 + contract
  ↓
修改 example/shadow-demo/lib/prompts.js
  ↓
post-edit-test hook → npm test
  ↓
story-review skill 抽检
  ↓
git commit（pre-commit-test hook）
```

## 核心工具

| 工具 / Hook | 作用 |
|------------|------|
| `lib/prompts.js` | 5 agent prompt 实现 |
| `pre-coding-spec-check` hook | 警告：改 lib/ 是否有对应需求文档 |
| `post-edit-test` hook | 改 lib/test 后跑 npm test |
| `pre-commit-test` hook | commit 前要求测试通过 |
