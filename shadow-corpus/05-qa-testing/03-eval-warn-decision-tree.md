# Eval Warn 决策树

任务：**W-10** · 配合 `lib/evaluator.js` 与 P4 人工 review

## 流程

```text
evaluateStory / evaluateYear 产出 findings
    │
    ├─ severity === error ──→ 必须修复后再合并/演示（Gate G3 不过）
    │
    └─ severity === warn ──→ 本决策树
              │
              ├─ 结构性 warn（见下「必改」）──→ 当 error 处理
              │
              ├─ 叙事 warn + golden 也有 ──→ 记录，可 Pass with warns
              │
              └─ 仅 live run 出现 ──→ 记入 02-prompt-experiments-log，抽测 3 条
```

## 必改（warn 当 error）

| code | 理由 |
|------|------|
| `beats.pivotal_spacing` | 连续 pivotal 破坏七年留白 |
| `year.quiet_length` | quiet 年写成 pivotal 篇幅 |
| `year.pivotal_length` | pivotal 年过短，无重锤 |
| `year.memory_abstract` | dialogue 无法引用 |
| `intervention.thread` | 介入体验核心断裂 |

## 可接受（Pass with warns）

| code | 条件 |
|------|------|
| `beats.year1_quiet` | golden 复读线年 1 为 pivotal，产品刻意破例 |
| `beats.year7_quiet` | 同上，若第七年 quiet 设计需要 |
| `year.memory_short` | 仅 1 条且其余年合格 |
| `final.cliche` | 仅 hit 弱模式，人工读 message 仍合格 |

## 记录模板

```markdown
### {run_id} · {date}
- warn: `code` — 决定：accept / fix prompt / fix fixture
- Reviewer:
```

## 附录：Golden 字段 → Eval code

| 字段 | code |
|------|------|
| beats 数量 | `beats.length` |
| pivotal 计数 | `beats.pivotal_count` |
| quiet event 长 | `year.quiet_length` |
| pivotal event 短 | `year.pivotal_length` |
| quiet 有弹窗 | `year.quiet_intervention` |
| 选项相同 | `year.intervention_distinct` |
| memory 抽象 | `year.memory_abstract` |
| final 鸡汤 | `final.cliche` |
