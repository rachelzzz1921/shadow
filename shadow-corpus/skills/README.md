# Shadow Corpus — Skills

本目录包含 Shadow 项目 **全部 81 个 Skill** 的统筹副本。

## 结构

| 目录 | 数量 | 编辑 |
|------|------|------|
| `shadow/` | 3 | ✅ 改这里（story-*, harness-init） |
| `harness/` | 2 | ✅ 改这里（design-generator, progress-tracker） |
| `shadow-router/` | 1 | ✅ 路由表变更时改 |
| `pool/` | 75 | ❌ 用 `npx skills update` 后重新复制 |
| `_governance/` | — | 治理文档与 manifest |

## Cursor 发现

运行同步脚本，将本目录 Skill 链接到项目根 `.cursor/skills/`：

```bash
./shadow-corpus/skills/sync-cursor-links.sh
```

## 更新第三方 Skill

```bash
npx skills update
# 然后重新复制到 pool/（或运行 sync 脚本内的 pool 刷新步骤）
```

## 治理

- 人类可读：[`_governance/SKILLS-GOVERNANCE.md`](_governance/SKILLS-GOVERNANCE.md)
- 机器可读：[`_governance/skills-manifest.json`](_governance/skills-manifest.json)
- 版本锁定：[`skills-lock.json`](skills-lock.json)

## 冲突规则摘要

- **TDD**：lib/evaluator → `tdd`；新功能 → `test-driven-development`
- **Review**：叙事 → `story-review`；代码 PR → `review`
- **Init**：Shadow 树 → `harness-init`；CONTEXT/ADR → `setup-matt-pocock-skills`

完整说明见治理文档。
