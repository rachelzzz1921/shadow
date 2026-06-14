# Shadow Visual Engine

任务 **V-004** — Phaser 3 脚手架，读取 [`03-layout-schema.json`](../03-layout-schema.json) 描述的 layout JSON。

## 用法

```bash
cd shadow-corpus/visual/engine
npm install
npm run validate:all
```

## 浏览器嵌入（V-007 部分）

- 静态 Phaser 预览：仓库根 `docs/demo-phaser.html`（`npm run demo:preview` → `/demo-phaser.html`）
- Archive live：`archive/demo-v0.2/public/index.html`

```javascript
import { createShadowScene } from '@shadow/visual-engine';

const game = new Phaser.Game({
  parent: 'scene-mount',
  scene: createShadowScene(layoutJson),
  width: 640,
  height: 360,
  pixelArt: true
});
```

## 文件

| 文件 | 作用 |
|------|------|
| `src/validate-layout.mjs` | CLI：校验 layout JSON 必填字段 |
| `src/load-layout.mjs` | 解析 layout → Phaser 层描述 |
| `src/shadow-scene.mjs` | 最小 Scene：背景 + placeholder 层 |

## 状态

- [x] layout 校验 CLI
- [x] 占位 Scene（无真实 sprite）
- [x] `docs/demo-phaser.html` 七年 layout 切换（CDN Phaser）
- [x] 挂进 archive index 侧栏入口 → `visual-preview.html`
- [ ] 挂进 archive 主舞台 fate overlay（I-8）→ **index topbar `#fateOverlay`**
