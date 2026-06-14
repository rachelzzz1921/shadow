# Shadow 停止与升级策略

更新时间：2026-06-14

产品与安全边界。实现见 `example/shadow-demo/lib/story-session.js`、`server.js`、前端 local mode fallback。

## 生成失败

| 场景 | 策略 |
| --- | --- |
| Schema 校验失败 | `callAgent` 重试 1 次；仍失败则 stage error，trace 记录，`stop_reason: *_failed` |
| Provider 无 key | 启动时 console 提示；前端建议切本地预生成 |
| 单年生成失败 | 不自动跳过；用户看到 error，可 reset 或切 local |
| Final 失败 | trace `final_failed`；已有 years 保留，无 final 曲线 |

## 内容与敏感输入

| 场景 | 策略 |
| --- | --- |
| 自伤、自杀、极端暴力 | **不继续生成**；显示 neutral 提示，建议专业帮助；不输出具体方法 |
| 真实心理诊断 | **禁止**；Persona 只写文学化人格结构，不给 DSM 标签 |
| 未成年人 | age <18 允许 demo，但避免性、毒品等成人向 pivotal 设计 |
| 政治敏感 | 本地 demo 避免；live 遇敏感岔路口走 generic 人生选择 |

> 敏感词拦截尚未在代码层实现；当前依赖 prompt 约束 + 人工 review。上线前建议加 input guardrail。

## Provider 与模式

| 场景 | 策略 |
| --- | --- |
| API 不可用 | 前端 fallback `LOCAL_STORIES` |
| Anthropic + OpenAI 均有 | 优先 Anthropic（叙事 + JSON 更稳） |
| 模型 override | `SHADOW_MODEL` env |

## 用户行为

| 场景 | 策略 |
| --- | --- |
| pivotal 不选 | 允许；下一年 `user_intervention: null` |
| 中途关闭页面 | trace 可能不完整（无 `finished_at`） |
| 对话 agent 失败 | 前端显示失败文案，不阻塞主线 |

## 升级给人

- Eval **error** 或敏感内容 flag → 人工 review（`skills/story-review/SKILL.md`）。
- 新产品 judgment（是否展示某类故事）→ 产品 owner，不写进 agent 自动决策。

## Trace 与审计

- Live run：`runs/{run_id}.json`
- 含 `interventions[]`、`errors[]`、`stop_reason`、`eval`
