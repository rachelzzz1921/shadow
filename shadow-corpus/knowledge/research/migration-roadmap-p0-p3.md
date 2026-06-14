# Shadow 能力迁移路线图 P0–P3

基于斯坦福小镇与 MiroFish 分析，按 **Harness 闭环** 排序。

## P0 — 立即可做（文档 + 归档 demo）

| 项 | 内容 | 落点 |
|----|------|------|
| Memory 检索 | Final 前按 relevance 筛选 memory_stream | `03-coding/` 协议 + `archive/demo-v0.2/lib/` |
| Reflection | pivotal 年后 1 条反思写入 memory | 新 agent 步骤文档在 `02-technical-design/` |
| Intervention re-plan | 干预后更新后续 beat seed | `03-coding/01-narrative-prompt-protocol.md` |

## P1 — 评估增强

| 项 | 内容 | 落点 |
|----|------|------|
| 多 run 对比 | 同 golden 不同 model 的 eval 表 | `06-task-progress/03-run-comparison-template.md` |
| Trace 复盘 Skill | 强化 `story-review` 对 runs 的检查清单 | `skills/shadow/story-review/` |

## P2 — 自动化报告

| 项 | 内容 | 落点 |
|----|------|------|
| Post-final report | eval + 叙事摘要 Markdown | `05-qa-testing/` |
| Hook 集成 | final 后触发 review subagent | `tooling/agents/story-reviewer.md` |

## P3 — 可选扩展

| 项 | 内容 | 落点 |
|----|------|------|
| Beats 关系图 | 可视化 pivotal/quiet 链 | `knowledge/` 或独立 canvas |
| 空间化 NPC | 非当前产品方向 | 不优先 |

## 原则

1. **文档先行**：P0 可只更新 02/03 阶段文档与 fixtures，不强制改归档 demo
2. **Eval 不降级**：任何迁移必须过 `fixtures/golden-stories/复读线.json`
3. **Skill 路由**：实现前 invoke `shadow-router` 选 `tdd` / `story-authoring` / `improve-codebase-architecture`

## 相关阅读

- [`stanford-generative-agents.md`](stanford-generative-agents.md)
- [`mirofish-swarm-simulation.md`](mirofish-swarm-simulation.md)
- [`../../02-technical-design/01-shadow-harness-loop.md`](../../02-technical-design/01-shadow-harness-loop.md)
