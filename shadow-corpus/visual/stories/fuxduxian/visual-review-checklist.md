# Visual 人审占位清单（V-006）

状态：**draft_review** — v1 寻源包已接入 UI，**未**合并主 `assets.csv` / `year-*.layout.json`

| 年 | layout (v1 draft) | B 场景 asset | A loop | C sequence | 人审 |
|----|-------------------|--------------|--------|------------|------|
| 1 | [draft/year-1.layout.json](../../scenes/fuxduxian/draft/year-1.layout.json) | PX-FDX-001+004 | read_idle | 3 步 | ☐ |
| 2 | draft/year-2 | PX-FDX-009+011 | tear_paper | — | ☐ |
| 3 | draft/year-3 | PX-FDX-013+015/016 | eat_slow | — | ☐ |
| 4 | draft/year-4 | PX-FDX-017+019/020 | edit_speech | 4 步 | ☐ |
| 5 | draft/year-5 | PX-FDX-023+024/025 | eyes_open | — | ☐ |
| 6 | draft/year-6 | PX-FDX-026+030 | hold_bag | 3 步 | ☐ |
| 7 | draft/year-7 | PX-FDX-034+033/035 | write_idle | final 3 步 | ☐ |

寻源包：[`registry/packs/fuxduxian-v1.csv`](../../registry/packs/fuxduxian-v1.csv) · [`fuxduxian-v1-manifest.json`](../../registry/packs/fuxduxian-v1-manifest.json)

## 静态 Demo 预览

**GitHub Pages（推送 `npm run board:publish` 后）：**

| 页面 | URL |
|------|-----|
| Phaser layout v1 | https://rachelzzz1921.github.io/shadow/demo-phaser.html |
| 叙事 Demo | https://rachelzzz1921.github.io/shadow/demo.html |
| legacy 占位 | https://rachelzzz1921.github.io/shadow/demo-phaser.html?legacy=1 |

**本地：**

```bash
npm run build:visual-demo
npm run demo:preview
# demo.html — 叙事页 overlay 读 v1 包
# demo-phaser.html — Phaser 七年切换 + CC0 纹理预览
# demo-phaser.html?legacy=1 — 旧 PX-PLACEHOLDER
```

## 队友

- [ ] P2 人审 draft layout → 合并进 `year-N.layout.json` + `assets.csv`
- [ ] 下载 cc0_pending（BTL / Kenney）到 `visual/assets/raw/`
- [ ] 叙事 v2 签字（G-N1）后再锁像素
