# API 与 JSON 契约

5 个 agent 通过 AI SDK + Zod schema 编排，前后端共享一份 JSON 契约。

## Agent 管线

```
profile → Persona   → persona_card
        → Beats     → beats[7] + pivotal_years
        → Year × 7  → years[] + memory_stream（累积）
                        pivotal 年 → user_intervention → 下一年
        → Final     → final 收尾
        → Dialogue  → 任意时刻跨时空对话
```

## HTTP API

| 端点 | 说明 |
|------|------|
| `POST /api/story/start` | 创建 session，返回 `run_id` |
| `POST /api/story/year` | 生成单年（可带 `user_intervention`） |
| `POST /api/story/final` | 收尾 + eval + trace 落盘 |
| `POST /api/story` | 全流程 SSE（旧路径，前端可选） |
| `GET /api/health` | Provider 探测 |

## 核心 JSON 字段

```jsonc
{
  "profile": {},
  "persona_card": { "name", "core_traits[]", "soft_spots[]", "decision_tendency", "growth_seed" },
  "beats": [{ "year", "type": "pivotal|quiet", "seed" }],
  "pivotal_years": [1, 4, 6],
  "memory_stream": [{ "id", "year", "type", "content", "weight" }],
  "years": [{
    "year", "age", "is_pivotal", "title", "scene", "event",
    "intervention_prompt": { "question", "options": ["a","b"] } | null,
    "user_intervention", "emotion", "reflection", "shadow_dialogue"
  }],
  "final": { "title", "message", "regret", "scene", "emotion_arc" }
}
```

完整样例：[`example/shadow-demo/lib/contract.example.json`](../example/shadow-demo/lib/contract.example.json)

## 环境变量

```bash
ANTHROPIC_API_KEY=...        # 推荐
OPENAI_API_KEY=...
SHADOW_PROVIDER=anthropic
SHADOW_MODEL=claude-sonnet-4-5-20250929
PORT=3000
```

## 实现文件

- `lib/schemas.js` — Zod 定义
- `lib/prompts.js` — 5 个 prompt builder
- `lib/agents.js` — AI SDK 包装
- `lib/story-contract.js` — normalize 与 memory 助手
- `server.js` — HTTP 路由
