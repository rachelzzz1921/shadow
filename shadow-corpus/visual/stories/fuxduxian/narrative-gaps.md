# 复读线 — 叙事待加强（视觉前置）

> **现状：** golden 可过 eval，但文案和设计不够贴、不够有画面感。  
> **原则：** 视觉第一期跟叙事**同改**，不用现稿当最终字幕。

## 主要问题（P2 改稿清单）

| # | 问题 | 举例 | 视觉影响 |
|---|------|------|----------|
| 1 | 部分年 **event 太短**，缺可画瞬间 | 年 3「开始一个人吃饭」 | B 场景无构图锚点 |
| 2 | **物件不够具体** | prop 多为 desk | 素材库难选型 |
| 3 | **情绪词抽象** | 「钝」「压」 | mood_tags 对不上 |
| 4 | shadow_dialogue 有的像 **caption** | 年 3 食堂灯 | 与画面抢戏 |
| 5 | pivotal 与 quiet **视觉对比未写进文本** | — | B/C 强度难定 |
| 6 | memory 好，**年正文未充分展开** | m2 撕准考证 | A 动画缺分镜 |

## 改稿时要补的字段（给视觉用）

每年 narrative 除现有字段外，建议 P2 增补：

```yaml
visual_anchor: "一句话可画画面"
key_props: [领带, 准考证, 行李箱]
mood_visual: "灰绿、雨、窄构图"   # 可画情绪
daily_micro: "日常小动画动作描述"
```

## 与 golden 的关系

1. 先在 `stories/fuxduxian/narrative-draft-v2.md` 改满 7 年  
2. P4 story-review 通过后 → 回写 `fixtures/golden-stories/复读线.json`  
3. 再锁 `scenes/fuxduxian/year-N.layout.json`

## Gate

**G-N1** P2 叙事 v2 brief 签字 → 才开始 AI 布局批量生成
