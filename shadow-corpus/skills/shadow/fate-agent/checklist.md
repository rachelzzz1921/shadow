# Fate Agent — 验收 Checklist

## A. 语料机械（`npm run validate`）

- [ ] 21 个 `{year}.json` 均通过 JSON Schema
- [ ] 每年 macro ≥ 30，micro ≥ 80
- [ ] 每年六域 micro 均 ≥ 30（亲情/爱情/友情/学业/事业/自我成长）
- [ ] 每条 micro 有 `scenario` 枚举值
- [ ] macro 有 `source_url`；detail ≥ 20 字

## B. 权重行为

- [ ] 复读线 profile：`academic` + `self_growth` 合计 > 0.4（典型）
- [ ] 同 `runId` + 同年：两次 `sampleFateContext` 结果一致
- [ ] pivotal 比 quiet：Top 域权重更集中（sharpen 生效）
- [ ] `emphasis_line` ≤ 60 字可读

## C. 子池质量（人工抽 5 条/域）

- [ ] 文本像「个人可能遇上的事」，非新闻标题
- [ ] academic 含复读/考研/志愿等；family 含父母/春节等
- [ ] `can_pivot` 条目有明确抉择代价
- [ ] 敏感条目标 `sensitivity`，不娱乐化灾难

## D. 集成（若已接 demo/API）

- [ ] profile 含 `birth_year`、`fork_year`
- [ ] 第 0 年（fork_year）对用户可见
- [ ] Year prompt 含 `emphasis_line` + micro_sample
- [ ] `fate_contexts[]` 写入 trace
- [ ] golden 复读线 eval 无新增 error

## E. Supabase（若已 seed）

- [ ] 三表行数与 JSON 一致
- [ ] `world_micro_events.scenario` 非空
- [ ] 匿名 SELECT 可读；无 service key 不可写

## 失败时

| 症状 | 查 |
|------|-----|
| 某域 <30 | 对应 `scenario-pools/{domain}.mjs` + regenerate |
| validate schema fail | `generate-era-draft.mjs` normalize 逻辑 |
| 权重不符合 choice | `fate-weights.mjs` KEYWORD_SCENARIO |
| seed 失败 | `.env`、RLS、表是否已 migration |

记录实验：`06-task-progress/02-prompt-experiments-log.md`
