# Story Review 空白抽检表

任务：**W-04** · 复制本表填写每次 review

## 元信息

| 字段 | 值 |
|------|-----|
| Reviewer | |
| 日期 | |
| 对象 | ☐ golden JSON ☐ LOCAL_STORIES[n] ☐ runs/{run_id}.json |
| 模型 / 分支 | |
| Prompt 版本 | |

## 1. 契约与机械

| # | 检查项 | Pass | Warn | Fail | 备注 |
|---|--------|------|------|------|------|
| 1.1 | schema / contract shape | | | | |
| 1.2 | evaluateStory 0 error | | | | |
| 1.3 | pivotal_years ↔ beats | | | | |

## 2. 七年节奏

| # | 检查项 | Pass | Warn | Fail | 备注 |
|---|--------|------|------|------|------|
| 2.1 | 2–3 pivotal，quiet 真掠过 | | | | |
| 2.2 | pivotal 不连续扎堆 | | | | |
| 2.3 | 情绪弧非单调 | | | | |

## 3. Pivotal 与介入

| # | 检查项 | Pass | Warn | Fail | 备注 |
|---|--------|------|------|------|------|
| 3.1 | 每个 pivotal 有 intervention | | | | |
| 3.2 | 选项互斥、有代价 | | | | |
| 3.3 | Live 下一年承接 intervention | | | | |

## 4. Memory 与对话

| # | 检查项 | Pass | Warn | Fail | 备注 |
|---|--------|------|------|------|------|
| 4.1 | memory 有具体瞬间/物件 | | | | |
| 4.2 | dialogue 引用 memory id | | | | |

## 5. Final

| # | 检查项 | Pass | Warn | Fail | 备注 |
|---|--------|------|------|------|------|
| 5.1 | 不复述七年 | | | | |
| 5.2 | regret 真实存在 | | | | |
| 5.3 | message 非鸡汤 | | | | |

## 6. 视觉（如有）

| # | 检查项 | Pass | Warn | Fail | 备注 |
|---|--------|------|------|------|------|
| 6.1 | environment/pose 与 event 匹配 | | | | |
| 6.2 | 浏览器抽检 1–2 年 | | | | |

## 结论

☐ **Pass** · ☐ **Pass with warns** · ☐ **Fail**

Warn / Fail 编号：

跟进：
