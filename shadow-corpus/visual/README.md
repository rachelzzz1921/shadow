# Shadow Visual — 像素风呈现模块

专门负责：**素材 → Excel 建档 → AI 布局 → 人审 → Phaser 渲染 → 挂进体验流程**。

与叙事 harness（`01–07`、`fixtures/golden-stories/`）**并行、双向绑定**：文案未定稿前，视觉用「场景意图」先行，不锁死像素资产。

## 目录

```
visual/
├── README.md                 # 本文件
├── 01-pipeline.md            # 全链路
├── 02-asset-registry-spec.md # Excel 字段规范
├── 03-layout-schema.json     # AI 布局输出 JSON Schema
├── 04-ux-flow.md             # A/B/C 在体验里的位置
├── registry/                 # 素材库（CSV，可进 Excel）
├── scenes/                   # 场景 layout JSON（按故事/年）
├── stories/fuxduxian/        # 复读线第一期
├── references/               # 审美标杆案例
└── engine/                   # Phaser 渲染（V-004 脚手架）
```

## 第一期范围

**故事：** 复读线（阿岚）— **深入做满**

| 交付 | 数量 |
|------|------|
| 特殊场景（B + 部分 C） | 7（每年 1 景） |
| 日常小动画（A） | 7 组 loop |
| 标杆审美案例 | 10–20 个入库 |
| 素材 Excel/CSV | 首批 30+ 行 |

**前提：** 复读线叙事会先改一版（见 `stories/fuxduxian/narrative-gaps.md`），视觉跟改，不拿现稿当最终文案。

## 技术选型

- **渲染：** Phaser 3（内嵌 web，和 demo 同栈）
- **布局数据：** JSON（见 `03-layout-schema.json`）
- **素材编辑：** Aseprite（人工修帧）
- **AI 生成像素：** 仅补缺，不作主库

## 快速链接

- 流水线：[`01-pipeline.md`](./01-pipeline.md)
- Excel 规范：[`02-asset-registry-spec.md`](./02-asset-registry-spec.md)
- 复读线场景清单：[`stories/fuxduxian/scene-briefs.md`](./stories/fuxduxian/scene-briefs.md)
- 叙事待加强：[`stories/fuxduxian/narrative-gaps.md`](./stories/fuxduxian/narrative-gaps.md)
