# Hook 机制 — Shadow

Hook 在 AI 操作关键节点自动介入，强制执行 Shadow Harness 约定。

## 事件模型

| 事件 | 触发时机 | Shadow 用途 |
|------|----------|-------------|
| `PreToolUse` | 工具调用前 | commit 前跑 test |
| `PostToolUse` | 工具调用后 | 改 lib/test 后跑 test；写 harness 文档更新 progress |

## Shadow Hook 全景

| Hook | 事件 | 实现 | 目的 |
|------|------|------|------|
| `post-edit-test` | PostToolUse(Edit/Write) | shell | 改 demo 代码后 `npm test` |
| `pre-coding-spec-check` | PreToolUse(Edit/Write) | shell | 警告：改 lib/ 是否读过 CLAUDE.md |
| `pre-commit-test` | PreToolUse(Bash=git commit) | shell | commit 前测试必须通过 |
| `post-progress-update` | PostToolUse(Write) | shell | 关键 harness 文档写入时提示更新 progress |

## 配置

合并到 [`tooling/claude-settings.json`](claude-settings.json)（复制到仓库根 `.claude/settings.json`）。

## 分工原则

- **确定性**（跑 test、路径检测）→ Shell
- **语义**（叙事质量、review）→ Skill / Subagent（story-review、debug-analyst）

## 接入

```bash
chmod +x hooks/scripts/*.sh
# 将 .claude/settings.json 复制或合并到项目 settings
```
