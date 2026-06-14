# E2E 场景清单

浏览器手动或 Playwright 自动化。Demo：`http://localhost:3000`

## QA-001 本地复读线完整回放

| 步骤 | 操作 | 预期 |
|------|------|------|
| 1 | 打开页面，保持「本地预生成」开启 | 默认加载复读线 |
| 2 | 点击开始 | 进入七年回放 |
| 3 | pivotal 年（1/4/6） | 弹介入框，选项可点 |
| 4 | 选选项后继续 | 下一年 narrative 体现选择 |
| 5 | 收尾 | final 有 regret，曲线更新 |
| 6 | 点击影子 | 跨时空 dialogue 可开 |

## QA-002 Live Session（需 API Key）

| 步骤 | 操作 | 预期 |
|------|------|------|
| 1 | 关闭本地预生成 | 走 live API |
| 2 | 填写 profile 提交 | 返回 run_id，逐年生成 |
| 3 | pivotal 介入 | intervention 写入 session |
| 4 | 完成 7 年 | trace 落盘 `runs/{run_id}.json` |
| 5 | 检查 trace | stage、eval 摘要、stop_reason 完整 |

## QA-003 Provider Fallback

| 步骤 | 操作 | 预期 |
|------|------|------|
| 1 | 无 API Key 启动 live | 友好错误或 fallback 提示 |
| 2 | 无效 model | 见 stop-escalation 策略 |

## 失败处理

E2E FAIL → 见 [`07-debug-and-correction/`](../07-debug-and-correction/) → debug-analyst 分析 trace
