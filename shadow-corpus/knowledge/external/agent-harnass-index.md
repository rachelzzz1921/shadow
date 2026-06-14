# agent-harnass — 外部参考索引

仓库根目录 [`../../../agent-harnass/`](../../../agent-harnass/) 保留 **通用 Agent Harness 研究语料**，未整体迁入 shadow-corpus（体量大、与 Shadow 叙事域正交）。

## 何时读

- 设计 **跨项目** Harness 模式（Context / Tool / Verify / Memory / Stop）
- 对比 OpenAI / Anthropic / 论文中的 agent 模式
- 维护 harness 文档结构时

## 关键文件

| 文件 | 说明 |
|------|------|
| `agent-harnass/AGENTS.md` | 仓库级 Agent 规则 |
| `agent-harnass/agent.md` | HARNESS Engineering Playbook |
| `agent-harnass/docs/harness/reuse-summary.zh-CN.md` | 中文速览 |
| `agent-harnass/docs/harness/source-map.md` | 来源地图 |
| `agent-harnass/skills/harness-maintenance/SKILL.md` | 维护 skill |

## 与 shadow-corpus 的关系

| agent-harnass | shadow-corpus |
|---------------|---------------|
| 通用 harness 研究 | Shadow 平行人生 **落地** 文档 + Skill |
| 无叙事域 | 01–07 + story-* + golden fixtures |
| 独立 skills | `skills/shadow/` + `skills/pool/` |

Shadow 的 Harness 落地闭环见 [`../../02-technical-design/01-shadow-harness-loop.md`](../../02-technical-design/01-shadow-harness-loop.md)。
