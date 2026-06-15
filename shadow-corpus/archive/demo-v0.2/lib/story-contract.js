'use strict';

const VALID_SCENES = ['city', 'home', 'office', 'nature', 'night', 'rain'];
const VALID_ENVIRONMENTS = [
  'office', 'home', 'hospital', 'seaside', 'stage', 'studio',
  'classroom', 'dorm_night', 'trainstation', 'postoffice', 'cafeteria'
];
const VALID_POSES = [
  'idle', 'run', 'sit', 'phone', 'type', 'write', 'tired', 'celebrate', 'carry',
  'doing', 'wait', 'hurt', 'cast', 'reel', 'walk', 'think', 'read'
];
const VALID_PROPS = ['desk', 'laptop', 'phone', 'hospital', 'suitcase', 'stage'];
const VALID_CITIES = ['city1', 'city2', 'city3', 'city4', 'city5', 'city6', 'city7', 'city8'];

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function pickValid(value, valid, fallback) {
  return valid.includes(value) ? value : fallback;
}

function inferStageDetails(year) {
  const text = `${year.title || ''}${year.scene || ''}${year.event || ''}`;
  if (/复读|教室|高考|后排|课桌|班/.test(text)) return { environment: 'classroom', pose: 'wait', prop: 'desk' };
  if (/失眠|凌晨|宿舍|夜里|寝室/.test(text)) return { environment: 'dorm_night', pose: 'tired', prop: 'desk' };
  if (/火车|站台|候车|出站|复试/.test(text)) return { environment: 'trainstation', pose: 'carry', prop: 'suitcase' };
  if (/邮局|窗口|汇款|字真好看|柜台/.test(text)) return { environment: 'postoffice', pose: 'doing', prop: 'desk' };
  if (/食堂|吃饭|餐厅|盒饭/.test(text)) return { environment: 'cafeteria', pose: 'wait', prop: 'desk' };
  if (/病|护士|母亲|住院|疲|累/.test(text)) return { environment: 'hospital', pose: 'tired', prop: 'hospital' };
  if (/电话|来电|语音/.test(text)) return { environment: 'home', pose: 'phone', prop: 'phone' };
  if (/海|渔网|写剧情|剧本/.test(text)) return { environment: 'seaside', pose: 'write', prop: 'laptop' };
  if (/首映|分享|观众|庆功|发言|讲台/.test(text)) return { environment: 'stage', pose: 'celebrate', prop: 'stage' };
  if (/雨|地铁|路上|入职|搬|护照/.test(text)) return { environment: 'office', pose: 'carry', prop: 'suitcase' };
  if (/清晨|窗台|名单/.test(text)) return { environment: 'studio', pose: 'write', prop: 'desk' };
  if (/公司|项目|上线|版本|关卡|电脑/.test(text)) return { environment: 'office', pose: 'type', prop: 'laptop' };
  return { environment: 'home', pose: 'idle', prop: 'desk' };
}

function inferVisualAnchor(event) {
  const text = String(event || '').trim();
  if (!text) return '';
  const firstPara = (text.split(/\n\n/)[0] || text).replace(/\s+/g, ' ');
  return firstPara.length <= 48 ? firstPara : firstPara.slice(0, 47) + '…';
}

function inferKeyProps(year) {
  const text = `${year?.event || ''}${year?.decision_made || ''}`;
  const hints = ['手机', '电话', '书包', '准考证', '名单', '电脑', '泡面', '啤酒', '拿铁', '行李箱', '课桌', '窗口', '汇款单', '渔网', '剧本'];
  const props = hints.filter((p) => text.includes(p));
  if (props.length < 2) {
    const propMap = { phone: '手机', desk: '课桌', laptop: '电脑', suitcase: '行李箱', hospital: '病床' };
    const fromProp = propMap[year?.prop];
    if (fromProp && !props.includes(fromProp)) props.push(fromProp);
  }
  while (props.length < 2) props.push(props.length ? '窗外的光' : '桌上的东西');
  return props.slice(0, 3);
}

