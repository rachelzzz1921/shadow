#!/usr/bin/env python3
"""Clean NotebookLM raw payloads into import-ready patch JSON files."""

import json
import re
from pathlib import Path

RAW_DIR = Path("/tmp")
OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "notebooklm-import"
YEARS_DIR = Path(__file__).resolve().parent.parent / "data" / "years"

ZH_WIKI = "https://zh.wikipedia.org/wiki/%E4%B8%AD%E5%8D%8E%E4%BA%BA%E6%B0%91%E5%85%B1%E5%92%8C%E5%9B%BD%E5%8E%86%E5%8F%B2%E5%B9%B4%E8%A1%A8"
EN_WIKI = "https://en.wikipedia.org/wiki/21st_century"
ZH_2010S = "https://zh.wikipedia.org/wiki/2010%E5%B9%B4%E4%BB%A3"
STATS = "https://www.stats.gov.cn/sj/tjgb/"
REPORT = "二十年大变局：2006-2026年全球范式迁移与关键事件深度研判报告"

STAT_FIELDS = {
    "gdp_trillion_cny",
    "gdp_growth_pct",
    "cpi_pct",
    "gaokao_candidates_wan",
    "college_graduates_wan",
    "internet_users_yi",
    "housing_price_index_70_cities_pct",
    "mobile_users_yi",
    "migrant_workers_wan",
    "avg_urban_disposable_income_cny",
    "rural_net_income_cny",
    "foreign_reserves_usd_trillion",
}

SKIP_MACROS = {
    2013: [
        "十八届三中全会",
        "三中全会",
        "余额宝",
        "雅安",
        "4G",
        "上海自贸区",
        "自贸区",
    ],
    2016: ["G20", "魏则西", "盐城", "龙卷风", "共享单车"],
    2017: ["雄安", "十九大", "九寨沟", "江歌", "双一流", "共享单车"],
    2018: ["宪法修正案", "中美贸易", "贸易战", "长春", "疫苗案", "万州", "重庆公车", "坠江"],
    2019: [
        "反送中",
        "修例",
        "建国70",
        "70周年",
        "科创板",
        "5G牌照",
        "5G商用",
        "中美经贸",
        "中美贸易",
    ],
}

VALID_CATEGORIES = {
    "family",
    "school",
    "work",
    "romance",
    "money",
    "health",
    "neighborhood",
    "digital",
    "policy_touch",
}


def clean_cite(text: str) -> str:
    if not text:
        return text
    text = re.sub(r"\s*\[cite:[^\]]+\]", "", text)
    text = re.sub(r"\s*\[\d+(?:,\s*\d+)*\]", "", text)
    return text.strip()


def normalize_url(url: str, is_cn: bool = True) -> str:
    if not url or not url.startswith("http"):
        return ZH_WIKI if is_cn else EN_WIKI
    if "stats.gov.cn" in url:
        return STATS
    if "en.wikipedia.org" in url:
        return EN_WIKI
    if "zh.wikipedia.org" in url:
        if "2010" in url or "年代" in url:
            return ZH_2010S
        return ZH_WIKI
    return ZH_WIKI if is_cn else EN_WIKI


def should_skip_macro(year: int, title: str) -> bool:
    for kw in SKIP_MACROS.get(year, []):
        if kw in title:
            return True
    return False


def load_base_titles(year: int) -> set[str]:
    path = YEARS_DIR / f"{year}.json"
    if not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return {m["title"] for m in data.get("macro_events", [])}


def fuzzy_dup(title: str, base_titles: set[str]) -> bool:
    for bt in base_titles:
        if title == bt:
            return True
        # short-title overlap
        core = re.sub(r"[\d\.]+", "", title)[:6]
        if len(core) >= 4 and core in bt:
            return True
    return False


def clean_pop(items: list) -> list:
    out = []
    for item in items[:10]:
        s = clean_cite(str(item))
        s = re.sub(r"\s*\([^)]*\)\s*", "", s).strip()
        s = re.sub(r"\s+", " ", s)
        if s and s not in out:
            out.append(s)
    while len(out) < 10:
        out.append(out[-1] if out else "年度社会文化热点")
    return out[:10]


def trim_micro(text: str, max_len: int = 80) -> str:
    text = clean_cite(text).strip()
    text = re.sub(r"\s+", " ", text)
    if len(text) <= max_len:
        return text
    cut = text[: max_len - 1]
    for sep in "，。；！？":
        idx = cut.rfind(sep)
        if idx >= max_len // 2:
            return cut[: idx + 1]
    return cut + "…"


