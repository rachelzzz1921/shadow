# Shadow Prompt 叙事协议

更新时间：2026-06-14

本文档说明 `example/shadow-demo/lib/prompts.js` 中五个 agent 的**写作口径**。改 prompt 时，先改这里，再改代码。

## 总原则

- 只产出 JSON，不写解释、不写 markdown。
- 第二人称「你」叙述事件；影子第一人称写 reflection / dialogue。
- 不要把用户 keywords 照抄成剧情。
- 允许遗憾、未和解、低处平稳；禁止鸡汤式平衡话术。

---

## Persona agent（人格分析师）

**要洞察什么**

- 防御机制、价值观冲突、未被满足的需要。
- `soft_spots` 让用户读到心里一紧——这是七年推演的命门。
- `decision_tendency` 能解释岔路口为何选某一边。
- `growth_seed` 埋在七年里慢慢浮上，不是预告片。

**不要做什么**

- 不要心理诊断标签（抑郁症、PTSD 等）。
- 不要叫「影子」；用 2-3 字中文名，暗合性格。
- 不要把 MBTI 当人格全部。

---

## Beats agent（节奏师）

**节奏口径**

- 7 年共 2-3 个 pivotal，其余 quiet。
- pivotal 之间留间隔，不要连着两年重锤。
- 第一年通常 quiet（日常入口）；第七年通常 quiet（留给收尾）。
- 完整情绪弧：迷茫 → 撞墙 → 和解或未和解。

**seed 写法**

- pivotal seed：明确「发生了什么事」，叙事师能接住。
- quiet seed：氛围或一句话掠过（「日子像复印件」）。

---

## Year agent（叙事师）

**quiet 年**

- event ≤30 字，轻轻掠过。
- new_mood / new_esteem 与上一年差距 ≤1。
- intervention_prompt 必须为 null。

**pivotal 年**

- event 80-120 字：场景 + 感官 + 情绪锚点。
- decision_made 写出关键选择 + 人格动因。
- intervention_prompt 必填：question + 两个互斥 options。

**共同铁律**

- reflection：第一人称，≤40 字，说领悟不复述事件。
- shadow_dialogue：对「现在的你」说，≤30 字，有钩子。
- memory_summary：≤20 字，写转折不写细节，供后续引用。
- environment / pose / prop / city 与 event 强相关。

**user_intervention**

- 若存在，是**已发生事实**，本年 event 必须从后果展开，不能忽略。

---

## Final agent（收尾师）

- 不总结剧情（用户刚看完）。
- regret 必须真实存在。
- message 像走过七年的人说话，不要「另一条路也好」。
- emotion_arc 给前端曲线一句注脚。

---

## Dialogue agent（跨时空对话师）

- 第一人称，40-60 字，含一个具体细节（物件/瞬间/别人说过的话）。
- 必须引用 memory_stream 至少一条（cite_memory_ids）。
- 不给建议，不说教，不扮演心理咨询师。
- 不解释自己是 AI 或角色。

---

## Scene Agents（六域场景 lens · 2026-06-14 入库）

人工终稿：`03-coding/prompts/scene-agents/scene-agents-prompts.md`

| 层 | 文件 | 作用 |
|----|------|------|
| Base | `base-prompt.md` | 因果链、心理真实、现实约束、和解收尾 |
| Router | `scene-router.md` | `primaryScene` + `secondaryTags` |
| Lens | `family` … `self_growth` | 各域推演边界与 dialogue 风格 |
| P2 JSON | `output-schema.md` | 含 `agentTrace` 的七年 timeline 契约 |

**当前接线**：archive demo 可通过 `scene-agents-bridge.js` 将 scene lens 叠加到 Year system；完整 P2 编排待实现。

**与 Fate 协作**：Scene 定叙事 lens；Fate 定 `emphasis_line` 与时代 micro。二者同时进 Year prompt，不互相替代。

Skill：`skills/shadow/scene-agents/SKILL.md`

---

## Fate agent（时代际遇层 · 队友完善）

- 读 `world/data/years/{calendar_year}.json` + Beats seed（**不在 UI 展示 Beats**）。
- 输出 `era_line` / macro / micro 样本，作 Year prompt **背景压力**，勿照抄标题。
- 归档 demo 接线：`lib/fate-bridge.js` → `buildYearPrompt` 内 `# 时代际遇层`。
- 静态 demo：`docs/demo-era-snippets.json` + `ShadowAgents.fate` placeholder。

---

## Intervention re-plan（占位 · T-016）

- 用户 pivotal 选择后，修订 **之后年份** beat seed（类型不变）。
- 规则占位：`lib/beats-replan.js`。
- LLM prompt 占位：`buildInterventionReplanPrompt`（队友替换文案）。
- Live：`story-session.generateNextYear` 在 `user_intervention` 时触发。

---

## P0 迁移摘要（T-010）

| 项 | 落点 | 状态 |
|----|------|------|
| Memory 检索 | `memory-retrieval.js` | ✅ |
| Reflection type | `memoryFromYear` | ✅ |
| re-plan | `beats-replan.js` + prompt 占位 | 🟡 |
| Fate 层 | `fate-bridge.js` + `fate-hook.js` | 🟡 placeholder |
| Dialogue 层 | `dialogue-hook.js` | 🟡 placeholder |

## Agent Hook 契约（Wave 4 · CHG-H001）

| Hook | 模块 | API | 静态 demo |
|------|------|-----|-----------|
| Dialogue | `lib/dialogue-hook.js` | `POST /api/dialogue`（无 key → placeholder） | `ShadowAgents.dialogue.ask` |
| Fate | `lib/fate-hook.js` | `POST /api/fate/context` | `ShadowAgents.fate.onYearEnter` |

队友替换 prompt 时保持 **返回 schema 不变**；见 `test/dialogue-contract.test.js`、`test/fate-hook.test.js`。
