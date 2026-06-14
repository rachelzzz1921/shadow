'use strict';

/**
 * Demo Mock 桥接 — 四条 Golden 预设不走 LLM，直接注入 Mock / Live session
 * 触发：Intake 点选故事线 chip（shadow_intake_story_id / shadow_demo_mode）
 */
(function exportDemoMock(global) {
  const DEMO_STORY_IDS = new Set(['fuxduxian', 'linwan', 'heartbeat_line', 'zhoudran']);

  const STORY_FILES = {
    fuxduxian: 'stories/复读线.json',
    linwan: 'stories/出国读研线-林晚.json',
    heartbeat_line: 'stories/心动爱情线-许星遥.json',
    zhoudran: 'stories/插画师线-周染.json'
  };

  const CATALOG = {
    fuxduxian: { id: 'fuxduxian', line_name: '复读线', scenario_primary: 'academic' },
    linwan: { id: 'linwan', line_name: '出国读研线', scenario_primary: 'academic', scenario_secondary: 'self_growth' },
    heartbeat_line: { id: 'heartbeat_line', line_name: '心动爱情线', scenario_primary: 'love', scenario_secondary: 'self_growth' },
    zhoudran: { id: 'zhoudran', line_name: '插画师线', scenario_primary: 'career', scenario_secondary: 'self_growth' }
  };

  const STORAGE_DEMO = 'shadow_demo_mode';

  function isDemoStory(storyId) {
    return Boolean(storyId && DEMO_STORY_IDS.has(storyId));
  }

  function resolveDemoStoryId() {
    const fromUrl = new URLSearchParams(location.search).get('story');
    if (fromUrl && isDemoStory(fromUrl)) return fromUrl;
    const mode = sessionStorage.getItem(STORAGE_DEMO);
    if (isDemoStory(mode)) return mode;
    const intake = sessionStorage.getItem('shadow_intake_story_id');
    if (isDemoStory(intake)) return intake;
    return null;
  }

  function shouldUseDemoMock() {
    if (new URLSearchParams(location.search).get('demo') === '1') return true;
    return Boolean(resolveDemoStoryId());
  }

  function markDemoMode(storyId) {
    if (!isDemoStory(storyId)) return;
    sessionStorage.setItem(STORAGE_DEMO, storyId);
    sessionStorage.setItem('shadow_intake_story_id', storyId);
  }

  function clearDemoMode() {
    sessionStorage.removeItem(STORAGE_DEMO);
  }

  async function loadGoldenStory(storyId) {
    if (!isDemoStory(storyId)) throw new Error(`非 Demo 故事: ${storyId}`);

    if (storyId === 'fuxduxian' && global.ShadowDemo?.STORY_FUXDUXIAN) {
      return { ...global.ShadowDemo.STORY_FUXDUXIAN, id: 'fuxduxian' };
    }

    const file = STORY_FILES[storyId];
    const res = await fetch(file);
    if (!res.ok) throw new Error(`无法加载 ${file}: ${res.status}`);
    const raw = await res.json();

    if (global.ShadowStories?.adaptGoldenStory) {
      return global.ShadowStories.adaptGoldenStory(raw, CATALOG[storyId]);
    }
    throw new Error('ShadowStories.adaptGoldenStory 未加载');
  }

  function personaCardToPersona(card) {
    if (!card) return null;
    return {
      shadow_name: card.name,
      core_traits: card.core_traits || [],
      soft_spots: card.soft_spots || [],
      decision_tendency: card.decision_tendency || '',
      growth_seed: card.growth_seed || card.core_tension || '',
      core_tension: card.core_tension,
      voice_notes: card.voice_notes,
      value_hierarchy: card.value_hierarchy,
      defense_mechanism: card.defense_mechanism,
      narrative_warnings: card.narrative_warnings
    };
  }

  /**
   * @param {string} storyId
   * @param {object} ctx — layerA, selectedTags, buildFullProfile fn inputs
   */
  async function completeIntakeMock(storyId, ctx) {
    markDemoMode(storyId);
    const story = await loadGoldenStory(storyId);
    const preset = global.ShadowIntakePresets?.byId(storyId);

    let full_profile = null;
    if (global.ShadowIntakeProfile?.buildFullProfile) {
      full_profile = global.ShadowIntakeProfile.buildFullProfile({
        layerA: ctx.layerA || preset?.layerA || {},
        selectedTags: ctx.selectedTags || [],
        answersObj: ctx.answersObj || {},
        domainDetect: ctx.scenario || (preset && global.ShadowIntakePresets.scenarioFromPreset(preset))
      });
    } else {
      const layerA = ctx.layerA || preset?.layerA || {};
      full_profile = {
        raw: {
          choice_text: layerA.choice_text || story.profile?.choice || '',
          self_description: layerA.self_description || story.profile?.description || '',
          one_liner: layerA.one_liner || story.profile?.quote || '',
          gender: layerA.gender || 'neutral',
          selected_tags: (ctx.selectedTags || []).map((t) => t.label || t)
        },
        temporal: {
          birth_year: layerA.birth_year,
          fork_year: layerA.fork_year,
          age_at_fork: layerA.age_at_fork ?? story.profile?.age
        },
        profile: { scenario_domain: story.scenario_primary }
      };
    }

    const persona_card = { ...story.persona_card, name: story.persona_card?.name || story.profile?.choice?.slice(0, 8) };
    const persona = personaCardToPersona(persona_card);

    let visual_character = full_profile?.visual_character || null;
    if (!visual_character && global.ShadowCharacterLibrary?.matchLocal) {
      await global.ShadowCharacterLibrary.load?.();
      visual_character = global.ShadowCharacterLibrary.matchLocal({
        layerA: ctx.layerA || preset?.layerA,
        selectedTags: ctx.selectedTags || [],
        scenario: { scenario_primary: story.scenario_primary }
      });
      if (visual_character && full_profile) full_profile.visual_character = visual_character;
    }

    return {
      full_profile,
      visual_character,
      persona,
      persona_card,
      persona_source: 'demo_mock',
      shadow: story.shadow,
      demo_story_id: storyId,
      line_name: story.line_name
    };
  }

  function buildLiveSessionPayload(story, extras = {}) {
    const lastYear = story.years?.[story.years.length - 1];
    return {
      session: {
        profile: story.profile,
        persona_card: story.persona_card,
        shadow: story.shadow,
        beats: story.beats,
        pivotal_years: story.pivotal_years,
        memory_stream: story.memory_stream,
        years: story.years,
        mood: lastYear?.new_mood ?? 5,
        esteem: lastYear?.new_esteem ?? 5,
        scenario: { domain: story.scenario_primary, label: story.line_name },
        visual_character: extras.visual_character || null,
        _demo_mock: true
      },
      final: story.final,
      profile: story.profile,
      full_profile: extras.full_profile || null,
      persona: extras.persona || personaCardToPersona(story.persona_card),
      visual_character: extras.visual_character || null,
      demo_story_id: story.id,
      generated_at: new Date().toISOString(),
      _demo_mock: true
    };
  }

  function demoBrowseHref(storyId) {
    if (!storyId || storyId === 'fuxduxian') return 'demo.html?live=1';
    return `demo.html?live=1&story=${encodeURIComponent(storyId)}`;
  }

  let eraSnippets = null;
  async function eraLineForYear(forkYear, narrativeYear) {
    if (!eraSnippets) {
      try {
        const r = await fetch('demo-era-snippets.json');
        if (r.ok) eraSnippets = await r.json();
      } catch (_) { /* ignore */ }
    }
    const y = String((forkYear || 2019) + narrativeYear - 1);
    return eraSnippets?.[y]?.era_line || `时代层 · ${y}（Demo Mock）`;
  }

  /**
   * 模拟 Live 管线 UI（无 API）
   * @param {object} hooks — { log, setProgress, setStage, markStageDone, appendYearCard, onDone }
   */
  async function simulateLivePipeline(storyId, hooks, extras = {}) {
    const story = await loadGoldenStory(storyId);
    const forkYear = extras.full_profile?.temporal?.fork_year || 2019;

    hooks.markStageDone?.('persona');
    hooks.log?.('persona', `Demo Mock · 复用 ${story.persona_card?.name || story.line_name} 人格`);
    hooks.setProgress?.(12);
    await sleep(280);

    hooks.setStage?.('beats');
    hooks.log?.('beats', `节奏就绪 · pivotal 年：${(story.pivotal_years || []).join(', ')}`);
    hooks.markStageDone?.('beats');
    hooks.setProgress?.(18);
    await sleep(320);

    hooks.setStage?.('year');
    for (let i = 0; i < (story.years || []).length; i++) {
      const y = story.years[i];
      hooks.setStage?.('fate');
      const era = await eraLineForYear(forkYear, y.year);
      hooks.log?.('fate', era.slice(0, 72));
      hooks.markStageDone?.('fate');
      hooks.setStage?.('year');
      hooks.log?.('year', `✓ 第 ${y.year} 年 · ${y.title || ''}`);
      hooks.appendYearCard?.(y, era);
      hooks.setProgress?.(18 + ((i + 1) / story.years.length) * 72);
      await sleep(220);
    }

    hooks.setStage?.('final');
    hooks.log?.('final', story.final?.title || '七年收束');
    hooks.markStageDone?.('year', 'final');
    hooks.setProgress?.(100);

    const payload = buildLiveSessionPayload(story, extras);
    sessionStorage.setItem('shadow_live_session', JSON.stringify(payload));
    if (payload.persona) {
      sessionStorage.setItem('shadow_persona', JSON.stringify({
        shadow_name: payload.persona.shadow_name,
        ...payload.persona
      }));
    }
    if (payload.session.persona_card) {
      sessionStorage.setItem('shadow_persona_card', JSON.stringify(payload.session.persona_card));
    }

    hooks.onDone?.(payload, demoBrowseHref(storyId));
    return payload;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  global.ShadowDemoMock = {
    DEMO_STORY_IDS,
    isDemoStory,
    resolveDemoStoryId,
    shouldUseDemoMock,
    markDemoMode,
    clearDemoMode,
    loadGoldenStory,
    completeIntakeMock,
    buildLiveSessionPayload,
    simulateLivePipeline,
    demoBrowseHref,
    personaCardToPersona
  };
})(window);