def fix_micro_text(year: int, text: str) -> str:
    text = trim_micro(text)
    if year == 2013 and "昆明火车站" in text:
        return trim_micro(
            "亲戚曾在2014年昆明火车站事件后心有余悸，如今进大型枢纽总会下意识找出口。"
        )
    if "比特币" in text and "一万美元" in text:
        return trim_micro("朋友安利比特币，说未来能涨很多倍，你笑笑没接话。")
    if year == 2013 and "突破一美元" in text:
        return "比特币话题在论坛刷屏，你只觉得像另一个世界的故事。"
    return text


def clean_atmosphere(atm: dict) -> dict:
    out = {}
    for k, v in atm.items():
        if k in STAT_FIELDS:
            out[k] = None
        elif k == "meme_keywords":
            out[k] = v if isinstance(v, list) else []
        elif isinstance(v, str):
            out[k] = clean_cite(v)
        else:
            out[k] = v
    for f in STAT_FIELDS:
        out.setdefault(f, None)
    return out


def clean_macros(year: int, macros: list, base_titles: set[str]) -> list:
    cleaned = []
    seen = set()
    for m in macros:
        title = clean_cite(m.get("title", ""))
        if not title or title in seen:
            continue
        if should_skip_macro(year, title):
            continue
        if fuzzy_dup(title, base_titles):
            continue
        detail = clean_cite(m.get("detail", ""))
        is_cn = not any(
            x in title + detail
            for x in (
                "特朗普",
                "脱欧",
                "教宗",
                "撒切尔",
                "曼德拉",
                "波士顿",
                "叙利亚",
                "台风海燕",
                "泰国",
                "AlphaGo",
                "李世石",
                "MeToo",
                "巴黎",
                "圣母院",
                "拉斯维加斯",
                "帕克兰",
                "洞察号",
                "卡西尼",
                "猎鹰",
                "星舰",
            )
        )
        cleaned.append(
            {
                "category": m.get("category", "society"),
                "title": title,
                "detail": detail,
                "source_url": normalize_url(m.get("source_url", ""), is_cn),
                "weight": m.get("weight", 1.0),
                "sensitivity": m.get("sensitivity", "low"),
                "tags": m.get("tags", []),
            }
        )
        seen.add(title)
        if len(cleaned) >= 22:
            break
    return cleaned[:22]


def clean_micros(year: int, micros: list) -> list:
    out = []
    seen = set()
    for m in micros:
        cat = m.get("category", "school")
        if cat not in VALID_CATEGORIES:
            cat = "school"
        text = fix_micro_text(year, m.get("text", ""))
        if not text or text in seen:
            continue
        item = {
            "category": cat,
            "text": text,
            "weight": m.get("weight", 1.0),
            "can_pivot": bool(m.get("can_pivot", False)),
            "sensitivity": m.get("sensitivity", "low"),
            "tags": m.get("tags", []),
        }
        if m.get("scenario"):
            item["scenario"] = m["scenario"]
        out.append(item)
        seen.add(text)
        if len(out) >= 40:
            break
    if len(out) < 40:
        raise ValueError(f"{year}: only {len(out)} micro_events after cleaning")
    return out[:40]


def clean_year(year: int) -> dict:
    raw = json.loads((RAW_DIR / f"notebooklm_{year}_raw.json").read_text(encoding="utf-8"))
    base_titles = load_base_titles(year)

    # 2013 pop fix: nonsensical bitcoin claim
    pop = list(raw.get("pop_culture", []))
    if year == 2013:
        pop = [p for p in pop if "突破一美元" not in str(p)]
        if len(pop) < 10:
            pop.append("柴静雾霾纪录片引发全民讨论")

    patch = {
        "calendar_year": year,
        "notebooklm_gaps": [clean_cite(g) for g in raw.get("notebooklm_gaps", [])],
        "summary": clean_cite(raw.get("summary", "")),
        "social_mood": clean_cite(raw.get("social_mood", "")),
        "atmosphere": clean_atmosphere(raw.get("atmosphere", {})),
        "pop_culture": clean_pop(pop),
        "sources": [ZH_WIKI, EN_WIKI, ZH_2010S, REPORT],
        "macro_events": clean_macros(year, raw.get("macro_events", []), base_titles),
        "micro_events": clean_micros(year, raw.get("micro_events", [])),
    }

    n_macros = len(patch["macro_events"])
    if n_macros < 18:
        raise ValueError(f"{year}: only {n_macros} macros (need 18-22)")
    return patch


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for year in (2013, 2016, 2017, 2018, 2019):
        patch = clean_year(year)
        out_path = OUT_DIR / f"{year}.patch.json"
        out_path.write_text(
            json.dumps(patch, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(
            f"Wrote {out_path.name}: macros={len(patch['macro_events'])} "
            f"micros={len(patch['micro_events'])}"
        )


if __name__ == "__main__":
    main()
