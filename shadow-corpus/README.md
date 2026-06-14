# Shadow Corpus — 统筹包

> **平行人生叙事** 的 Harness 知识体系：文档、Skill、Fixture、工具配置。  
> 可运行 demo 已归档，本目录是 **唯一主入口**。

---

## 这是什么

Shadow 不再以「可运行 demo 优先」组织，而是以 **文字统筹 + Skill 池 + 阶段文档** 为核心：

| 层级 | 路径 | 说明 |
|------|------|------|
| 入口 | [`MANIFEST.md`](MANIFEST.md) | 全目录索引与阅读顺序 |
| Agent | [`AGENTS.md`](AGENTS.md) | Agent 阅读顺序与阶段导航 |
| 约束 | [`CLAUDE.md`](CLAUDE.md) | AI 编程上下文与 Do Not |
| 阶段 | `01-requirements/` … `07-debug-and-correction/` | Harness 七阶段文档 |
| 知识 | [`knowledge/`](knowledge/) | 产品、研究、外部参考 |
| Skill | [`skills/`](skills/) | Shadow 自有 + 75 第三方 + 路由 |
| 夹具 | [`fixtures/`](fixtures/) | Golden stories 等验收参照 |
| 工具 | [`tooling/`](tooling/) | Hooks、Subagent、Claude 配置 |
| 归档 | [`archive/demo-v0.2/`](archive/demo-v0.2/) | 旧版可运行 demo（参考用） |

---

## 快速开始（Agent）

1. 读 [`AGENTS.md`](AGENTS.md)
2. 不确定用哪个 Skill → invoke **`shadow-router`**
3. 按任务进入对应 `01–07` 阶段目录
4. 改 Shadow 领域 Skill → 编辑 [`skills/shadow/`](skills/shadow/)，运行 [`skills/sync-cursor-links.sh`](skills/sync-cursor-links.sh)

---

## Skill 发现

Cursor 从项目根 [`.cursor/skills/`](../.cursor/skills/) 发现 Skill。同步命令：

```bash
./shadow-corpus/skills/sync-cursor-links.sh
```

治理说明：[`skills/_governance/SKILLS-GOVERNANCE.md`](skills/_governance/SKILLS-GOVERNANCE.md)

---

## 归档 Demo（可选运行）

旧版 Node demo 在 [`archive/demo-v0.2/`](archive/demo-v0.2/)，仅供对照契约与 evaluator：

```bash
npm install --prefix shadow-corpus/archive/demo-v0.2
npm run dev --prefix shadow-corpus/archive/demo-v0.2
npm test --prefix shadow-corpus/archive/demo-v0.2
```

---

## 核心理念

```
需求 → 方案 → 编码 → 自测 → QA → 进度 → 纠错
  ↑__________________________________________|
              Harness（约束 · 评估 · 追溯）
                       ↕
              可插拔 Skill 体系
```

闭环：**Goal → Actor → Environment → Feedback → Memory → Stop**  
详见 [`02-technical-design/01-shadow-harness-loop.md`](02-technical-design/01-shadow-harness-loop.md)

---

## License

MIT