function normalizeYear(year, { index = 0, startAge = 26, beats = null, pivotalYears = [] } = {}) {
  const inferred = inferStageDetails(year || {});
  const yearN = clampInt(year?.year, 1, 7, index + 1);
  let isPivotal = typeof year?.is_pivotal === 'boolean'
    ? year.is_pivotal
    : pivotalYears.includes(yearN);
  if (beats && beats[index]) isPivotal = beats[index].type === 'pivotal';

  const emotionLabel = typeof year?.emotion === 'object'
    ? year.emotion.label
    : year?.emotion;
  const emotionValue = typeof year?.emotion === 'object'
    ? year.emotion.value
    : year?.emotion_value;

  return {
    year: yearN,
    age: clampInt(year?.age, 12, 90, startAge + yearN),
    is_pivotal: isPivotal,
    title: year?.title || `第${yearN}年`,
    scene: pickValid(year?.scene, VALID_SCENES, 'city'),
    environment: pickValid(year?.environment, VALID_ENVIRONMENTS, inferred.environment),
    pose: pickValid(year?.pose, VALID_POSES, inferred.pose),
    prop: pickValid(year?.prop, VALID_PROPS, inferred.prop),
    city: pickValid(year?.city, VALID_CITIES, 'city1'),
    event: year?.event || '这一年的故事还没有写完。',
    decision_made: year?.decision_made || '',
    intervention_prompt: isPivotal ? (year?.intervention_prompt || null) : null,
    emotion: emotionLabel || '未知',
    emotion_value: clampInt(emotionValue, 1, 10, 5),
    new_mood: clampInt(year?.new_mood ?? emotionValue, 1, 10, 5),
    new_esteem: clampInt(year?.new_esteem, 1, 10, 5),
    reflection: year?.reflection || '',
    shadow_dialogue: year?.shadow_dialogue || '',
    memory_summary: year?.memory_summary || (year?.reflection || year?.event || '').slice(0, 28),
    visual_anchor: year?.visual_anchor || inferVisualAnchor(year?.event),
    key_props: Array.isArray(year?.key_props) && year.key_props.length >= 2
      ? year.key_props.slice(0, 3)
      : inferKeyProps(year),
    daily_micro: year?.daily_micro || null,
    user_intervention: year?.user_intervention || null
  };
}

const REFLECTION_QUIET = /接受|够了|安静|不是最好|平稳|字真好看/;

function inferMemoryType(year) {
  if (year.is_pivotal) return 'decision';
  const text = `${year.reflection || ''}${year.memory_summary || ''}`;
  if (REFLECTION_QUIET.test(text)) return 'reflection';
  return 'event';
}

function inferMemoryWeight(year, type) {
  if (type === 'decision') return 0.85;
  if (type === 'reflection') {
    if (year.year === 7) return 0.75;
    return 0.5;
  }
  if (year.year === 2) return 0.7;
  if (year.year === 5) return 0.6;
  return 0.5;
}

function memoryFromYear(year) {
  const type = inferMemoryType(year);
  return {
    id: `m${year.year}`,
    year: year.year,
    type,
    content: year.memory_summary,
    weight: inferMemoryWeight(year, type)
  };
}

function normalizeStory(story, { profile } = {}) {
  if (!story || !Array.isArray(story.years)) {
    throw new Error('Story must include years');
  }
  const pivotalYears = Array.isArray(story.pivotal_years) ? story.pivotal_years : [];
  const beats = Array.isArray(story.beats) ? story.beats : null;
  const startAge = profile?.age || story.profile?.age || 26;
  const years = story.years.map((year, index) =>
    normalizeYear(year, { index, startAge, beats, pivotalYears })
  );
  return {
    ...story,
    profile: story.profile || profile || null,
    premise: story.premise || `如果当初选择：${profile?.choice || story.profile?.choice || '另一条路'}`,
    pivotal_years: pivotalYears,
    beats,
    years,
    memory_stream: Array.isArray(story.memory_stream)
      ? story.memory_stream
      : years.map(memoryFromYear),
    final: story.final || (story.final_message ? {
      title: `${story.shadow_name || '影子'}的七年`,
      message: story.final_message
    } : null)
  };
}

module.exports = {
  inferStageDetails,
  inferVisualAnchor,
  inferKeyProps,
  inferMemoryType,
  inferMemoryWeight,
  memoryFromYear,
  normalizeStory,
  normalizeYear,
  valid: {
    scenes: VALID_SCENES,
    environments: VALID_ENVIRONMENTS,
    poses: VALID_POSES,
    props: VALID_PROPS,
    cities: VALID_CITIES
  }
};
