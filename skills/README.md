# Skills — Shadow 融合管理

本目录是 **Shadow 自有 Skill 的源码**，不是 Agent 直接扫描的根（那是 `.agents/skills/`）。

## 结构

```
skills/
├── README.md                 ← 本文件
├── sync-shadow-skills.sh     ← 同步到 .agents/skills 软链
├── shadow/                   ★ 领域 Skill（叙事、harness-init）
│   ├── story-authoring/
│   ├── story-review/
│   └── harness-init/
└── harness/                  ★ 框架 Skill（来自 jackhoward24）
    ├── design-generator/
    └── progress-tracker/
```

## 快速参考

| 文档 | 用途 |
|------|------|
| [`.agents/SKILLS-GOVERNANCE.md`](../.agents/SKILLS-GOVERNANCE.md) | 完整治理：分层、冲突、工作流 |
| [`.agents/skills-manifest.json`](../.agents/skills-manifest.json) | 机器可读路由表 |
| [`.agents/skills/shadow-router/SKILL.md`](../.agents/skills/shadow-router/SKILL.md) | Agent 任务路由入口 |

## 编辑流程

1. 修改 `skills/shadow/` 或 `skills/harness/` 下的 `SKILL.md`
2. 运行：

```bash
chmod +x skills/sync-shadow-skills.sh   # 首次
./skills/sync-shadow-skills.sh
```

3. 第三方 skill 用 `npx skills update`，**不要**改 `.agents/skills/` 里的副本

## 第三方 Skill（只读）

通过 `npx skills add` 安装在 `.agents/skills/`，共 ~76 个。来源：

- mattpocock/skills
- addyosmani/agent-skills
- vercel-labs/agent-skills
- obra/superpowers

版本锁定：`skills-lock.json`
