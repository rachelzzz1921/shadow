# NotebookLM Prompt — 按公历年份充实语料

**用法**：在 NotebookLM 中打开你的「近 20 年中国年代」笔记本 → 新建对话 → 将下面全文粘贴 → 把 `{YEAR}` 改成具体年份（如 `2018`）→ 发送。

---

## Prompt（复制从这里开始）

```
你是 Shadow 平行人生项目的「时代语料编辑」。只能依据本 Notebook 内已上传的资料回答，禁止用笔记本以外的知识编造。若笔记本缺少某类信息，在 JSON 里该数组留空或省略，并在 notebooklm_gaps 字段说明缺什么。

任务：为公历 {YEAR} 年的中国大陆，提取并结构化「时代背景 + 个人可能遇上的际遇」，供命运 Agent 抽样使用。

请只输出一个 JSON 代码块，不要 markdown 说明、不要前言后语。JSON 必须符合以下 schema：

{
  "calendar_year": {YEAR},
  "notebooklm_gaps": ["列出笔记本中找不到、因此未写的项"],
  "summary": "40-80字，该年中国大陆主线",
  "social_mood": "40-80字，普通青年/家庭的普遍情绪",
  "atmosphere": {
    "gdp_trillion_cny": 数字或null,
    "gdp_growth_pct": 数字或null,
    "cpi_pct": 数字或null,
    "gaokao_candidates_wan": 数字或null,
    "college_graduates_wan": 数字或null,
    "internet_users_yi": 数字或null,
    "housing_price_index_70_cities_pct": 数字或null,
    "dominant_anxiety": "一句话",
    "employment_pressure": "一句话",
    "education_hotspot": "一句话",
    "policy_keyword": "一句话",
    "meme_keywords": ["流行语1", "流行语2", "流行语3"]
  },
  "pop_culture": ["至少10条：影视、综艺、游戏、神曲、梗、现象级App"],
  "sources": ["至少5个本笔记本内出现的来源URL或文献标题"],
  "macro_events": [
    {
      "category": "politics_policy|economy|education|tech_internet|culture_entertainment|disaster_crisis|society|urban_life|employment|housing 之一",
      "title": "10字内标题",
      "detail": "2-4句，可核查的具体事实，含时间/地点/数字",
      "source_url": "笔记本中出现的链接；若无URL则用 https://www.stats.gov.cn/sj/tjgb/ 并在detail末尾注明文献名",
      "weight": 0.8-1.5,
      "sensitivity": "low|medium|high",
      "tags": ["英文小写标签"]
    }
  ],
  "micro_events": [
    {
      "category": "family|school|work|romance|money|health|neighborhood|digital|policy_touch",
      "scenario": "family|love|friendship|academic|career|self_growth",
      "text": "20-60字，个人尺度际遇，像那一年真实会发生的事",
      "weight": 0.5-1.4,
      "can_pivot": true或false,
      "sensitivity": "low|medium|high",
      "tags": []
    }
  ]
}

数量要求（在笔记本资料允许范围内尽量满足）：
- macro_events ≥ 25 条，覆盖至少 6 个 category
- micro_events ≥ 40 条，且六个 scenario 每个至少 5 条
- 敏感事件（地震、疫情、重大事故等）必须真实，sensitivity 标 medium 或 high，detail 不煽情不消费灾难
- micro 的 academic 域：含高考/考研/复读/留学/就业季等至少 8 条
- micro 的 family 域：含父母期待/春节/经济压力等至少 6 条

写作禁忌：
- 不要写爽文逆袭、不要鸡汤
- 不要统一口径「国家一切都好」——要有人真实的焦虑与具体生活细节
- 不要把用户画像写进 micro（不写「小明」），用「你」或无主语句

请先在心里按笔记本目录检索 {YEAR}，再输出 JSON。
```

---

## 保存结果

1. 复制 NotebookLM 输出的 JSON。
2. 保存为：`world/data/notebooklm-import/{YEAR}.patch.json`
3. 运行：`cd world && node scripts/import-notebooklm-patch.mjs && npm run validate`

## 建议批次

按年从用户最熟悉的岔路口年代开始，例如：`2016, 2017, 2018, 2019, 2020, 2021, 2022`，再补 2006–2015 与 2023–2026。
