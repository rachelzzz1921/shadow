# P0 实现计划 — Memory · Reflection · Intervention re-plan

日期：2026-06-14  
任务：**T-012** · 依赖：T-011

## 目标

归档 demo `archive/demo-v0.2/lib/` 落地 P0 两项代码 + 一项 prompt 接线位，eval 不降级。

## 不在本计划

- Dialogue agent prompt（队友）
- Fate agent / world DB（队友）
- 四套剧本 / 叙事 v2 回写（队友）
- intervention re-plan **文案**（T-016，P2 人写）

## 任务分解

### Phase A — Memory 检索（T-014）✅ Agent

1. 新增 `memory-retrieval.js` + 测试
2. `agents.runFinal` / `runDialogue` 传入 `selectMemories` 结果
3. `prompts.formatMemoryStream` 不变，输入变短列表

**验证**：`node --test test/memory-retrieval.test.js`

### Phase B — Reflection 类型（T-015）✅ Agent

1. `memoryFromYear` 推断 `type` 对齐 golden
2. 可选：`test/story-contract.test.js` 断言 7 年 type

**验证**：`npm test`

### Phase C — Intervention re-plan（T-016）⏸ 队友

1. P2 写 re-plan system prompt
2. Codex 接 `replanBeatsAfterIntervention()` stub
3. Live session 仅在 `user_intervention` 非空时调用

**验证**：trace 中 beats 版本号 + 下一年 event 承接 choice

### Phase D — 合并门禁（T-017–T-018）

1. P3 Code Review
2. `npm test` 全绿 → Gate G3
3. T-019 golden eval 回归

## 回滚

- memory 检索：prompt 改回全量 `memory_stream`（一行 revert）
- reflection type：仅影响 live 新 run，不改 golden JSON

## 估时

| Phase | 估时 |
|-------|------|
| A | 2h |
| B | 1h |
| C | 4h（含人写 prompt） |
| D | 1h |

## 完成定义

- [ ] Phase A+B 测试绿
- [ ] T-011 文档 merged
- [ ] T-016 prompt 人审通过
- [ ] Gate G3 签字
