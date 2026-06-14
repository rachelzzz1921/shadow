'use strict';

import { macro } from '../helpers.mjs';

const STATS = 'https://www.stats.gov.cn/sj/tjgb/';
const CNNIC = 'https://www.cnnic.cn/hlwfzyj/hlwxzbg/';
const MOE = 'https://www.moe.gov.cn/';
const PBC = 'https://www.pbc.gov.cn/';
const GOV = 'https://www.gov.cn/';

/**
 * Year-parameterized macro events derived from atmosphere knobs.
 * Complements year-specific real events with lived-experience texture.
 */
export function universalMacros(year, atmosphere = {}) {
  const a = atmosphere;
  const gdp = a.gdp_trillion_cny ?? '—';
  const growth = a.gdp_growth_pct ?? '—';
  const cpi = a.cpi_pct ?? '—';
  const gaokao = a.gaokao_candidates_wan ?? '—';
  const grads = a.college_graduates_wan ?? '—';
  const netUsers = a.internet_users_yi ?? '—';
  const mobileUsers = a.mobile_users_yi ?? '—';
  const housingIdx = a.housing_price_index_70_cities_pct ?? a.housing_price_pct ?? '—';
  const migrant = a.migrant_workers_wan ?? '—';
  const urbanIncome = a.avg_urban_disposable_income_cny ?? '—';
  const ruralIncome = a.rural_net_income_cny ?? '—';
  const anxiety = a.dominant_anxiety ?? '就业与房价';
  const employment = a.employment_pressure ?? '结构性就业压力';
  const policy = a.policy_keyword ?? '高质量发展';
  const meme = (a.meme_keywords && a.meme_keywords[0]) || '网络热梗';
  const eduHot = a.education_hotspot ?? '考研与公考';

  return [
    macro(
      'economy',
      `${year}年GDP约${gdp}万亿元`,
      `${year}年全国GDP约${gdp}万亿元，增速${growth}%，CPI约${cpi}%，宏观数据塑造收入预期与消费信心。`,
      STATS,
      1.0,
      'low',
      ['gdp', 'macro']
    ),
    macro(
      'employment',
      `${year}年就业市场体感`,
      `${employment}；城镇新增就业与高校毕业生约${grads}万叠加，「先就业再择业」成为常见策略。`,
      STATS,
      1.1,
      'low',
      ['employment', 'graduate']
    ),
    macro(
      'housing',
      `${year}年房价指数约${housingIdx}%`,
      `70个大中城市新建住宅价格同比约${housingIdx}%；首套与二套政策、公积金与按揭利率牵动刚需与改善群体。`,
      STATS,
      1.2,
      'low',
      ['housing', 'mortgage']
    ),
    macro(
      'education',
      `${year}年高考约${gaokao}万考生`,
      `高考报名约${gaokao}万人；${eduHot}持续升温，家庭在教育支出上的机会成本讨论增多。`,
      MOE,
      1.0,
      'low',
      ['gaokao', 'education']
    ),
    macro(
      'tech_internet',
      `${year}年网民约${netUsers}亿`,
      `CNNIC统计网民约${netUsers}亿、手机用户约${mobileUsers}亿；移动支付、短视频与平台经济渗透日常生活。`,
      CNNIC,
      1.0,
      'low',
      ['internet', 'mobile']
    ),
    macro(
      'society',
      `${year}年城乡收入差距`,
      `城镇人均可支配收入约${urbanIncome}元、农村约${ruralIncome}元；进城务工约${migrant}万，户籍与公共服务均等化仍是议题。`,
      STATS,
      0.9,
      'low',
      ['income', 'rural']
    ),
    macro(
      'society',
      `${year}年社会焦虑主轴`,
      `舆论与家庭谈话中「${anxiety}」高频出现，影响婚育、职业选择与地域流动决策。`,
      GOV,
      1.0,
      'low',
      ['anxiety', 'mood']
    ),
    macro(
      'politics_policy',
      `${year}年政策关键词：${policy}`,
      `年度政策与规划表述围绕「${policy}」展开，地方落实通过项目、补贴与考核机制触达居民。`,
      GOV,
      0.9,
      'low',
      ['policy']
    ),
    macro(
      'urban_life',
      `${year}年通勤与地铁扩张`,
      `多城地铁新线开通或延伸，「TOD」「一小时通勤圈」进入租房决策；高峰拥挤成本计入生活账。`,
      STATS,
      0.8,
      'low',
      ['transit', 'urban']
    ),
    macro(
      'society',
      `${year}年家庭催婚催育压力`,
      `春节与节假日聚会中，就业、买房、结婚、生育成亲戚问答清单；代际价值观冲突在饭桌上显性化。`,
      STATS,
      1.0,
      'low',
      ['family', 'marriage']
    ),
    macro(
      'economy',
      `${year}年理财与负债`,
      `房贷、消费贷与货币基金/基金定投并存；利率变动与资产价格波动影响中产资产负债表。`,
      PBC,
      0.9,
      'low',
      ['finance', 'debt']
    ),
    macro(
      'culture_entertainment',
      `${year}年网络迷因：${meme}`,
      `「${meme}」等梗在社交媒体二次传播，构成同龄人文化暗号与情绪出口。`,
      CNNIC,
      0.7,
      'low',
      ['meme', 'culture']
    ),
    macro(
      'society',
      `${year}年医疗与体检`,
      `医保异地结算、集采降价持续推进；年轻人「体检报告焦虑」与加班文化交织。`,
      GOV,
      0.9,
      'medium',
      ['healthcare']
    ),
    macro(
      'employment',
      `${year}年灵活就业与平台用工`,
      `外卖、网约车、直播带货等吸纳大量灵活就业；社保衔接与劳动权益保障讨论不断。`,
      STATS,
      1.0,
      'low',
      ['gig', 'labor']
    ),
    macro(
      'housing',
      `${year}年租赁市场`,
      `一线与新一线租金占收入比上升，合租、群租治理与「青年公寓」政策并存，流动青年「住」的稳定性不足。`,
      STATS,
      1.0,
      'low',
      ['rent']
    ),
    macro(
      'tech_internet',
      `${year}年数字生活`,
      `扫码支付、网约车、外卖、在线会议/网课成为基础设施；算法推荐塑造信息茧房与消费路径。`,
      CNNIC,
      0.9,
      'low',
      ['digital']
    ),
    macro(
      'education',
      `${year}年职业教育与技能`,
      `制造业与服务业缺工与大学生「慢就业」并存，高职扩招与1+X证书试点推进技能通道。`,
      MOE,
      0.8,
      'low',
      ['vocational']
    ),
    macro(
      'society',
      `${year}年老龄化与养老`,
      `60岁及以上人口占比继续上升，独生子女家庭养老责任加重，社区助餐与长期护理险试点扩面。`,
      STATS,
      0.9,
      'low',
      ['aging']
    ),
    macro(
      'urban_life',
      `${year}年消费分级`,
      `平价零售与品质消费并存，「平替」「反向消费」话语出现；县域商业与电商下沉改变三四线城市消费地图。`,
      STATS,
      0.8,
      'low',
      ['consumption']
    ),
    macro(
      'urban_life',
      `${year}年环保与生活`,
      `蓝天保卫战、垃圾分类、新能源车牌与充电网络影响出行选择；极端天气新闻提高灾害风险感知。`,
      GOV,
      0.8,
      'low',
      ['environment']
    )
  ];
}
