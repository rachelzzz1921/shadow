'use strict';

/**
 * Intake 主角匹配 — shadow-characters-v1（20 张像素小人）
 * 供 http://localhost:3000/intake.html 实时预览 + full_profile.visual_character
 */
(function exportCharacterLibrary(global) {
  const STORAGE_KEY = 'shadow_visual_character';

  let catalog = null;
  let loading = null;

  async function load() {
    if (catalog) return catalog;
    if (loading) return loading;
    loading = fetch('/data/shadow-characters-v1.json')
      .then(r => {
        if (!r.ok) throw new Error(`catalog HTTP ${r.status}`);
        return r.json();
      })
      .then(j => {
        catalog = j;
        return j;
      })
      .catch(err => {
        console.warn('[ShadowCharacterLibrary]', err.message);
        catalog = { characters: [], image_base: '/visual-characters/' };
        return catalog;
      });
    return loading;
  }

  function normalizeGender(g) {
    if (g === 'female' || g === 'male' || g === 'neutral') return g;
    return 'neutral';
  }

  function ageVibe(age) {
    const a = Number(age);
    if (!a) return 'young_adult';
    if (a <= 17) return 'youth';
    if (a >= 28) return 'mature';
    return 'young_adult';
  }

  /** Client-side mirror of server character-matcher */
  function matchLocal(state) {
    const chars = catalog?.characters || [];
    if (!chars.length) return null;

    const gender = normalizeGender(state.layerA?.gender);
    const ageVibeKey = ageVibe(state.layerA?.age_at_fork);
    const tags = (state.selectedTags || []).map(t => t.label || t);
    const text = [
      state.layerA?.choice_text,
      state.layerA?.self_description,
      state.layerA?.one_liner
    ].filter(Boolean).join(' ');
    const domain = state.scenario?.scenario_primary || state.scenario?.domain || null;

    const scored = chars.map(ch => {
      let score = 0;
      if (gender === 'neutral') score += 2;
      else if (ch.gender_presentation === gender) score += 12;
      else if (ch.gender_presentation === 'neutral') score += 4;
      else score -= 6;

      if (ch.age_vibe === ageVibeKey) score += 3;
      if (domain && (ch.domain_affinity || []).includes(domain)) score += 4;

      for (const hint of ch.intake_tag_hints || []) {
        if (tags.some(t => t.includes(hint) || hint.includes(t))) score += 3;
        if (text.includes(hint)) score += 2;
      }
      return { ch, score };
    }).sort((a, b) => b.score - a.score);

    const pick = scored[0]?.ch || chars[0];
    return {
      asset_id: pick.asset_id,
      file: pick.file,
      label_zh: pick.label_zh,
      image_url: `/visual-characters/${pick.file}`,
      score: scored[0]?.score ?? 0
    };
  }

  function renderPreview(mount, match) {
    if (!mount || !match) return;
    mount.innerHTML = `
      <div class="intake-char-preview">
        <img src="${match.image_url}" alt="${match.label_zh}" width="96" height="96" class="intake-char-sprite" />
        <p class="intake-char-label">${match.label_zh}</p>
        <p class="intake-char-id">${match.asset_id}</p>
      </div>`;
  }

  async function refreshPreview(mount, state) {
    await load();
    const match = matchLocal(state);
    if (!match) return null;
    renderPreview(mount, match);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    } catch (_) { /* ignore */ }
    return match;
  }

  global.ShadowCharacterLibrary = {
    load,
    matchLocal,
    refreshPreview,
    renderPreview,
    getStored() {
      try {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      } catch {
        return null;
      }
    }
  };
})(window);
