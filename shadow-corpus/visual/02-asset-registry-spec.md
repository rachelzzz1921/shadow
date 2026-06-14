# 素材库 Excel / CSV 规范

文件位置：`visual/registry/assets.csv`（Excel 打开编辑后存回 CSV 或 xlsx）

**不含授权字段**（按产品要求）。

## 列定义

| 列名 | 必填 | 说明 | 示例 |
|------|------|------|------|
| asset_id | ✅ | 唯一 ID | `PX-001` |
| name | ✅ | 素材名称 | 教室最后一排课桌 |
| source_url | ✅ | 来源页 | https://… |
| type | ✅ | character / background / prop / fx / ui | background |
| size | ✅ | 像素尺寸 | 320×180 tile 16px |
| frames | | 单图或 sheet 帧数 | 1 或 4×2 |
| style_tags | ✅ | 逗号分隔 | 校园,现代,灰调 |
| mood_tags | ✅ | 逗号分隔 | 压抑,安静,雨 |
| story_tags | ✅ | 叙事标签 | 复读,教室,最后一排 |
| scene_use | ✅ | special / daily / both | special |
| usage_case | ✅ | **一句使用案例** | 年1雨天，阿岚坐最后一排靠窗，书包在桌上 |
| notes | | 人审备注 | 色调偏冷，适合年1年6 |

## 使用案例写法

- 必须含：**年号或场景类型 + 谁 + 做什么 + 关键物件**
- 好：`年6 复试出站，阿岚抱 suitcase 坐靠窗，窗外雨`
- 差：`教室背景`（太泛）

## 标杆案例（references）

入库前在 `references/aesthetic-cases.md` 留一条：

```markdown
### CASE-01 — 年7 邮局
- assets: PX-012, PX-034
- 为何好: 留白大，老太太窗口只占 1/3 画幅
- 审核: P2 @日期
```

## 导出给 AI

按 `story_tags` 或 `scene_use` 筛子集 → `registry/packs/fuxduxian-v1.csv`
