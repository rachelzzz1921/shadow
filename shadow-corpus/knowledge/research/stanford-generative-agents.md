# 斯坦福 Generative Agents（小镇）— 可借鉴点

来源：[Generative Agents: Interactive Simulacra of Human Behavior](https://arxiv.org/abs/2304.03442)（Park et al., 2023）

## 核心机制

| 机制 | 做法 | Shadow 对应 |
|------|------|-------------|
| **Memory Stream** | 观察按时间写入长期记忆 | 已有 `memory_stream[]`，逐年追加 |
| **Retrieval** | recency + relevance + importance 加权检索 | 当前为全量传递，可升级为智能检索 |
| **Reflection** | 周期性 synthesize 高层洞察写入记忆 | 缺：可在 Year 间或 Final 前插入 Reflection agent |
| **Planning** | 日计划 → 分解为动作 | 对应 Beats agent 的 pivotal/quiet 节奏 |
| **Re-planning** | 新观察触发计划修订 | 对应 **user_intervention** 后重规划该年叙事 |

## 迁移建议（P0）

1. **智能 memory 检索**：Final / Dialogue 前只取与当前主题相关的 memory 子集（见 [`migration-roadmap-p0-p3.md`](migration-roadmap-p0-p3.md)）
2. **Reflection beat**：在 pivotal 年后生成 1–2 条「主角内心总结」写入 memory_stream
3. **干预 → re-plan**：intervention 不应只改当年文本，应显式更新 beats 中后续 seed

## 不要照搬

- 小镇是空间导航 + 多 NPC；Shadow 是单主角线性年份叙事
- 小镇 memory 量级更大；Shadow 7 年上下文可控，检索策略应更轻

## 参考实现

- 官方：[joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents)
- 归档 demo 契约：`archive/demo-v0.2/lib/schemas.js`
