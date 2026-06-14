# Dialogue bad / good 对照（占位 · W-03）

队友替换 `DIALOGUE_SYSTEM` 后对照。当前 demo 使用 **placeholder**（静态 `shadow_dialogue`）。

## Good

| 条件 | 例 |
|------|-----|
| 引用 memory id | cite: m2 |
| 含具体物件 | 「准考证撕了反而轻」 |
| 40–60 字 | ✓ |
| 第一人称 | ✓ |

## Bad

| 反模式 | 例 |
|--------|-----|
| 像 AI | 「作为你的影子我建议你…」 |
| 无 memory | 纯抽象总结 |
| 说教 | 「你要相信自己」 |
| 过长鸡汤 | 「每条路都有意义…」 |

## 接线

- Live：`agents.runDialogue` + `memory-retrieval.js`
- Static demo：`docs/demo-data.js` → `ShadowAgents.dialogue`（`_placeholder: true`）
