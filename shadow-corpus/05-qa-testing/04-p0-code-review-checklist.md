# P0 Code Review 清单（T-017 · Gate G3）

审查人：P3 · 日期：_待填_

## 范围

| 模块 | 路径 | 占位 |
|------|------|------|
| Memory 检索 | `archive/demo-v0.2/lib/memory-retrieval.js` | |
| Reflection 类型 | `archive/demo-v0.2/lib/story-contract.js` | |
| Re-plan | `archive/demo-v0.2/lib/beats-replan.js` | 🔶 规则占位 |
| Fate bridge | `archive/demo-v0.2/lib/fate-bridge.js` | 🔶 采样占位 |
| Session 接线 | `archive/demo-v0.2/lib/story-session.js` | |

## 检查项

- [ ] 无硬编码 API key / .env 泄漏
- [ ] intervention 后 trace 含 replan + fate 事件
- [ ] memory 检索与 golden `memory_stream` 类型一致
- [ ] 测试覆盖 pivotal 路径（`test/fate-replan.test.js`）
- [ ] placeholder 在代码 / 文档标 `[PLACEHOLDER]` 或 `_placeholder`

## 命令

```bash
npm test
npm run test:golden
```

## 结论

| | ☐ Approve · ☐ Approve with comments · ☐ Block |
|---|--------------------------------------------------|
| 签字 P3 | |
| 日期 | |
