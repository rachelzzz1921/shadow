# Shadow Prompt 实验记录

Harness Memory：每次改 prompt、模型或 narrative 规则，在此记录，避免「越改越玄学」。

---

## 2026-06-14 — Live session 逐步生成 + intervention threading

**Change**

- 新增 `lib/story-session.js`：live mode 从一次性 `/api/story` 改为 `/api/story/start` → `/api/story/year` ×7 → `/api/story/final`。
- Year agent 接收 `user_intervention`，prompt 注入用户选择。
- 前端 `pendingIntervention` 在 pivotal 选择后传给下一年 API。

**Expected**

- 用户在 pivotal 年的选择会出现在下一年 Year agent 的 prompt 中。
- 下一年 narrative 从选择后果展开。

**Result**

- `test/story-session.test.js` 通过：prompt 含 `用户选择了：「告诉」`。
- 待 live 人工抽检：复读 profile 下年 2 是否承接年 1 选择。

**Keep / Revert**

- Keep

**Notes**

- 本地预生成故事仍不重新生成，仅 live session 真正 threading。
- 见 `01-requirements/02-intervention-requirements.md`。

---

## 2026-06-14 — Harness 文档 + evaluator + run trace

**Change**

- 新增 `01-requirements/` … `07-debug-and-correction/`、`skills/story-*`、`example/shadow-demo/lib/evaluator.js`、`lib/run-trace.js`。
- Live session 写入 `runs/{run_id}.json`。

**Expected**

- 每次 live 生成有可追溯 trace 与规则 eval。

**Result**

- 单元测试覆盖 evaluator 与 session；live eval 待积累样本。

**Keep / Revert**

- Keep

**Notes**

- 后续改 prompt 必须追加本文件条目。
