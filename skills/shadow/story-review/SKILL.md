---
name: story-review
description: Use when reviewing Shadow stories after adding local fixtures, changing prompts, switching models, or evaluating live runs from example/shadow-demo/runs/*.json. Checks schema, rhythm, interventions, memory, final weight, staging, and evaluator output.
---

# Story Review

审阅 Shadow 叙事产物：**本地故事、golden fixture、live run trace、prompt 改动后样本**。

## 何时使用

- 新增/修改 `LOCAL_STORIES` 或 golden story。
- 修改 `example/shadow-demo/lib/prompts.js` 或切换 `SHADOW_MODEL`。
- 复盘 `example/shadow-demo/runs/*.json` 中某次 live 生成。

## 先读

- `04-dev-testing/01-narrative-eval-rubric.md`
- `01-requirements/02-intervention-requirements.md`
- `04-dev-testing/golden-stories/复读线.md`
- `05-qa-testing/01-story-review-gate.md`

## Review 清单

### 1. 契约与机械

- [ ] 符合 `example/shadow-demo/lib/schemas.js` / contract shape。
- [ ] `evaluateStory()` 无 **error**（warn 逐条判断）。
- [ ] `pivotal_years` 与 beats 一致。

### 2. 七年节奏

- [ ] 2-3 pivotal，quiet 年真的「掠过」。
- [ ] pivotal 不连续扎堆。
- [ ] 情绪值有弧，非单调。

### 3. Pivotal 与介入

- [ ] 每个 pivotal 有 intervention_prompt。
- [ ] 选项互斥、有代价、非假选择。
- [ ] Live：下一年是否承接 `user_intervention`（查 trace `interventions` + year event）。

### 4. Memory 与对话

- [ ] 每条 memory 有具体瞬间或物件。
- [ ] dialogue 样本能引用 memory id（live 抽测）。

### 5. Final

- [ ] 不复述七年剧情。
- [ ] 有 regret；message 不像鸡汤。
- [ ] emotion_arc 与 years 情绪曲线一致。

### 6. 视觉

- [ ] environment / pose / prop / city 与 event 匹配。
- [ ] 在浏览器中抽检 1-2 年渲染是否正常。

## Live Run 复盘

打开 `example/shadow-demo/runs/{run_id}.json`：

- `events[]`：哪一 stage 失败？
- `interventions[]`：用户选了什么？
- `eval`：errors / warnings？
- `stop_reason`：是否正常 completed？

## 输出

- **Pass**：可合并 / 可上线 demo。
- **Pass with warns**：记录 warn 理由，记入 `06-task-progress/02-prompt-experiments-log.md`。
- **Fail**：列出反模式编号 + 建议改 prompt / fixture / code。

## 升级

- 敏感内容、自伤相关输入 → 停止，见 `07-debug-and-correction/01-stop-and-escalation.md`。
- 结构性 eval error 多次出现 → 改 prompt 或 evaluator 规则，并写 experiment log。
