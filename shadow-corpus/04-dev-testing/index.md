# 阶段四：研发自测

本阶段覆盖测试用例设计、单元测试、golden story eval 与 API 集成验证。

## 文章列表

| 序号 | 标题 | 状态 |
|------|------|------|
| 01 | [叙事 Eval 规则](./01-narrative-eval-rubric.md) | ✅ |
| 02 | [单元测试与 Golden Story](./02-unit-testing.md) | ✅ |
| 03 | [Golden Stories](./golden-stories/) | ✅ |

## 测试流水线

```
需求 / spec 验收标准
  ↓
golden-stories/复读线.json（基准 fixture）
  ↓
  ┌────────────────────┬────────────────────┐
  │  单元测试          │  Golden eval       │
  │  test/*.test.js    │  evaluateStory()   │
  │  npm test          │  无 error 门禁     │
  └────────────────────┴────────────────────┘
```

## 运行

```bash
npm test
```

## 关键产物

| 产物 | 路径 |
|------|------|
| Eval 实现 | `example/shadow-demo/lib/evaluator.js` |
| Golden JSON | `golden-stories/复读线.json` |
| Golden 说明 | `golden-stories/复读线.md` |
| 测试 | `example/shadow-demo/test/` |
