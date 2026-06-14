# Visual 流水线

## 八步

```
① 寻源        网上找像素风素材（不用仓库旧 zip）
② 建档        Excel/CSV 按 02-asset-registry-spec 填
③ 标杆        10–20 案例人审 → references/aesthetic-cases.md
④ 叙事        该年文本（可与 P2 改稿并行）
⑤ AI 布局     输入：素材行 + 年叙事 → 输出：layout JSON
⑥ 人审        构图、情绪、物件是否贴 memory
⑦ 渲染        Phaser 读 JSON + sprite
⑧ 挂流程      按 UX 表触发（见 04-ux-flow.md）
```

## 与叙事 harness 的关系

| 叙事侧 | 视觉侧 |
|--------|--------|
| `fixtures/golden-stories/复读线.json` | `scenes/fuxduxian/year-N.layout.json` |
| P2 改 prompt / 年文本 | 同步改 scene-brief + layout |
| story-review 人审 | 视觉 aesthetic 人审（P2+P4） |

**规则：** 布局 JSON 引用 `narrative_ref`（年号 + memory id），文案变了只改 ref 对应 brief，不盲目重找素材。

## AI 布置场景（约定）

**输入文件：**
- `registry/assets.csv` 筛选后的子集
- `stories/fuxduxian/year-N.narrative.md`（或 golden 该年 event）

**输出文件：**
- `scenes/fuxduxian/year-N.layout.json`

**Prompt 要点：** 只许用 registry 里存在的 `asset_id`；必须写 `usage_case` 对照；pivotal 年加 `sequence[]` 支持 C 类短片。

## 第一期分工建议

| 谁 | 做什么 |
|----|--------|
| P2 | 复读线改稿 + 场景 brief + 审美签字 |
| P3 | Phaser engine + layout 解析 |
| P4 | 布局 vs memory 一致性抽检 |
| P5 | 寻源、Excel 维护、registry 工具 |
| P1 | 体验里 A/B/C 触发点确认 |

## Change ID

`CHG-V001` — 复读线视觉第一期
