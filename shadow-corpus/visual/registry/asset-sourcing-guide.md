# 像素素材寻源指南（V-002 占位）

状态：**draft** — 待 P2/P5 按审美标杆 CASE 替换 `PX-PH-*`。

## 约束

- 不用旧 zip 包
- 优先 CC0 / 明确可商用
- 32×32 或 16×16 像素风，可 scale 2×

## 推荐免费库

| 来源 | 许可 | 适用 |
|------|------|------|
| [Kenney](https://kenney.nl/assets) | CC0 | UI、道具、简单 tile |
| [OpenGameArt](https://opengameart.org/) | 逐条看 | 场景 tileset |
| [itch.io 免费像素包](https://itch.io/game-assets/free/tag-pixel-art) | 逐条看 | 角色、室内 |
| [LPC (Universal LPC)](https://opengameart.org/content/lpc-character-base) | CC-BY-SA | 角色基模（需署名） |

## 复读线需求映射

| 年 | 场景 | 建议检索词 |
|----|------|------------|
| 1 | 教室雨窗 | classroom, rain, window, desk |
| 2 | 查分夜 | paper, score, night, lamp |
| 3 | 食堂 | cafeteria, tray, table |
| 4 | 舞台 | stage, curtain, microphone |
| 5 | 宿舍 | dorm, bed, alarm |
| 6 | 雨棚 | rain, shelter, bag |
| 7 | 邮局 | post office, letter, window |

## 入库流程

1. 下载 → `visual/assets/raw/{source}/`
2. 登记 [`registry/assets.csv`](../registry/assets.csv)（替换对应 `PX-PH-*` 行）
3. 更新 layout JSON 的 `asset_id`
4. V-006 人审勾选

## 队友

- [ ] P2 从 aesthetic-cases 定 2–3 套色板
- [ ] P5 统一 32px grid 与命名
