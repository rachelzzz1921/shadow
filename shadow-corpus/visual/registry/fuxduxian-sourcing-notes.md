# 复读线像素素材寻源记录

更新时间：2026-06-14

## Harness 理解

Shadow 是平行人生叙事 harness：Persona → Beats → Year×7 → Final → Dialogue。视觉模块不是装饰图，而是把 `memory_stream` 里的物件和瞬间变成可回放的画面锚点。

复读线第一期要服务三种呈现：

| 类型 | 视觉职责 | 复读线落点 |
|------|----------|------------|
| A daily loop | 2-4 帧小动作，不抢文字 | 翻书、撕纸、慢吃、改稿、睁眼、抱箱、写字 |
| B 特殊场景 | 每年 1 张主景 | 教室、查分夜、食堂、舞台、凌晨宿舍、车站、邮局 |
| C pivotal 短片 | 介入前后 3-5 步 sequence | 年1、年4、年6、final |

本次输出子集：[`packs/fuxduxian-v1.csv`](./packs/fuxduxian-v1.csv)

## 已下载 CC0 原始文件

| 来源 | 本地文件 | 用途 |
|------|----------|------|
| OpenGameArt Cool School | `visual/assets/raw/opengameart-cool-school/coolschool_tileset_48px.zip` | 年1 教室主包 |
| OpenGameArt Cool School | `visual/assets/raw/opengameart-cool-school/coolschool_tileset.png` | 年1/2 快速预览与切片 |
| OpenGameArt rain | `visual/assets/raw/opengameart-rain/rain_overlay_0.png` | 年1/6 雨层 |
| OpenGameArt Lucid Icon Pack | `visual/assets/raw/opengameart-lucid-icons/lucid-v1.2.zip` | UI / 小图标 / 麦克风候选 |

## 场景到素材策略

| 年 | 画面锚点 | 素材策略 |
|----|----------|----------|
| 1 | 雨天最后一排靠窗 | CC0 教室包 + 雨层覆盖 + 低饱和调色 |
| 2 | 查分夜撕准考证 | 现代卧室/书桌 + 纸张切碎，撕纸 loop 由人工补帧 |
| 3 | 食堂最里角 | 学校食堂包优先，餐盘和空椅用 CC0 小物补 |
| 4 | 舞台侧幕领带打反 | LimeZu 讲堂/会议厅作底，麦克风/稿纸单独补 |
| 5 | 凌晨 4:03 宿舍 | CC0/署名室内卧室，重点是手机亮点和窗帘缝光 |
| 6 | 出站雨棚 | Reakain 车站 + LimeZu Exteriors 车站候选 + 雨层 |
| 7 | 邮局小窗 | 暂无强免费邮局包，用 office/counter 改造，Tiny Town 做外观候选 |

## 推荐优先级

1. **可直接优先入库**
   - [Cool School tileset](https://opengameart.org/content/cool-school-tileset) — CC0，教室/课桌/黑板/纸张强匹配年1和年2。
   - [rain](https://opengameart.org/content/rain-1) — CC0，年1/年6 统一雨层。
   - [TopDown Interior Home Tileset](https://btl-games.itch.io/topdown) — CC0，年2/5/7 的现代室内底材。
   - [Kenney Tiny Town](https://kenney.nl/assets/tiny-town)、[Roguelike Characters](https://kenney.nl/assets/roguelike-characters)、[UI Pack - Pixel Adventure](https://kenney.nl/assets/ui-pack-pixel-adventure)、[Pixel Platformer Food Expansion](https://kenney.nl/assets/pixel-platformer-food-expansion) — CC0，适合 shared props/UI/角色基底。
   - [Lucid Icon Pack](https://opengameart.org/content/lucid-icon-pack) — CC0，UI 和小图标补缺。

2. **强匹配但需授权/付费确认**
   - [Modern Interiors](https://limezu.itch.io/moderninteriors) — 教室、食堂、卧室、角色动作覆盖面最好；完整商业使用建议付费并署名。
   - [Modern Exteriors](https://limezu.itch.io/modernexteriors) — 城市、地铁/高铁站强匹配年6；付费候选。
   - [GB Studio Trains Asset Pack](https://reakain.itch.io/gb-studio-trains) — 车站、长椅、列车、内部空间强匹配年6；注意风格是 GB Studio，需要统一色板。
   - [Ocean's Nostalgia - School Time](https://oceansdream.itch.io/nostalgia-school-time) — 教室/食堂/学生强匹配，但上线前再核商用细则。
   - [Modern Interior Tileset by AppleDog](https://apple-dog.itch.io/modern-tileset-by-appledog) — 卧室/家具可用，需署名。

3. **只作备选或后续故事复用**
   - [Pixel Office](https://masalimov-ilnur.itch.io/pixel-office) — 年7 邮局小窗的办公室柜台候选，付费且 CC-BY 4.0。
   - [Pixel Hospital Tileset](https://jackburton84.itch.io/pixel-hospital-tileset-modern-medical-pixel-art-32x32) — 不服务复读线主七景，但匹配 schema 里的 `hospital` 环境。
   - [GandalfHardcore Modern City](https://gandalfhardcore.itch.io/free-pixel-art-sidescroller-asset-pack-32x32-city) — 城市/街道/视差背景好用，但侧视风格和 top-down 主库需统一。

## 本次没入库的来源

- Pinterest / Pixilart / Playabit 图片：可以作为 moodboard 看构图，但授权和下载链不够清楚，不进入 `assets.csv`。
- Steam / 商店型 RPG Maker DLC：可做审美参考，不作为第一批低成本可用主库。
- 纯教程页截图：只保留为临摹/重绘参考，不直接纳入素材库。

## 下一步

1. P2 先从本表定 2-3 套色板：年1-3 灰冷、年4 暖舞台、年7 小窗高光。
2. P5 下载优先级 1 的包到 `visual/assets/raw/{source}/`，切片后把实际文件路径回填到主 `assets.csv`。
3. P4 对 `packs/fuxduxian-v1.csv` 做人审，标记哪些行可进入 layout。
