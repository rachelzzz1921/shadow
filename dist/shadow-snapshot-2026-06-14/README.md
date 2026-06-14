# Shadow 代码快照 · 2026-06-14

精简打包：RAG 设计、命运/世界 Agent、主 Agent Prompt、GitHub Pages 基础 Demo 页。

## 目录

| 目录 | 内容 |
|------|------|
| `01-rag/` | 架构文档、rag-kit 源码（无 node_modules/本地索引）、rag-kit skill、demo rag-service |
| `02-world-agent/` | 命运 Agent 需求/设计、world 语料库 lib+schema+年份 JSON、 fate-agent skill |
| `03-agent-prompts/` | Persona prompt、叙事协议、六场景 Agent prompts、归档 demo prompts.js |
| `04-demo-pages/` | demo-hub / demo / intake 页面及 JS/CSS（无角色 PNG，见 data JSON） |

## 未纳入（体积/生成物）

- `node_modules`、`rag-kit/data/local-index`（运行 `npm run rag:embed:local` 生成）
- `docs/visual-characters/*.png`（角色立绘，元数据在 `04-demo-pages/data/shadow-characters-v1.json`）
- Phaser 页、Live 服务端、extended 视觉 pack 原始图

## 本地预览 Demo

```bash
cd 04-demo-pages 的父目录（即本 zip 解压后的 shadow-snapshot-2026-06-14）
# 将 04-demo-pages 内容复制到可静态服务的 docs/ 或：
npm run demo:local   # 若在完整 shadow 仓库根目录
```

完整仓库命令见 shadow-corpus/CLAUDE.md。
