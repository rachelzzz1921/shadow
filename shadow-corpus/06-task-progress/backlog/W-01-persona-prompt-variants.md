# Persona Prompt 变体 ×3（占位 · W-01）

队友替换 `archive/demo-v0.2/lib/prompts.js` 中 `PERSONA_SYSTEM` 后在此记录 eval。

| ID | 变体要点 | eval 结果 | Keep |
|----|----------|-----------|------|
| P-A | 基线（当前） | golden 对照 | ✅ |
| P-B | 强调 soft_spots 长度 12–15 字 | _待跑_ | |
| P-C | 禁止 MBTI 进 prompt 正文 | _待跑_ | |

## 跑法

```bash
npm test --prefix shadow-corpus/archive/demo-v0.2
# live: POST /api/story/start + 抽检 persona_card
```
