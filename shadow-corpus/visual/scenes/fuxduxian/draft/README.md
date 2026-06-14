# 复读线 layout 草稿（fuxduxian-v1 包）

**状态：** `draft_review` — 使用 `PX-FDX-*` asset_id，**未**合并进上级 `year-*.layout.json` 与 `registry/assets.csv`。

素材来源：[`registry/packs/fuxduxian-v1.csv`](../../../registry/packs/fuxduxian-v1.csv)  
场景锚点：[`stories/fuxduxian/scene-briefs.md`](../../../stories/fuxduxian/scene-briefs.md)

## 选材原则

| 类型 | scene_use | 用途 |
|------|-----------|------|
| B | `special` | 每年主视觉 background + 关键 props |
| A | `daily` | `daily_loops` 轻动画 |
| C | pivotal sequence | `sequence` 多步（年 1/4/6/7） |

优先 **CC0 + 已下载 raw**；LimeZu / Reakain / AppleDog 等仅作 `license_pending` 占位。

## Demo 预览

```bash
npm run build:visual-demo   # 打包 draft → docs/demo-layouts-v1.json
npm run demo:preview        # /demo-phaser.html?v=1
```

人审通过后：复制到 `year-N.layout.json`，并将对应行写入 `assets.csv`。
