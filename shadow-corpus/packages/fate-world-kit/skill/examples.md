# Fate Agent — Examples

## 例 1：复读线 · 权重应长什么样

**Profile**

```json
{
  "choice": "如果当年我去复读了",
  "birth_year": 2000,
  "fork_year": 2018,
  "age": 18,
  "keywords": ["要强", "怕被看穿", "不甘"]
}
```

**Persona（阿岚）**

```json
{
  "soft_spots": ["把父母期待当成自己想要", "被否定就加倍努力"],
  "growth_seed": "学会区分「别人期待的我」和「我真正想要的」"
}
```

**期望**

- `scenario_primary` 常为 `self_growth` 或 `academic`
- `love` 权重偏低（除非 choice 含感情词）
- 叙事第 1 年（2019）quiet：`micro_sample` 应多含 `academic` / `self_growth` 域条目

**试跑**

```bash
cd shadow-corpus/world && node scripts/demo-fate-weights.mjs
```

---

## 例 2：岔路口第 0 年（2018）

```javascript
import { readFileSync } from 'fs';
import { sampleFateContext } from '../lib/sample-fate.mjs';

const pool = JSON.parse(readFileSync('./data/years/2018.json', 'utf8'));

const ctx = sampleFateContext({
  runId: 'session-abc',
  calendarYear: 2018,
  narrativeYear: 0,
  beatType: 'pivotal',
  pool,
  profile: { choice: '如果当年我去复读了', fork_year: 2018, birth_year: 2000, age: 18, keywords: ['要强'] },
  persona_card: { soft_spots: ['把父母期待当成自己想要'] }
});

// UI 展示：choice 场景 + ctx.emphasis_line + ctx.micro_sample[0].text
```

第 0 年 `narrativeYear: 0` 触发 `FORK_YEAR0_BOOST`，学业/亲情权重上升。

---

## 例 3：扩学业子池后验收

```bash
# 1. 编辑 world/lib/scenario-pools/academic.mjs 追加 5 条
# 2.
cd shadow-corpus/world
npm run generate
npm run validate
# 3. 确认输出含：学业:≥30
```

---

## 例 4：Supabase 全量 seed

```bash
cd shadow-corpus/world
cp .env.example .env
# 填 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# Supabase SQL: 001_world_era_library.sql + 002_scenario_domain.sql
npm run seed
# 期望：2006..2026 各一行 Seeded YYYY: macro=… micro=…
```

---

## 例 5：Year agent prompt 注入片段（草案）

```
# 时代与命运侧重（Fate Agent，只读事实层）
{emphasis_line}
{macro_sample 摘要 2–3 条}
{micro_sample 全文 3–5 条}

写作要求：
- quiet 年：上述作细节/新闻感/侧写，不抢 event 主线
- pivotal 年：可从 can_pivot=true 的 micro 升格为冲突种子，须服从人格卡
- 禁止编造与 macro 矛盾的年代事实
```

---

## 反例

| 做法 | 问题 |
|------|------|
| 均匀随机抽 micro | 复读线却抽到大量爱情域 |
| 虚构「2020年火星移民」作 macro | 违反真实语料原则 |
| pivotal 年写汶川地震当 quiet 背景 | 敏感事件消费；应 high sensitivity + 慎用 |
| 只改 JSON 不 run generate | 子池与 data/years 不同步 |
