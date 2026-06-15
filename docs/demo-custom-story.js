'use strict';

/**
 * 自定义 Intake → 七年 Demo（规则合成，无需 LLM）
 * 输出形状与 Golden / Live session 兼容，供 demo.html?live=1 浏览。
 */
(function exportCustomStory(global) {
  const BEATS = [
    { year: 1, type: 'pivotal', seed: '岔路口后的第一年' },
    { year: 2, type: 'quiet', seed: '第一次主动迈出一步' },
    { year: 3, type: 'pivotal', seed: '被推向一个没预料到的位置' },
    { year: 4, type: 'quiet', seed: '第一次用自己的方式站稳' },
    { year: 5, type: 'pivotal', seed: '更大的分叉出现在面前' },
    { year: 6, type: 'quiet', seed: '做一件真正属于自己的事' },
    { year: 7, type: 'quiet', seed: '第七年，回头看岔路口' }
  ];

  const DOMAIN_VISUAL = {
    academic: { environment: 'classroom', pose: 'wait', prop: 'desk', city: 'city2', scene: 'rain' },
    love: { environment: 'home', pose: 'phone', prop: 'phone', city: 'city5', scene: 'night' },
    friendship: { environment: 'cafeteria', pose: 'wait', prop: 'desk', city: 'city5', scene: 'city' },
    career: { environment: 'office', pose: 'doing', prop: 'laptop', city: 'city6', scene: 'office' },
    family: { environment: 'home', pose: 'phone', prop: 'phone', city: 'city1', scene: 'night' },
    self_growth: { environment: 'dorm_night', pose: 'think', prop: 'desk', city: 'city3', scene: 'night' }
  };

  const ENV_LABEL = {
    classroom: '教室', home: '出租屋', cafeteria: '食堂',
    office: '工位', dorm_night: '宿舍夜', trainstation: '车站'
  };

  const DOMAIN_TITLES = {
    academic: ['开学那间教室', '举手的一刻', '意外的机会', '第一笔自己挣的', '再次选择', '忘记时间的课题', '毕业前夜'],
    love: ['心动之后', '日常里的裂缝', '一次硬撑', '说出来的那句话', '距离与选择', '重新靠近', '第七年的答案'],
    career: ['入行', '第一次被看见', '扛下来的项目', '工资到账那天', '要不要换轨', '做对了的事', '站稳了'],
    family: ['离开家的行李', '电话里的沉默', '回去一趟', '第一次说不', '各自的节奏', '迟来的理解', '第七年'],
    friendship: ['新圈子', '被落下的感觉', '主动靠近', '一起熬过的夜', '分流', '还剩谁', '毕业前'],
    self_growth: ['第一步', '不再解释', '被需要的瞬间', '自己的钱', '再试一次？', '忘记吃饭', '回望岔路口']
  };

  function detectDomain(profile, full) {
    const w = full?.scenario_weights;
    if (w) {
      const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
      if (top) return top[0];
    }
    const t = `${profile?.choice || ''}${(profile?.keywords || []).join('')}`;
    if (/恋|爱|婚|对象|喜欢/.test(t)) return 'love';
    if (/工|职|创|公司|上班/.test(t)) return 'career';
    if (/学|考|读|研|复/.test(t)) return 'academic';
    if (/父|母|家|老家/.test(t)) return 'family';
    if (/朋友|室友|同辈/.test(t)) return 'friendship';
    return 'self_growth';
  }

  function eraForYear(forkYear, narrativeYear, snippets) {
    // year 1 = 岔路口当年（与 fate band 的 fork + year - 1 对齐）
    const cal = forkYear + narrativeYear - 1;
    const hit = snippets?.[String(cal)];
    return hit?.era_line || `${cal}年 · 你的平行人生在这一年继续展开`;
  }

  function buildPersonaCard(intake) {
    const p = intake.persona || {};
    const c = intake.persona_card || {};
    return {
      name: c.name || p.shadow_name || '影',
      core_traits: c.core_traits || p.core_traits || ['还在长', '还没定型'],
      soft_spots: c.soft_spots || p.soft_spots || ['怕选错', '怕不被理解'],
      decision_tendency: c.decision_tendency || p.decision_tendency || '在坚持和放手之间来回',
      growth_seed: c.growth_seed || p.growth_seed || '学会区分「别人的期待」和「自己的想要」',
      core_tension: c.core_tension || p.core_tension || ''
    };
  }

  function padEventParagraphs(core, extra) {
    let text = core;
    if (extra) text += `\n\n${extra}`;
    while (text.length < 160) {
      text += `\n\n你把这一刻记了很久——不是因为轰轰烈烈，而是因为它悄悄改变了你往后几年的节奏。`;
      if (text.length >= 160) break;
    }
    return text.length > 280 ? text.slice(0, 277) + '…' : text;
  }

  function build({ profile, persona, persona_card, full_profile, eraSnippets = {} }) {
    const card = buildPersonaCard({ persona, persona_card });
    const name = card.name;
    const choice = profile?.choice || '如果当年我走了另一条路';
    const desc = profile?.description || '';
    const quote = profile?.quote || '再撑一下，撑过去就好了。';
    const forkYear = profile?.fork_year || full_profile?.temporal?.fork_year || 2019;
    const startAge = profile?.age || full_profile?.temporal?.age_at_fork || 18;
    const domain = detectDomain(profile, full_profile);
    const visual = DOMAIN_VISUAL[domain] || DOMAIN_VISUAL.self_growth;
    const titles = DOMAIN_TITLES[domain] || DOMAIN_TITLES.self_growth;
    const keywords = (profile?.keywords || []).slice(0, 4);
    const pivotalYears = [1, 3, 5];

    const years = BEATS.map((beat, i) => {
      const y = beat.year;
      const calYear = forkYear + y - 1;
      const era = eraForYear(forkYear, y, eraSnippets);
      const isPivotal = beat.type === 'pivotal';
      const title = titles[i] || `第 ${y} 年`;
      const mood = 4 + Math.min(3, i);
      const esteem = 4 + Math.min(4, Math.floor(i * 0.8) + 1);

      let event;
      if (y === 1) {
        event = padEventParagraphs(
          `${calYear}年，岔路口之后的第一年。\n\n你记得自己说过：${choice}`,
          `${desc ? desc + '\n\n' : ''}那年 ${era.replace(/^[\d]+年 · /, '')}。你还没有证明自己选对了，但已经开始用日常回答这个问题。窗外的光、课桌上的划痕、手机里没发出去的消息，都成了这一年的底片。`
        );
      } else if (y === 7) {
        event = padEventParagraphs(
          `第七年（${calYear}），你很少再向别人解释当初的选择。`,
          `${keywords.length ? '你身上还留着这些词：' + keywords.join('、') + '。\n\n' : ''}你未必赢了什么，但这条平行线已经长成了只有你能辨认的形状。回头看，最响的转折往往发生在那些你以为只是平常的一天。`
        );
      } else {
        event = padEventParagraphs(
          `第 ${y} 年（${calYear}）。${beat.seed}。`,
          `${era}\n\n影子在这一年记住的是：你如何在「${card.decision_tendency.slice(0, 24)}…」里继续往前走。有些日子平淡得像水，但情绪会在夜里涨起来，你又得决定明天先顾哪一头。`
        );
      }

      const propLabels = {
        desk: '课桌', phone: '手机', laptop: '电脑', suitcase: '行李箱'
      };
      const keyProps = keywords.length >= 2
        ? keywords.slice(0, 3)
        : [propLabels[visual.prop] || visual.prop, title.slice(0, 6)];

      return {
        year: y,
        age: startAge + y,
        is_pivotal: isPivotal,
        scenario: domain,
        title,
        event,
        event_summary: event.slice(0, 80),
        opening: event.slice(0, 120),
        decision_made: y === 1 ? choice.slice(0, 40) : (isPivotal ? `在第 ${y} 年做了一个不会回头的小决定` : '继续把日子往前推'),
        reflection: y === 7 ? quote : `第 ${y} 年，${card.growth_seed.slice(0, 36)}…`,
        memory_summary: title,
        emotion: y < 3 ? '紧' : y < 6 ? '稳' : '轻',
        emotion_value: mood,
        new_mood: mood,
        new_esteem: esteem,
        visual_anchor: `${ENV_LABEL[visual.environment] || '此刻'} · ${title} · ${calYear}年`,
        key_props: keyProps,
        ...visual,
        intervention_prompt: isPivotal && y < 7 ? {
          question: `第 ${y} 年：让${name}先顾自己，还是先顾重要的人？`,
          options: ['先顾自己', '先顾重要的人']
        } : null
      };
    });

    const memory_stream = years.map((yr, i) => ({
      id: `cm-${i + 1}`,
      year: yr.year,
      type: yr.is_pivotal ? 'decision' : 'event',
      content: yr.decision_made || yr.title,
      weight: yr.is_pivotal ? 0.9 : 0.65
    }));

    const storyProfile = {
      choice,
      age: startAge,
      description: desc,
      quote,
      keywords,
      birth_year: profile?.birth_year || full_profile?.temporal?.birth_year,
      fork_year: forkYear,
      gender: profile?.gender || full_profile?.raw?.gender
    };

    return {
      id: 'custom',
      line_name: '你的平行线',
      scenario_primary: domain,
      scenario_secondary: 'self_growth',
      profile: storyProfile,
      persona_card: card,
      shadow: {
        character: 'Custom',
        palette: 'amber',
        trait_tags: keywords.slice(0, 3),
        gender: storyProfile.gender
      },
      premise: `影子走这条路：${choice.slice(0, 40)}${choice.length > 40 ? '…' : ''}`,
      beats: BEATS,
      pivotal_years: pivotalYears,
      memory_stream,
      years,
      final: {
        title: '七年后的回信',
        message: `我没有走大家以为我会走的那条路。\n\n${choice}\n\n七年里，有几年很紧，有几年突然松下来。${quote ? '你说过：' + quote : ''}\n\n这条路也很精彩。`,
        quote,
        sign_off: `— 影 · ${name} 敬上`
      },
      _custom_synthetic: true
    };
  }

  function buildLivePayload(story, intake) {
    const last = story.years[story.years.length - 1];
    return {
      session: {
        profile: story.profile,
        persona_card: story.persona_card,
        shadow: story.shadow,
        beats: story.beats,
        pivotal_years: story.pivotal_years,
        memory_stream: story.memory_stream,
        years: story.years,
        mood: last?.new_mood ?? 5,
        esteem: last?.new_esteem ?? 5,
        scenario: { domain: story.scenario_primary, label: story.line_name },
        visual_character: intake.visual_character || intake.full_profile?.visual_character || null,
        _custom_synthetic: true
      },
      final: story.final,
      profile: story.profile,
      full_profile: intake.full_profile || null,
      persona: intake.persona || null,
      visual_character: intake.visual_character || intake.full_profile?.visual_character || null,
      generated_at: new Date().toISOString(),
      _custom_synthetic: true
    };
  }

  /** API 全链生成 → demo.html?live=1（与 buildLivePayload 同形，供 generate-client 使用） */
  function buildLivePayloadFromApiSession(session, extras) {
    const {
      final = null,
      profile = session?.profile || null,
      full_profile = session?.full_profile || null,
      persona = null,
      visual_character = null,
      generated_at = new Date().toISOString()
    } = extras || {};
    const last = session?.years?.[session.years.length - 1];
    return {
      session: {
        ...session,
        profile: session.profile || profile,
        persona_card: session.persona_card,
        shadow: session.shadow,
        beats: session.beats,
        pivotal_years: session.pivotal_years,
        memory_stream: session.memory_stream || [],
        years: session.years || [],
        mood: session.mood ?? last?.new_mood ?? 5,
        esteem: session.esteem ?? last?.new_esteem ?? 5,
        scenario: session.scenario || null,
        visual_character:
          visual_character || session.visual_character || full_profile?.visual_character || null,
        _demo_mock: false
      },
      final,
      profile,
      full_profile,
      persona,
      visual_character:
        visual_character || session.visual_character || full_profile?.visual_character || null,
      generated_at,
      _from_generate: true
    };
  }

  global.ShadowCustomStory = { build, buildLivePayload, buildLivePayloadFromApiSession };
})(window);
