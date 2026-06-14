# Fate World Kit — 独立工具包

Shadow **命运 Agent** + **2006–2026 中国大陆时代语料** 的可携带副本。  
从主仓 `shadow-corpus/` 打包，可单独拷贝、接 NotebookLM、或给外部项目用。

## 包内结构

```
fate-world-kit/
├── README.md                 ← 本文件
├── MANIFEST.json             ← 版本与文件清单
├── docs/                     ← 需求与方案（只读参考）
├── skill/                    ← fate-agent Cursor Skill（拷到 .cursor/skills/）
├── notebooklm/               ← NotebookLM 充实语料用 prompt + 合并说明
└── world/                    ← 语料引擎（generate / validate / seed）
    ├── data/years/           ← 21 年冻结 JSON
    ├── lib/scenario-pools/   ← 六域子池
    └── scripts/
```

## 快速开始（不接 NotebookLM）

```bash
cd world
npm install
npm run validate              # 检查 21 年语料
node scripts/demo-fate-weights.mjs   # 复读线权重试跑
```

## 接 NotebookLM 充实语料

1. 把你的 **近 20 年 NotebookLM 笔记本** 作为唯一信源（已上传 PDF/网页/笔记）。
2. 打开 [`notebooklm/01-ENRICH-PROMPT-按年.md`](notebooklm/01-ENRICH-PROMPT-按年.md)，**每次改 `{YEAR}`** 粘贴到 NotebookLM 对话。
3. 将输出 JSON 存为 `world/data/notebooklm-import/{YEAR}.patch.json`。
4. 合并并校验：

```bash
cd world
node scripts/import-notebooklm-patch.mjs
npm run validate
npm run generate   # 若只改了 import，可跳过 generate；改了子池才需要
```

5. 可选：`npm run seed` 写入 Supabase（需 `.env`）。

## 安装 Skill 到 Cursor

```bash
cp -R skill ~/.cursor/skills/fate-agent
# 或在项目内：
cp -R skill /path/to/project/.cursor/skills/fate-agent
```

## 与主仓同步

本包为**快照**。主仓更新后重新打包：

```bash
# 在主仓 shadow-corpus/ 下
rm -rf packages/fate-world-kit && ./packages/build-fate-world-kit.sh
```

## 版本

见 `MANIFEST.json` 的 `built_at` 与 `world_corpus_version`。
