# Story Review 门禁

上线 live mode 或发布新 LOCAL_STORIES 前，必须通过 story-review。

## 使用 Skill

[`skills/story-review/SKILL.md`](../skills/story-review/SKILL.md)

## 评审清单（摘要）

- [ ] 符合 `lib/schemas.js` / contract shape
- [ ] pivotal 仅 2–3 年，间隔 ≥1
- [ ] intervention 选项有实质分歧
- [ ] memory_stream 与 years 一致
- [ ] final 有 regret，非鸡汤
- [ ] evaluator 无 error
- [ ] 敏感内容已处理

## 评审结论

| 结论 | 动作 |
|------|------|
| Pass | 可合并 / 可演示 |
| Pass with warns | 记录 warn，写入 prompt-experiments |
| Fail | 修复后重新 review |

## 证据

- 本地故事：`public/index.html` LOCAL_STORIES
- Live trace：`example/shadow-demo/runs/{run_id}.json`
- Golden 对照：`04-dev-testing/golden-stories/复读线.md`
