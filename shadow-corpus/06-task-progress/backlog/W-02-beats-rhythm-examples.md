# Beats 节奏示例 ×2（占位 · W-02）

供 Beats agent / 命运 agent 读入的节奏样例（非 UI 展示）。

## 示例 A — 复读型（golden）

```json
{
  "beats": [
    { "year": 1, "type": "pivotal", "seed": "复读班开学，雨天" },
    { "year": 2, "type": "quiet", "seed": "二战分数比一战低 7 分" },
    { "year": 3, "type": "quiet", "seed": "上了不甘心的二本" },
    { "year": 4, "type": "pivotal", "seed": "被推选当学生会主席" },
    { "year": 5, "type": "quiet", "seed": "开始失眠" },
    { "year": 6, "type": "pivotal", "seed": "考研复试被刷" },
    { "year": 7, "type": "quiet", "seed": "县城邮局" }
  ],
  "pivotal_years": [1, 4, 6]
}
```

## 示例 B — 留白型（反例对照）

```json
{
  "beats": [
    { "year": 1, "type": "quiet", "seed": "日子像复印件" },
    { "year": 2, "type": "quiet", "seed": "换了一座城市" },
    { "year": 3, "type": "pivotal", "seed": "第一次想离开" },
    { "year": 4, "type": "quiet", "seed": "工作稳定下来" },
    { "year": 5, "type": "quiet", "seed": "开始失眠" },
    { "year": 6, "type": "pivotal", "seed": "接到一通电话" },
    { "year": 7, "type": "quiet", "seed": "在窗口前停下" }
  ],
  "pivotal_years": [3, 6]
}
```

队友：Fate agent 可读 beats + world 语料，不在前端展示 Beats UI。
