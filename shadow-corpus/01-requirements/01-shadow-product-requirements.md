# 产品需求与验收标准

更新时间：2026-06-14

## 产品目标

**Shadow** 是一个平行人生叙事 demo：用户输入一个人生岔路口，5 个 agent 协同推演影子的七年，在 pivotal 年允许用户介入，影响后续年份；任意时刻可与影子跨时空对话。

## 用户旅程

1. 填写 profile（姓名、年龄、岔路口描述）
2. Persona agent 生成人格卡
3. Beats agent 排七年节奏（pivotal / quiet）
4. 逐年回放：quiet 快放，pivotal 重锤 + 介入弹窗
5. Final 收束七年
6. 随时打开跨时空 Dialogue

## 验收标准

- 输出符合 `example/shadow-demo/lib/schemas.js` 与 `contract.example.json`
- 七年含 2–3 个 pivotal 年与足够 quiet 留白
- Live mode 下 user intervention 进入下一年 agent 上下文
- `memory_stream` 可支撑跨时空 dialogue 引用
- `final` 有重量、有 regret，不强行鸡汤
- 规则型 eval（`lib/evaluator.js`）无 error；warn 需人工判断

## 运行模式

| 模式 | 说明 |
|------|------|
| 本地预生成 | 断网可演示，4 套 LOCAL_STORIES，默认复读线 |
| Live session | `/api/story/start` → `/api/story/year` ×7 → `/api/story/final` |

## 非目标

- 不做通用 openspec 平台（见框架参考 repo）
- 不做多用户持久化后端

## 相关文档

- Harness 闭环：[`02-technical-design/01-shadow-harness-loop.md`](../02-technical-design/01-shadow-harness-loop.md)
- 介入设计：[`02-intervention-requirements.md`](./02-intervention-requirements.md)
