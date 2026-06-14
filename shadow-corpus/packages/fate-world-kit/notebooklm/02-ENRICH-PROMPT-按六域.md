# NotebookLM Prompt — 按六域补 micro（第二轮）

**何时用**：某年 `npm run validate` 显示某一 scenario 不足，或 NotebookLM 按年输出里 micro 偏某一类。

**用法**：替换 `{YEAR}` 和 `{SCENARIO}`（六选一：`family` | `love` | `friendship` | `academic` | `career` | `self_growth`）。

---

## Prompt（复制从这里开始）

```
你是 Shadow 命运 Agent 的「{SCENARIO} 域语料编辑」。只依据本 Notebook 内资料，为公历 {YEAR} 年的中国大陆，补充 **个人尺度** 际遇（micro_events）。

域定义：
- family 亲情：家庭期待、父母关系、责任与愧疚
- love 爱情：分手复合、异地恋、亲密关系选择
- friendship 友情：朋友疏远、圈子变化、陪伴与距离
- academic 学业：复读、考研、换专业、留学、考试
- career 事业：就业、考公、创业、转行、城市机会
- self_growth 自我成长：迷茫、身份认同、人生方向、长期遗憾

只输出一个 JSON 代码块：

{
  "calendar_year": {YEAR},
  "scenario": "{SCENARIO}",
  "notebooklm_gaps": [],
  "micro_events": [
    {
      "category": "与内容最匹配的 family|school|work|romance|money|health|neighborhood|digital|policy_touch",
      "scenario": "{SCENARIO}",
      "text": "20-60字",
      "weight": 0.6-1.3,
      "can_pivot": false,
      "sensitivity": "low|medium|high",
      "tags": ["英文标签"]
    }
  ]
}

要求：
- 至少 15 条，彼此不重复
- 必须像 {YEAR} 年真实会发生的事（结合当年政策、就业、文化背景）
- can_pivot 仅对「会改变人生选择」的际遇标 true（约 1/3）
- 禁止编造笔记本里没有的时代背景；细节可合理推演但不得虚构重大新闻

不要输出除 JSON 外的任何文字。
```

---

保存为 `world/data/notebooklm-import/{YEAR}.{scenario}.patch.json`（例如 `2018.academic.patch.json`），合并脚本同样支持。
