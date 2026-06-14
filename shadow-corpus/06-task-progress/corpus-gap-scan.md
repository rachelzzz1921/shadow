# Corpus Gap 扫描报告

更新时间：2026-06-14  
任务：**T-006** · 执行：Agent

## 方法

对照 [`MANIFEST.md`](../MANIFEST.md)、[`02-technical-design/01-shadow-harness-loop.md`](../02-technical-design/01-shadow-harness-loop.md) 与仓库实际路径，标记 **已有 / 缺失 / 错位**。

## 已对齐

| 域 | 状态 | 路径 |
|----|------|------|
| Harness 七阶段 | ✅ | `01-requirements/` … `07-debug-and-correction/` |
| Golden 复读线 | ✅ | `fixtures/golden-stories/复读线.json` + `.md` |
| 归档 demo + eval | ✅ | `archive/demo-v0.2/` · `npm test` 7/7 |
| Skill 治理 | ✅ | `skills/_governance/` + `sync-cursor-links.sh` |
| Visual 模块骨架 | ✅ | `visual/01–04` + `registry/assets.csv` |
| 命运 Agent 方案 | ✅ | `02-technical-design/03-fate-agent-and-world-db.md`（实现归队友） |
| 对外静态 Demo | ✅ | 仓库根 `docs/demo.html` + `demo-data.js` + `demo-engine.js` |

## 缺口（本扫描后已补或进行中）

| Gap | 严重度 | 动作 | 任务 |
|-----|--------|------|------|
| P0 技术方案文档缺失 | 高 | 新增 `02-p0-memory-reflection-replan.md` | T-011 |
| P0 实现计划缺失 | 高 | 新增 `docs/plans/2026-06-14-p0-implementation.md` | T-012 |
| memory 检索未实现 | 高 | `lib/memory-retrieval.js` | T-014 |
| reflection 写入 memory 规则松散 | 中 | `memoryFromYear` 类型推断 + session | T-015 |
| Eval rubric 无 golden 字段映射表 | 中 | 扩展 `01-narrative-eval-rubric.md` | T-008 |
| Visual Phaser engine 空 | 中 | `visual/engine/` 脚手架 | V-004 |
| 7 年 layout JSON 空 | 中 | `visual/scenes/fuxduxian/year-*.layout.json` draft | V-005 |
| 审美标杆未填 | 低 | `references/aesthetic-cases.md` | V-003 |
| story-review 空白抽检表 | 低 | `05-qa-testing/02-story-review-blank.md` | W-04 |
| eval warn 决策树 | 低 | `05-qa-testing/03-eval-warn-decision-tree.md` | W-10 |
| 多 run 对比模板 | 低 | `06-task-progress/03-run-comparison-template.md` | T-024 |
| `world/` 语料库目录 | — | **队友**（命运 agent） | — |
| 四套剧本 golden 抽出 | — | **队友**（仅复读线有 JSON） | CHG-002 |
| Dialogue / Fate agent prompt | — | **队友** | — |
| 叙事 v2 回写 golden | — | **队友** | V-008 |

## 路径错位（文档 vs 代码）

| 文档写法 | 实际路径 | 建议 |
|----------|----------|------|
| `example/shadow-demo/` | `archive/demo-v0.2/` | 文档已多处改归档路径；旧引用逐步替换 |
| `04-dev-testing/golden-stories/` | 副本；**源**在 `fixtures/golden-stories/` | 改 fixture 后同步副本 |

## 建议优先级（Agent 可继续）

1. T-014/T-015 合并进 `archive/demo-v0.2/lib/` + 测试
2. V-004/V-005 visual draft（不阻塞叙事 v2）
3. T-018 前置：T-017 人工 CR 仍待 P3
4. `docs/demo` 挂进团队看板入口

## 验收

- [x] 本报告落盘
- [ ] P1 确认 corpus 唯一入口（T-023，人工）
- [x] gap 项已映射到 registry 任务 ID
