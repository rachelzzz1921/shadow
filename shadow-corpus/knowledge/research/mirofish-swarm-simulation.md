# MiroFish — 可借鉴点

MiroFish 类 swarm / 多智能体仿真平台（公开资料与社区实现），强调 **种子 → 图谱 → 沙盒运行 → 对比报告**。

## 核心模式

| 模式 | 说明 | Shadow 映射 |
|------|------|-------------|
| **Seed → Graph** | 从种子实体扩展关系图谱（GraphRAG） | Persona + Beats 可视为「叙事图谱」的前两跳 |
| **Sandbox runs** | 同一 seed 多参数并行跑，对比 outcome | 同一 golden 用不同 model/prompt 跑 eval 对比 |
| **ReportAgent** | 自动汇总 run 差异、结论、建议 | 对应 `story-review` + trace 复盘文档 |
| **Intervention hooks** | 运行中注入外部事件 | 已有 `user_intervention` 在 pivotal 年 |

## 迁移建议

1. **对比 run 面板**（P1）：`06-task-progress/` 增加「同 seed 多 run」对比模板
2. **Report 自动化**（P2）：Final 后自动生成 eval + 叙事质量摘要 Markdown
3. **Graph 可视化**（P3）：Beats 与 memory 关系图（非必须）

## 与 Harness 的关系

- Sandbox compare = **Feedback** 层的多样本验证
- ReportAgent = **Memory** 层的结构化复盘
- 与 `04-dev-testing/` evaluator + `05-qa-testing/` story-review 门禁互补

## 注意

- MiroFish 偏社会仿真规模；Shadow 保持 **单主角、7 年、强 eval 规则** 的窄域优势
- 引入 GraphRAG 前需明确：是为 **调试/trace** 还是为 **生成质量** — 建议先做后者（memory 检索）
