# 通用生活场景像素素材采集说明

更新日期：2026-06-14  
配套 CSV：[`packs/universal-life-scenes-v1.csv`](packs/universal-life-scenes-v1.csv)

这份清单不是某一条故事线的专用素材，而是给 Shadow 的六类场景 Agent 准备的通用视觉底座：亲情、爱情、友情、学业、事业、自我成长。目标是让 UI 和叙事层可以先用一套稳定的现代生活素材覆盖大多数场景，再按故事需要补少量专属 sprite。

## 六域覆盖模型

| Agent | 高频问题 | 优先素材类型 | 可复用公共场景 |
|---|---|---|---|
| 亲情 Agent | 家庭期待、父母关系、责任与愧疚 | 家、厨房、客厅、医院、旧物件、电话 | 家庭客厅、餐桌、医院、便利店、小镇门口 |
| 爱情 Agent | 分手、复合、异地、亲密关系选择 | 咖啡馆、餐厅、雨夜街道、车站、聊天 UI | 城市街景、车站、家中卧室、花店、雨层 |
| 友情 Agent | 朋友分流、圈子变化、陪伴与疏远 | 食堂、宿舍、便利店、客厅聚会、群聊 icon | 学校食堂、便利店、城市街道、客厅、公园路口 |
| 学业 Agent | 复读、考研、转专业、出国读书 | 教室、图书馆、宿舍、自习桌、考试 UI | 教室、图书馆、校务办公室、食堂、讲座厅 |
| 事业 Agent | 就业、考公、创业、转行、城市机会 | 办公室、面试等候区、会议室、城市外景、通勤站台 | 办公楼、地铁/火车站、医院、便利店、会议室 |
| 自我成长 Agent | 离开舒适区、身份认同、人生方向、长期遗憾 | 小镇道路、自然水边、卧室、镜子、情绪 icon | 小镇路口、自然场景、深夜便利店、雨层、图书馆 |

## 使用方式

1. 先按 `story_tags` 筛六域，例如 `爱情,异地` 或 `事业,城市机会`。
2. 再按 `type` 拿层级：`background` 做主空间，`prop` 做关键物，`character` 做人物占位，`fx` 做气氛层，`ui` 做状态/选择/对话。
3. `scene_use=daily` 适合常驻日常；`scene_use=special` 适合高情绪节点；`both` 可以跨日常和关键剧情。
4. `usage_case` 是给 UI/叙事 Agent 的一行示例，不是最终剧情文案。Cursor 应该把它当作布局和情绪提示。
5. `notes` 里有授权风险。CSV 没有 license 字段，这是产品规范限制；真实上线前必须从 `notes` 回查来源页或下载包内 license。

## 来源分层

**Tier 0：低风险基础层，优先下载进 raw**

| 来源 | 用途 | 备注 |
|---|---|---|
| Kenney Tiny Town / Roguelike Characters / UI Pack / Food | 小镇、NPC、UI、食物 props | CC0，适合快速占位和 UI 基础件 |
| OpenGameArt Cool School / Rain / Lucid Icons | 教室、雨层、图标 | CC0，适合直接进基础库 |
| BTL TopDown Interior Home | 家居、卧室、客厅 | itch 页面标 CC0，适合亲情/爱情/成长 |

**Tier 1：高覆盖主力层，适合统一商业视觉**

| 来源 | 用途 | 备注 |
|---|---|---|
| LimeZu Modern Interiors | 家、学校、餐厅、图书馆、医院、会议厅、工作室 | 覆盖最广，完整商用需付费并署名 |
| LimeZu Modern Exteriors | 城市街区、建筑外景、城市机会 | 与 Interiors 风格统一 |
| LimeZu Modern Office / Modern User Interface | 事业场景、对话框、头像、按钮 | 适合把 UI 和场景统一起来 |
| Reakain City / Trains / Convenience / Kitchen | 城市、车站、便利店、厨房 | 可商用可改，但禁再分发/AI/NFT |

**Tier 2：专项补强层，按场景需要采购或复核**

| 来源 | 用途 | 备注 |
|---|---|---|
| JackBurton Pixel Hospital | 医院、照护、医疗职业 | 免费商用，禁再分发 |
| Ocean's Nostalgia - School Time | 教室、食堂、体育馆、师生 | 页面写 royalty-free，商用细节需复核 |
| Graduation Cat House Interior | 家居细节、镜子、电话、奖杯、书桌 | 免费/付费内容不同 |
| AppleDog Modern Interior | 温暖家居备选 | 可商用需署名，建议复核许可截图 |
| GandalfHardcore Modern City | 城市横向过场、街道、parallax | 免费可商用，侧视资产需独立用法 |
| Sprout Lands | 自然、农场、恢复场景 | 免费版非商业，商用需 premium |
| Penzilla Top-Down Retro Interior | 复古室内备选 | 非商业免费，商用需付费 |
| Pixel Office | 办公室细节和职场角色 | 付费，CC-BY 4.0 |
| Ferd Plastic Interiors | 公寓、办公室、咖啡馆 | 可商用需署名，色彩需调到 Shadow 色板 |

## UI 接入建议

- 把 CSV 当作候选素材 catalog，不要一次性全部加载到 UI。
- UI 里建立 `Agent -> story_tags -> asset_id[]` 映射，例如 `爱情 Agent / 异地` 可先取 `PX-UNI-014`, `PX-UNI-018`, `PX-UNI-023`, `PX-UNI-090`。
- 对每个 Agent 至少准备三类资产：一个主背景、一个关键 prop 或 fx、一个 UI 状态 icon。
- 同一来源包内的素材优先组合，少混风格。例如 LimeZu 室内 + LimeZu UI 是一组，Reakain 城市 + Reakain 车站是一组，Kenney/OGA 适合做 CC0 占位层。
- 如果 UI 需要展示来源，不显示授权判断，只显示 `source_url` 和内部审核状态；授权判断留在设计/法务流程。

## 给 Cursor 的话

Cursor，请优先读取 `/Users/chenzhiwei/Documents/shadow/shadow-corpus/visual/registry/universal-life-scenes-sourcing-notes.md` 和 `/Users/chenzhiwei/Documents/shadow/shadow-corpus/visual/registry/packs/universal-life-scenes-v1.csv`。这份 CSV 是通用生活像素素材候选库，覆盖亲情、爱情、友情、学业、事业、自我成长六类 Agent 的高频场景；UI 设计时按 `story_tags` 和 `type` 筛素材，`background` 作为场景底图，`prop/fx` 作为关键情绪物件，`ui` 作为对话、选择和状态提示，不要把它当成某一条故事线的专用资源。优先用 `notes` 标成 CC0 或可商用明确的素材做占位，涉及付费、署名、禁止再分发或商用需复核的来源，只进入候选态，等人工确认后再加入正式 UI。

## 暂时排除

- Pinterest、Pixilart、Playabit、Steam 页面截图：可做 mood reference，但不进入 registry。
- 授权只写在评论区、没有包内 license 的来源：可以候选，但上线前要截图归档并人工确认。
- 过度奇幻、战斗、怪物主题包：除非 UI 需要隐喻，否则不作为六域通用底座。
