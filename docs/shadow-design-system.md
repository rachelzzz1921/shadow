# Shadow Design System v0.1

> 叙事型互动 fiction · 暖色 16-bit 像素 · 约束来源：UI UX Pro Max（Scroll-Triggered Storytelling）+ 现有 `demo-theme.css` token。

## 品牌原则

- **不是** generic SaaS / dark cyberpunk — 保持 `#f7f0e3` 纸感 + SNES chrome
- **是** 情感叙事 Harness：岔路口 → 七年 → pivotal 介入 → 分层阅读
- 动效服务「时间流逝」与「章节推进」，不做装饰性炫技

## 色板（映射现有 token）

| 角色 | Token | 值 |
|------|-------|-----|
| 纸面 | `--paper` | `#f7f0e3` |
| 正文 | `--ink` / `--ink-soft` | `#3a3228` / `#6b5f4f` |
| 强调 | `--amber` / `--amber-deep` | `#c8863a` / `#9a6328` |
| 成功/后台 | `--sage` | `#7da87a` |
| 面板 | `--panel` + `--panel-edge` | SNES 边框体系 |

## 字体

- 主字体：`Zpix`（已嵌入）— 禁止换成 Google Webfont 破坏 pixel 一致性
- 元数据/状态：`monospace` 11px，`letter-spacing: 0.08–0.12em`

## 间距 scale

| Token | 值 |
|-------|-----|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |

## 交互

- 主 CTA：`.btn-start` / `.btn-cta` — min-height **44px**，`:focus-visible` 琥珀环
- 次 CTA：`.btn-ghost`
- 过渡：`150–250ms`，`prefers-reduced-motion: reduce` 关闭呼吸/滑入
- 进度：阶段时间轴 + 条形色块（Generate）与 demo `.yr-timeline` 视觉统一

## 页面模式

| 页面 | 模式 |
|------|------|
| `index.html` | 双路径 Hero：先读 Golden / 写我的七年 |
| `pitch.html` | 沿路 scroll + sticky CTA |
| `generate.html` | Intake → 进度屏（阶段轴）→ 介入 modal → 完成 overlay |
| `demo.html` | Live 接手 strip + 七年 timeline |
| `board.html` | 暗色团队面板，表格横向 scroll |

## 反模式（禁止）

- 纯 emoji 作图标
- 无 focus 的可点击元素
- sessionStorage 与 URL `job_id` 不一致时静默错读
- Generate 进度屏展示全文（应跳转 demo 阅读）

## 迭代日志

- **I-13** — 全站 chrome + index/pitch + token 扩展
- **I-14** — Generate 阶段轴 + 介入 UX
- **I-15** — Demo 接手 + board 模板
