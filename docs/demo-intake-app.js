'use strict';

(function intakeApp() {
  const STEPS = ['另一条路', '那时的你', '十个瞬间', '确认'];
  const STEP_SUB = ['岔路口', '标签', '行为题', '确认'];
  const Q_SECTIONS = ['岔路口', '性格', '关系', '价值'];
  const STORAGE_PROFILE = 'shadow_full_profile';
  const STORAGE_PERSONA = 'shadow_persona';
  const STORAGE_SOURCE = 'shadow_persona_source';
  const DEFAULT_SKIP_STORY_ID = 'wufuxdu';

  const state = {
    step: 0,
    questionIndex: 0,
    startedAt: Date.now(),
    layerA: {
      choice_text: '',
      self_description: '',
      one_liner: '',
      birth_year: 2001,
      fork_year: 2019,
      age_at_fork: 18,
      gender: 'female',
      scenario_corrected: null
    },
    selectedTags: [],
    answers: {},
    answerMeta: {},
    tagsData: null,
    questions: [],
    scenario: null,
    previewText: '',
    activePresetId: null,
    openTagCats: null,
    quickPath: false
  };

  let nudgeTimer = null;
  let classifyTimer = null;
  let previewTimer = null;
  let descEditedAt = 0;

  const el = {
    stepChips: document.getElementById('stepChips'),
    mainPanel: document.getElementById('mainPanel'),
    previewBody: document.getElementById('previewBody'),
    scenarioCapsule: document.getElementById('scenarioCapsule'),
    scenarioPopover: document.getElementById('scenarioPopover'),
    btnBack: document.getElementById('btnBack'),
    btnNext: document.getElementById('btnNext'),
    btnSkipDemo: document.getElementById('btnSkipDemo'),
    btnQuickPlay: document.getElementById('btnQuickPlay'),
    serverBanner: document.getElementById('serverBanner'),
    stepLayerA: document.getElementById('stepLayerA'),
    stepLayerB: document.getElementById('stepLayerB'),
    stepLayerC: document.getElementById('stepLayerC'),
    stepConfirm: document.getElementById('stepConfirm'),
    tagCategories: document.getElementById('tagCategories'),
    qSectionChips: document.getElementById('qSectionChips'),
    qTitle: document.getElementById('qTitle'),
    qSub: document.getElementById('qSub'),
    qNote: document.getElementById('qNote'),
    qRenderer: document.getElementById('qRenderer'),
    qProgress: document.getElementById('qProgress'),
    confirmSummary: document.getElementById('confirmSummary'),
    stepDone: document.getElementById('stepDone'),
    storyPresetPicker: document.getElementById('storyPresetPicker'),
    choiceInput: document.getElementById('choiceInput'),
    descInput: descInputEl(),
    oneLinerInput: document.getElementById('oneLinerInput'),
    birthYear: document.getElementById('birthYear'),
    forkYear: document.getElementById('forkYear'),
    ageAtFork: document.getElementById('ageAtFork'),
    choiceRing: document.getElementById('choiceRing'),
    descRing: document.getElementById('descRing'),
    descNudge: document.getElementById('descNudge'),
    genderPicker: document.getElementById('genderPicker'),
    characterPreview: document.getElementById('characterPreview')
  };

  function descInputEl() {
    return document.getElementById('descInput');
  }

  function updateSourceTag(label) {
    const tag = document.getElementById('source-tag');
    if (tag) tag.textContent = `📋 Intake · ${label}`;
  }

  function bindChrome() {
    const back = document.getElementById('nav-back');
    if (back) {
      back.addEventListener('click', () => {
        if (state.step === 4) {
          window.location.href = 'index.html';
          return;
        }
        if (state.step > 0) goBack();
        else window.location.href = 'index.html';
      });
    }
    bindNavigation();
  }

  function bindNavigation() {
    if (el.btnBack && !el.btnBack.dataset.bound) {
      el.btnBack.dataset.bound = '1';
      el.btnBack.addEventListener('click', goBack);
    }
    if (el.btnNext && !el.btnNext.dataset.bound) {
      el.btnNext.dataset.bound = '1';
      el.btnNext.addEventListener('click', goNext);
    }
    if (el.btnSkipDemo && !el.btnSkipDemo.dataset.bound) {
      el.btnSkipDemo.dataset.bound = '1';
      el.btnSkipDemo.addEventListener('click', () => {
        const presetId = resolveSkipPresetId();
        if (!window.ShadowDemoMock?.isDemoStory(presetId)) {
          showStepHint('Demo 桥接未加载，请刷新页面后重试。', 'error');
          return;
        }
        goDemoFromPreset(presetId);
      });
    }
    if (el.btnQuickPlay && !el.btnQuickPlay.dataset.bound) {
      el.btnQuickPlay.dataset.bound = '1';
      el.btnQuickPlay.addEventListener('click', () => submitQuickPath());
    }
  }

  function resolveSkipPresetId() {
    if (state.activePresetId && window.ShadowDemoMock?.isDemoStory(state.activePresetId)) {
      return state.activePresetId;
    }
    return DEFAULT_SKIP_STORY_ID;
  }

  function ensurePresetContextForSkip(presetId) {
    const preset = window.ShadowIntakePresets?.byId(presetId);
    if (!preset) return;
    flushLayerAFromDom();
    if ((state.layerA.choice_text || '').length < 20) {
      state.layerA = { ...state.layerA, ...preset.layerA };
    }
    if (!state.selectedTags?.length && state.tagsData) {
      state.selectedTags = window.ShadowIntakePresets.resolveTags(preset, state.tagsData);
    }
    if (!state.scenario) {
      state.scenario = window.ShadowIntakePresets.scenarioFromPreset(preset);
    }
    state.activePresetId = presetId;
    window.ShadowDemoMock?.markDemoMode?.(presetId);
  }

  function setSkipDemoLoading(loading) {
    if (!el.btnSkipDemo) return;
    el.btnSkipDemo.disabled = loading;
    el.btnSkipDemo.textContent = loading ? '进入样例…' : '玩样例故事 →';
  }

  function setQuickPlayLoading(loading) {
    if (!el.btnQuickPlay) return;
    el.btnQuickPlay.disabled = loading;
    el.btnQuickPlay.textContent = loading ? '正在合成七年…' : quickPlayLabel();
    if (el.btnNext) el.btnNext.disabled = loading;
    if (el.btnBack) el.btnBack.disabled = loading || state.step === 0;
    if (el.btnSkipDemo) el.btnSkipDemo.disabled = loading;
  }

  function quickPlayLabel() {
    return state.step === 0 ? '跳过做题，直接玩 →' : '跳过剩余题目，直接玩 →';
  }

  function updateSkipDemoButton() {
    if (!el.btnSkipDemo) return;
    el.btnSkipDemo.classList.toggle('intake-hidden', state.step >= 4);
  }

  function updateQuickPlayButton() {
    if (!el.btnQuickPlay) return;
    el.btnQuickPlay.classList.toggle('intake-hidden', state.step >= 4);
    el.btnQuickPlay.textContent = quickPlayLabel();
    el.btnQuickPlay.disabled = false;
  }

  function showServerBanner(message, tone) {
    if (!el.serverBanner) return;
    if (!message) {
      el.serverBanner.classList.add('intake-hidden');
      el.serverBanner.textContent = '';
      return;
    }
    el.serverBanner.textContent = message;
    el.serverBanner.classList.remove('intake-hidden', 'is-ok', 'is-error');
    el.serverBanner.classList.add(tone === 'ok' ? 'is-ok' : 'is-error');
  }

  async function pingServer() {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      showServerBanner('本地服务已连接 · localhost:3000', 'ok');
      setTimeout(() => showServerBanner(''), 2500);
      return true;
    } catch (_) {
      // 无 API 也能用：预设走 Mock，自定义走规则兜底。静默降级，不弹吓人的红条。
      showServerBanner('');
      return false;
    }
  }

  function renderStoryPresets() {
    const picker = el.storyPresetPicker;
    const presets = window.ShadowIntakePresets?.PRESETS;
    if (!picker || !presets?.length) return;

    picker.innerHTML = '';
    for (const preset of presets) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'story-chip' + (state.activePresetId === preset.id ? ' is-active' : '');
      chip.dataset.presetId = preset.id;
      chip.innerHTML =
        `<span class="story-chip-line">${preset.line_name}</span>` +
        `<span class="story-chip-name">影 · ${preset.shadow_name} · ${preset.blurb}</span>`;
      chip.addEventListener('click', () => applyPreset(preset.id));
      window.ShadowAudio?.bindOptionButton?.(chip);
      picker.appendChild(chip);
    }
  }

  function applyPreset(presetId) {
    const preset = window.ShadowIntakePresets?.byId(presetId);
    if (!preset) return;

    state.activePresetId = preset.id;
    window.ShadowDemoMock?.markDemoMode?.(preset.id);
    state.layerA = {
      ...state.layerA,
      ...preset.layerA,
      scenario_corrected: null
    };

    el.choiceInput.value = state.layerA.choice_text;
    el.descInput.value = state.layerA.self_description;
    el.oneLinerInput.value = state.layerA.one_liner || '';
    el.birthYear.value = String(state.layerA.birth_year);
    el.forkYear.value = String(state.layerA.fork_year);
    el.ageAtFork.value = String(state.layerA.age_at_fork);
    // 预设给的年龄等于 fork-birth，重置 touched 让后续改年份仍能自动跳转
    delete el.ageAtFork.dataset.touched;

    if (preset.layerA?.gender) setGender(preset.layerA.gender);
    else if (!state.layerA.gender) setGender('female');

    updateCharRing(el.choiceInput.value, el.choiceRing, 10, 120);
    updateCharRing(el.descInput.value, el.descRing, 40, 200);

    state.selectedTags = window.ShadowIntakePresets.resolveTags(preset, state.tagsData);
    state.scenario = window.ShadowIntakePresets.scenarioFromPreset(preset);
    state.openTagCats = defaultOpenTagCats();
    for (const t of state.selectedTags) state.openTagCats.add(t.category_id);
    paintScenarioCapsule();

    renderTagCategories();
    renderStoryPresets();
    schedulePreview();
    updateSkipDemoButton();
    updateQuickPlayButton();

    flushLayerAFromDom();
    updateCharRing(el.choiceInput?.value || '', el.choiceRing, 10, 120);
    updateCharRing(el.descInput?.value || '', el.descRing, 40, 200);

    if ((state.layerA.choice_text || '').length >= 20) {
      showStep(1);
      showStepHint(`已载入「${preset.line_name}」· 影 ${preset.shadow_name}。再点继续 → 十个行为题。`, 'ok');
    } else {
      showStepHint('预设岔路口偏短，请补写几个字后再点继续。', 'warn');
    }

    try {
      const q = preset.id === 'fuxduxian' ? '' : `?preset=${encodeURIComponent(preset.id)}`;
      const page = document.body.classList.contains('generate-unified') ? 'generate.html' : 'intake.html';
      history.replaceState(null, '', `${page}${q}`);
    } catch (_) { /* ignore */ }

    updateSourceTag(`${preset.line_name} · 预设`);
    el.mainPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function paintScenarioCapsule() {
    if (!el.scenarioCapsule || !state.scenario) return;
    el.scenarioCapsule.classList.remove('intake-hidden', 'dim');
    el.scenarioCapsule.textContent = `📍 ${state.scenario.label} · 预设`;
    renderScenarioPopover(state.scenario);
  }

  function presetFromLocation() {
    const id = new URLSearchParams(location.search).get('preset');
    return window.ShadowIntakePresets?.byId(id) ? id : null;
  }

  function flagInvalid(input) {
    if (!input) return;
    input.classList.remove('field-invalid');
    // 强制 reflow 以便重复触发动画
    void input.offsetWidth;
    input.classList.add('field-invalid');
    input.addEventListener('input', () => input.classList.remove('field-invalid'), { once: true });
  }

  function showStepHint(message, tone) {
    const hint = document.getElementById('stepHint');
    if (!hint) {
      if (message) alert(message);
      return;
    }
    if (!message) {
      hint.textContent = '';
      hint.classList.add('intake-hidden');
      hint.classList.remove('is-warn', 'is-error');
      return;
    }
    hint.textContent = message;
    hint.classList.remove('intake-hidden', 'is-warn', 'is-error', 'is-ok');
    hint.classList.add(
      tone === 'error' ? 'is-error' : tone === 'ok' ? 'is-ok' : 'is-warn'
    );
    hint.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.btnNext?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function loadIntakeData() {
    const [tagsRes, qRes] = await Promise.all([
      fetch('data/intake-tags.json'),
      fetch('data/intake-questions.json')
    ]);
    if (!tagsRes.ok || !qRes.ok) {
      throw new Error(`采集数据加载失败（tags ${tagsRes.status} · questions ${qRes.status}）`);
    }
    state.tagsData = await tagsRes.json();
    state.questions = await qRes.json();
    // 时代锚点（供离线规则合成七年时注入真实年份背景）
    fetch('demo-era-snippets.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((snips) => { if (snips) window.__shadowEraSnippets = snips; })
      .catch(() => { /* 缺失则用通用时代线 */ });
  }

  async function init() {
    bindChrome();
    window.ShadowAudio?.mountToggle?.();
    await pingServer();
    try {
      await loadIntakeData();
    } catch (err) {
      console.error(err);
      showStepHint(
        '标签/行为题数据未加载。请确认 npm run demo:local 在运行，然后刷新。',
        'error'
      );
      showServerBanner(
        '采集数据加载失败。请运行 npm run demo:local 后刷新；或打开首页直达 Demo。',
        'error'
      );
      return;
    }
    window.__shadowSeedTags = state.tagsData;
    bindLayerA();
    renderGenderPicker();
    renderStoryPresets();
    renderTagCategories();
    renderStepNav();
    syncAgeFromYears();
    showStep(0);

    const presetId = presetFromLocation();
    if (presetId) applyPreset(presetId);
    else setGender(state.layerA.gender || 'female');
    updateQuickPlayButton();
  }

  function bindLayerA() {
    el.choiceInput.addEventListener('input', () => {
      state.layerA.choice_text = el.choiceInput.value.trim();
      if (state.activePresetId) {
        const preset = window.ShadowIntakePresets?.byId(state.activePresetId);
        if (preset?.layerA?.choice_text !== state.layerA.choice_text) {
          state.activePresetId = null;
          window.ShadowDemoMock?.clearDemoMode?.();
          window.ShadowDemoMock?.markCustomIntake?.();
          renderStoryPresets();
          updateSkipDemoButton();
          updateQuickPlayButton();
        }
      }
      updateCharRing(el.choiceInput.value, el.choiceRing, 10, 120);
      scheduleClassify();
    });
    el.choiceInput.addEventListener('blur', () => {
      state.layerA.choice_text = el.choiceInput.value.trim();
    });
    el.descInput.addEventListener('input', () => {
      state.layerA.self_description = el.descInput.value.trim();
      descEditedAt = Date.now();
      updateCharRing(el.descInput.value, el.descRing, 40, 200);
      scheduleClassify();
      scheduleNudge();
      schedulePreview();
    });
    el.oneLinerInput.addEventListener('input', () => {
      state.layerA.one_liner = el.oneLinerInput.value.trim();
    });
    el.birthYear.addEventListener('change', syncAgeFromYears);
    el.forkYear.addEventListener('change', syncAgeFromYears);
    // 用户手动改年龄 → 标记 touched，停止自动跳转
    el.ageAtFork.addEventListener('input', () => {
      el.ageAtFork.dataset.touched = '1';
      state.layerA.age_at_fork = Number(el.ageAtFork.value);
    });
    el.ageAtFork.addEventListener('change', () => {
      state.layerA.age_at_fork = Number(el.ageAtFork.value);
    });

    el.scenarioCapsule?.addEventListener('click', () => {
      el.scenarioPopover?.classList.toggle('intake-hidden');
    });
  }

  function renderGenderPicker() {
    const root = el.genderPicker;
    const options = window.ShadowGenderSprites?.OPTIONS;
    if (!root || !options?.length) return;

    root.innerHTML = '';
    for (const opt of options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'intake-gender-chip' +
        (state.layerA.gender === opt.value ? ' is-active' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', state.layerA.gender === opt.value ? 'true' : 'false');
      btn.dataset.gender = opt.value;
      btn.title = opt.hint || opt.label;
      btn.innerHTML =
        `<span class="intake-gender-label">${opt.label}</span>` +
        `<span class="intake-gender-hint">${opt.hint || ''}</span>`;
      btn.addEventListener('click', () => setGender(opt.value));
      root.appendChild(btn);
    }
  }

  function setGender(value) {
    state.layerA.gender = window.ShadowGenderSprites?.normalize(value) || value;
    renderGenderPicker();
    window.ShadowGenderSprites?.applyToRoot(state.layerA.gender);
  }

  function clearCharacterPreview() {
    if (!el.characterPreview) return;
    el.characterPreview.innerHTML = '';
    el.characterPreview.classList.add('intake-hidden');
    el.characterPreview.hidden = true;
  }

  async function refreshCharacterPreview(visualOverride) {
    if (!el.characterPreview || state.step !== 4) {
      clearCharacterPreview();
      return null;
    }

    el.characterPreview.classList.remove('intake-hidden');
    el.characterPreview.hidden = false;

    if (visualOverride && window.ShadowCharacterLibrary?.renderPreview) {
      window.ShadowCharacterLibrary.renderPreview(el.characterPreview, visualOverride);
      return visualOverride;
    }

    if (window.ShadowCharacterLibrary) {
      return window.ShadowCharacterLibrary.refreshPreview(el.characterPreview, state);
    }
    return null;
  }

  function updateCharacterPreviewForStep(step) {
    if (step === 4) refreshCharacterPreview();
    else clearCharacterPreview();
  }

  function renderExamples() {
    /* 预设情景已迁至标题区 storyPresetPicker */
  }

  function syncAgeFromYears() {
    state.layerA.birth_year = Number(el.birthYear.value);
    state.layerA.fork_year = Number(el.forkYear.value);
    const auto = state.layerA.fork_year - state.layerA.birth_year;
    // 年份变化时自动跳转年龄（除非用户已手动覆盖）
    if (!el.ageAtFork.dataset.touched) {
      el.ageAtFork.value = String(auto);
    }
    state.layerA.age_at_fork = Number(el.ageAtFork.value);
  }

  function updateCharRing(text, ringEl, min, max) {
    if (!ringEl) return;
    const len = text.length;
    const pct = Math.min(1, len / max);
    const label = ringEl.querySelector('[data-label]');
    const circle = ringEl.querySelector('circle[data prog]') || ringEl.querySelector('circle[data-prog]');
    if (circle) circle.setAttribute('stroke-dasharray', `${pct * 88} 88`);
    let cls = '';
    let msg = `${len}/${max}`;
    if (len > 0 && len < min) {
      cls = 'warn';
      msg = `再多说一点（${len}/${min}）`;
    } else if (len >= min && len <= max) {
      cls = 'ok';
    } else if (len > max) {
      cls = 'warn';
      msg = `够了，把细节留给后面（${len}/${max}）`;
    }
    ringEl.className = 'intake-char-ring ' + cls;
    if (label) label.textContent = msg;
  }

  function scheduleNudge() {
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(() => {
      const len = el.descInput.value.length;
      if (len > 0 && len < 40 && Date.now() - descEditedAt > 4000) {
        el.descNudge?.classList.remove('intake-hidden');
      } else {
        el.descNudge?.classList.add('intake-hidden');
      }
    }, 4200);
  }

  function scheduleClassify() {
    clearTimeout(classifyTimer);
    classifyTimer = setTimeout(refreshScenario, 800);
  }

  async function refreshScenario() {
    const payload = {
      choice: state.layerA.choice_text,
      description: state.layerA.self_description
    };
    if (!payload.choice && !payload.description) {
      el.scenarioCapsule?.classList.add('intake-hidden');
      return;
    }
    el.scenarioCapsule?.classList.remove('intake-hidden');

    let result = null;
    if (window.ShadowScenarioClassify?.classifyProfile) {
      result = window.ShadowScenarioClassify.classifyProfile(payload);
    } else {
      try {
        const res = await fetch('/api/scenario/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) result = await res.json();
      } catch (_) { /* ignore */ }
    }

    if (!result) {
      el.scenarioCapsule.textContent = '📍 还在理解…';
      el.scenarioCapsule.classList.add('dim');
      return;
    }

    state.scenario = result;
    const conf = Math.round((result.confidence || 0) * 100);
    const label = state.layerA.scenario_corrected || result.label;
    if (conf < 50 && !state.layerA.scenario_corrected) {
      el.scenarioCapsule.textContent = '📍 还在理解…';
      el.scenarioCapsule.classList.add('dim');
    } else {
      el.scenarioCapsule.textContent = `📍 ${label} · ${conf}%`;
      el.scenarioCapsule.classList.remove('dim');
    }
    renderScenarioPopover(result);
  }

  function renderScenarioPopover(result) {
    if (!el.scenarioPopover) return;
    const weights = result.scenario_weights || {};
    const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
    const labels = { family: '亲情', love: '爱情', friendship: '友情', academic: '学业', career: '事业', self_growth: '自我成长' };
    el.scenarioPopover.innerHTML = '<p style="font-size:12px;color:var(--muted);margin:0 0 10px">六域分布 · 点击可纠正主域</p>';
    for (const [domain, w] of entries) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'intake-scenario-bar';
      row.style.cssText = 'width:100%;border:none;background:transparent;color:inherit;cursor:pointer;text-align:left;padding:4px 0';
      row.innerHTML = `<span>${labels[domain] || domain}</span><span class="intake-scenario-bar-track"><span class="intake-scenario-bar-fill" style="width:${Math.round(w * 100)}%"></span></span><span>${Math.round(w * 100)}%</span>`;
      row.addEventListener('click', () => {
        state.layerA.scenario_corrected = labels[domain];
        el.scenarioCapsule.textContent = `📍 ${labels[domain]} · 已纠正`;
        el.scenarioCapsule.classList.remove('dim');
        el.scenarioPopover.classList.add('intake-hidden');
      });
      el.scenarioPopover.appendChild(row);
    }
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 1200);
  }

  async function refreshPreview() {
    if (state.activePresetId && window.ShadowDemoMock?.isDemoStory(state.activePresetId)) {
      el.previewBody.textContent = localPreview();
      return;
    }
    try {
      const res = await fetch('/api/intake/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layerA: state.layerA,
          selectedTags: state.selectedTags
        })
      });
      if (res.ok) {
        const data = await res.json();
        state.previewText = data.preview || '';
        el.previewBody.textContent = state.previewText;
        return;
      }
    } catch (_) { /* fallback */ }

    el.previewBody.textContent = localPreview();
  }

  function localPreview() {
    const traits = state.selectedTags.filter((t) => t.category_id === 'trait').map((t) => t.label);
    const lines = [];
    if (traits.length) lines.push(`你像是那种${traits.slice(0, 2).join('、')}的人。`);
    if (state.layerA.self_description) {
      lines.push('我们在你的文字里，已经看到一点轮廓。');
    }
    if (!lines.length) return '影子还在听你说话——选几个词，或把岔路口说具体一点。';
    lines.push('\n*这只是初步印象，真正的影子会在七年里慢慢看清你。*');
    return lines.join('\n');
  }

  function defaultOpenTagCats() {
    return new Set(
      (state.tagsData?.categories || [])
        .filter((c) => c.display_order <= 2)
        .map((c) => c.id)
    );
  }

  function syncOpenTagCatsFromDom() {
    if (!el.tagCategories) return;
    if (!state.openTagCats) state.openTagCats = defaultOpenTagCats();
    el.tagCategories.querySelectorAll('details.intake-tag-category').forEach((node) => {
      const id = node.dataset.catId;
      if (!id) return;
      if (node.open) state.openTagCats.add(id);
      else state.openTagCats.delete(id);
    });
  }

  function renderTagCategories() {
    if (!el.tagCategories || !state.tagsData) return;
    syncOpenTagCatsFromDom();
    el.tagCategories.innerHTML = '';
    const selectedByCat = {};
    for (const t of state.selectedTags) {
      selectedByCat[t.category_id] = selectedByCat[t.category_id] || [];
      selectedByCat[t.category_id].push(t.id);
    }

    for (const cat of state.tagsData.categories) {
      const details = document.createElement('details');
      details.className = 'intake-tag-category';
      details.dataset.catId = cat.id;
      details.open = state.openTagCats.has(cat.id);
      details.addEventListener('toggle', () => {
        if (details.open) state.openTagCats.add(cat.id);
        else state.openTagCats.delete(cat.id);
      });
      const tags = state.tagsData.tags.filter((t) => t.category_id === cat.id);
      const count = (selectedByCat[cat.id] || []).length;
      const summary = document.createElement('summary');
      summary.innerHTML = `<span>${cat.label_zh}</span><span data-count>${count}/${cat.max_select}</span>`;
      details.appendChild(summary);

      const search = document.createElement('input');
      search.className = 'intake-tag-search';
      search.placeholder = '搜索标签…';
      details.appendChild(search);

      const grid = document.createElement('div');
      grid.className = 'intake-tag-grid';

      function paint(filter) {
        grid.innerHTML = '';
        const q = (filter || '').trim().toLowerCase();
        for (const tag of tags) {
          if (q && !tag.label.includes(q) && !(tag.synonyms || []).some((s) => s.includes(q))) continue;
          const selected = (selectedByCat[cat.id] || []).includes(tag.id);
          const atMax = count >= cat.max_select && !selected;
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'intake-chip' + (selected ? ' selected' : '') + (atMax ? ' disabled' : '');
          chip.textContent = tag.label;
          chip.addEventListener('click', () => toggleTag(tag, cat));
          window.ShadowAudio?.bindOptionButton?.(chip);
          grid.appendChild(chip);
        }
      }
      search.addEventListener('input', () => paint(search.value));
      paint();
      details.appendChild(grid);

      const addCustom = document.createElement('button');
      addCustom.type = 'button';
      addCustom.className = 'intake-chip custom';
      addCustom.style.margin = '0 14px 14px';
      addCustom.textContent = '+ 加一个自己的词';
      addCustom.addEventListener('click', () => {
        const label = prompt(`为「${cat.label_zh}」添加一个词：`);
        if (!label?.trim()) return;
        toggleTag({
          id: `custom-${Date.now()}`,
          category_id: cat.id,
          label: label.trim(),
          is_custom: true,
          moderation_status: 'pending'
        }, cat);
      });
      details.appendChild(addCustom);
      el.tagCategories.appendChild(details);
    }
  }

  function toggleTag(tag, cat) {
    const idx = state.selectedTags.findIndex((t) => t.id === tag.id);
    if (idx >= 0) {
      state.selectedTags.splice(idx, 1);
    } else {
      const count = state.selectedTags.filter((t) => t.category_id === cat.id).length;
      if (count >= cat.max_select) return;
      state.selectedTags.push({ ...tag, category_id: cat.id });
    }
    renderTagCategories();
    schedulePreview();
  }

  function renderStepNav() {
    if (!el.stepChips) return;
    el.stepChips.innerHTML = '';
    el.stepChips.className = 'story-picker intake-step-nav';
    STEPS.forEach((label, i) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'story-chip' +
        (i === state.step ? ' is-active' : '') +
        (i < state.step ? ' done' : '');
      chip.disabled = i > state.step || state.step === 4;
      chip.innerHTML =
        `<span class="story-chip-line">${i + 1}. ${label}</span>` +
        `<span class="story-chip-name">${STEP_SUB[i]}</span>`;
      if (i < state.step && state.step < 4) {
        chip.addEventListener('click', () => {
          if (i === 2) state.questionIndex = 0;
          showStep(i);
        });
      }
      el.stepChips.appendChild(chip);
    });
  }

  function showStep(step) {
    state.step = step;
    showStepHint('');
    renderStepNav();
    el.stepLayerA.classList.toggle('intake-hidden', step !== 0);
    el.stepLayerB.classList.toggle('intake-hidden', step !== 1);
    el.stepLayerC.classList.toggle('intake-hidden', step !== 2);
    el.stepConfirm.classList.toggle('intake-hidden', step !== 3);
    el.stepDone?.classList.toggle('intake-hidden', step !== 4);

    const stepLabels = ['岔路口', '标签', '行为题', '确认', 'Persona · 成形'];
    updateSourceTag(stepLabels[step] || '三层采集');

    el.btnBack.disabled = step === 0 || step === 4;
    el.btnNext.classList.toggle('intake-hidden', step === 4);
    el.btnNext.disabled = false;
    el.btnNext.textContent = step === 3
      ? (state.activePresetId && window.ShadowDemoMock?.isDemoStory(state.activePresetId)
        ? '进入 Demo →'
        : (window.ShadowGenerateBridge?.onIntakeComplete ? '开始 API 生成 →' : 'API 生成七年 →'))
      : '继续';

    if (step === 2) renderQuestion();
    if (step === 3) renderConfirm();
    if (step === 1) schedulePreview();
    updateCharacterPreviewForStep(step);
    updateSkipDemoButton();
    updateQuickPlayButton();
  }

  function currentQuestion() {
    return state.questions[state.questionIndex];
  }

  function renderQuestion() {
    const q = currentQuestion();
    if (!q) return;

    el.qProgress.textContent = `第 ${state.questionIndex + 1} / ${state.questions.length} 题`;
    el.qTitle.textContent = q.text;
    el.qSub.textContent = q.subtitle || '';
    el.qNote.textContent = q.note || '';

    renderQSectionChips(q.section);

    const started = state.answerMeta[q.id]?.started || Date.now();
    state.answerMeta[q.id] = { ...state.answerMeta[q.id], started };

    let val = state.answers[q.id];
    if (q.kind === 'slider' && !window.ShadowIntakeQuestions.isAnswered(q, val)) {
      val = { value: window.ShadowIntakeQuestions.defaultSliderValue(q) };
    }

    window.ShadowIntakeQuestions.renderQuestion(el.qRenderer, q, val, {
      onChange(payload) {
        state.answers[q.id] = payload;
      },
      onCommit: () => {
        if (!window.ShadowIntakeQuestions.isAnswered(q, state.answers[q.id])) return;
        const dur = Date.now() - (state.answerMeta[q.id]?.started || Date.now());
        state.answerMeta[q.id].duration_ms = dur;
        if (state.questionIndex < state.questions.length - 1) {
          state.questionIndex += 1;
          renderQuestion();
        } else {
          showStep(3);
        }
      }
    });
  }

  function renderQSectionChips(activeSection) {
    if (!el.qSectionChips) return;
    el.qSectionChips.innerHTML = '';
    const doneSections = new Set(
      state.questions.slice(0, state.questionIndex).map((q) => q.section)
    );
    for (const sec of Q_SECTIONS) {
      const chip = document.createElement('span');
      chip.className = 'intake-q-section' +
        (sec === activeSection ? ' active' : '') +
        (doneSections.has(sec) ? ' done' : '');
      chip.textContent = sec;
      el.qSectionChips.appendChild(chip);
    }
  }

  function renderConfirm() {
    const tags = state.selectedTags.map((t) => t.label).join('、') || '（未选）';
    const genderLabel = window.ShadowGenderSprites?.LABELS?.[state.layerA.gender] || '—';
    el.confirmSummary.innerHTML = `
      <div class="intake-confirm-block"><h3>岔路口</h3><p>${escapeHtml(state.layerA.choice_text)}</p></div>
      <div class="intake-confirm-block"><h3>那时的你</h3><p>${escapeHtml(state.layerA.self_description || '—')}</p></div>
      <div class="intake-confirm-block"><h3>性别 · 动画</h3><p>${escapeHtml(genderLabel)}</p></div>
      <div class="intake-confirm-block"><h3>标签</h3><p>${escapeHtml(tags)}</p></div>
      <div class="intake-confirm-block"><h3>影子初读</h3><p>${escapeHtml(state.previewText || localPreview())}</p></div>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function flushLayerAFromDom() {
    if (el.choiceInput) state.layerA.choice_text = el.choiceInput.value.trim();
    if (el.descInput) state.layerA.self_description = el.descInput.value.trim();
    if (el.oneLinerInput) state.layerA.one_liner = el.oneLinerInput.value.trim();
    if (el.birthYear && el.forkYear) syncAgeFromYears();
  }

  function validateStep() {
    flushLayerAFromDom();
    if (state.step === 0) {
      const c = state.layerA.choice_text.length;
      if (c < 10) {
        flagInvalid(el.choiceInput);
        el.choiceInput?.focus();
        const msg = c === 0
          ? '请填写岔路口（灰色提示不算）。至少 10 字，或点上方故事线 chip 自动填入。'
          : '岔路口再多说一点——影子需要一个具体的分叉（至少 10 字）。';
        showStepHint(msg, 'warn');
        return false;
      }
      if (!state.layerA.birth_year || !state.layerA.fork_year) {
        showStepHint('请选择出生年份和岔路口年份。', 'warn');
        return false;
      }
      if (!state.layerA.gender) {
        showStepHint('请选择性别，方便后续像素动画匹配。', 'warn');
        return false;
      }
      return true;
    }
    if (state.step === 2) {
      const q = currentQuestion();
      if (q && !window.ShadowIntakeQuestions.isAnswered(q, state.answers[q.id])) {
        alert('请先回答当前题目。');
        return false;
      }
    }
    return true;
  }

  function goBack() {
    if (state.step === 2 && state.questionIndex > 0) {
      state.questionIndex -= 1;
      renderQuestion();
      return;
    }
    if (state.step === 2 && state.questionIndex === 0) {
      showStep(1);
      return;
    }
    if (state.step > 0) showStep(state.step - 1);
  }

  async function goNext() {
    if (!validateStep()) return;

    if (state.step < 2) {
      showStep(state.step + 1);
      return;
    }

    if (state.step === 2) {
      const q = currentQuestion();
      if (q && window.ShadowIntakeQuestions.isAnswered(q, state.answers[q.id])) {
        const dur = Date.now() - (state.answerMeta[q.id]?.started || Date.now());
        state.answerMeta[q.id].duration_ms = dur;
        if (state.questionIndex < state.questions.length - 1) {
          state.questionIndex += 1;
          renderQuestion();
        } else {
          showStep(3);
        }
      }
      return;
    }

    if (state.step === 3) {
      await submitIntake();
    }
  }

  function answersObjFromState() {
    const answersObj = {};
    for (const q of state.questions) {
      const raw = state.answers[q.id];
      if (!raw) continue;
      let value;
      if (raw.orderedKeys) value = raw.orderedKeys;
      else if (raw.optionKey) value = raw.optionKey;
      else if (raw.value !== undefined) value = raw.value;
      else value = raw;
      answersObj[q.id] = {
        value,
        durationMs: state.answerMeta[q.id]?.duration_ms || 0
      };
    }
    return answersObj;
  }

  function persistHandoff(result) {
    const full = result.full_profile;
    try {
      sessionStorage.setItem(STORAGE_PROFILE, JSON.stringify(full));
      if (result.visual_character || full.visual_character) {
        sessionStorage.setItem('shadow_visual_character', JSON.stringify(result.visual_character || full.visual_character));
      }
      if (result.persona) {
        sessionStorage.setItem(STORAGE_PERSONA, JSON.stringify(result.persona));
      }
      if (result.persona_card) {
        sessionStorage.setItem('shadow_persona_card', JSON.stringify(result.persona_card));
      } else if (result.persona?.shadow_name) {
        sessionStorage.setItem('shadow_persona_card', JSON.stringify({
          name: result.persona.shadow_name,
          core_traits: result.persona.core_traits || [],
          soft_spots: result.persona.soft_spots || [],
          decision_tendency: result.persona.decision_tendency || '',
          growth_seed: result.persona.growth_seed || '',
          core_tension: result.persona.core_tension,
          defense_mechanism: result.persona.defense_mechanism,
          value_hierarchy: result.persona.value_hierarchy,
          voice_notes: result.persona.voice_notes,
          narrative_warnings: result.persona.narrative_warnings,
          _from_persona_agent: true
        }));
      }
      if (result.persona_source) {
        sessionStorage.setItem(STORAGE_SOURCE, result.persona_source);
      }
      if (state.activePresetId) {
        sessionStorage.setItem('shadow_intake_story_id', state.activePresetId);
      } else {
        sessionStorage.removeItem('shadow_intake_story_id');
      }
    } catch (_) { /* quota */ }
  }

  function renderCompletionHtml(result, errMsg) {
    const persona = result.persona;
    const full = result.full_profile;
    const sourceLabel = {
      llm: '阶跃星辰 LLM',
      rule_fallback: 'LLM 失败 · 规则兜底',
      rule_local: '离线规则版（无 API）',
      error: '推导异常'
    }[result.persona_source] || result.persona_source || '未知';

    const tension = (full.tension_flags || []).map((t) => `
      <div style="margin-bottom:10px">
        <div>${escapeHtml(t.detail)}</div>
        <div style="font-size:12px;color:var(--ink-muted);font-style:italic;margin-top:4px">${escapeHtml(t.note)}</div>
      </div>`).join('');

    const personaBlock = persona ? `
      <div class="persona-card snes">
        <h3>影 · ${escapeHtml(persona.shadow_name)}</h3>
        <dl>
          <dt>core_tension</dt><dd>${escapeHtml(persona.core_tension)}</dd>
          <dt>core_traits</dt><dd>${(persona.core_traits || []).map(escapeHtml).join(' · ')}</dd>
          <dt>soft_spots</dt><dd>${(persona.soft_spots || []).map((s) => `<div style="margin-bottom:8px">${escapeHtml(s)}</div>`).join('')}</dd>
          <dt>decision_tendency</dt><dd>${escapeHtml(persona.decision_tendency)}</dd>
          <dt>growth_seed</dt><dd>${escapeHtml(persona.growth_seed)}</dd>
          <dt>voice_notes</dt><dd>${escapeHtml(persona.voice_notes)}</dd>
        </dl>
      </div>` : `
      <div class="persona-card snes">
        <p style="margin:0;color:var(--ink-muted)">人格卡未生成（无 API）。Live 链仍会尝试用 full_profile 启动。</p>
      </div>`;

    const mockHref = window.ShadowIntakePresets?.mockHref(state.activePresetId) || 'demo.html?from=intake';
    const presetNote = state.activePresetId
      ? `<p class="summary-sub" style="margin-top:-8px">Mock 预览将打开 <strong>${escapeHtml(window.ShadowIntakePresets?.byId(state.activePresetId)?.line_name || state.activePresetId)}</strong> Golden 叙事壳。</p>`
      : '';

    return `
      <h2 class="summary-title">影子已经成形</h2>
      <p class="summary-sub">Persona agent · <span style="color:var(--amber)">${escapeHtml(sourceLabel)}</span>${errMsg ? ` · ${escapeHtml(errMsg)}` : ''}</p>
      ${presetNote}
      ${full.tension_flags?.length ? `<div class="tension-box snes"><div style="font-size:11px;color:var(--amber);margin-bottom:10px">⚑ 张力点</div>${tension}</div>` : ''}
      ${personaBlock}
      <p class="intake-agent-chain" style="margin:16px 0 0;text-align:center">下一步 · 七年（Beats → 命运 agent → Year×7）</p>
      <div class="summary-actions">
        <a href="demo.html?live=1" class="btn-start">进入我的七年</a>
        <a href="${mockHref}" class="btn-ghost">Mock 预览七年</a>
        <button type="button" class="btn-ghost" id="btn-restart-intake">重新采集</button>
      </div>
      <p class="intake-foot-link"><a href="index.html">← 首页</a> · <a href="demo.html">叙事 Demo</a></p>`;
  }

  async function showCompletion(result, errMsg) {
    persistHandoff(result);
    showStep(4);
    const visual =
      result.full_profile?.visual_character ||
      result.visual_character ||
      null;
    await refreshCharacterPreview(visual);
    if (el.stepDone) {
      el.stepDone.innerHTML = renderCompletionHtml(result, errMsg);
      document.getElementById('btn-restart-intake')?.addEventListener('click', () => {
        sessionStorage.removeItem(STORAGE_PROFILE);
        sessionStorage.removeItem(STORAGE_PERSONA);
        sessionStorage.removeItem(STORAGE_SOURCE);
        sessionStorage.removeItem('shadow_intake_story_id');
        window.location.reload();
      });
    }
    if (el.previewBody) {
      el.previewBody.textContent = result.persona?.core_tension ||
        '人格已写入 session。进入 Live 后，命运 agent 会按你的岔路口年份注入时代背景。';
    }
  }

  async function goDemoFromPreset(presetId) {
    ensurePresetContextForSkip(presetId);
    setSkipDemoLoading(true);
    el.btnNext.disabled = true;
    el.btnNext.textContent = '进入 Demo…';
    try {
      const mock = await window.ShadowDemoMock.completeIntakeMock(presetId, {
        layerA: state.layerA,
        selectedTags: state.selectedTags,
        answersObj: answersObjFromState(),
        scenario: state.scenario
      }, { quick: true });
      persistHandoff(mock);
      sessionStorage.setItem(STORAGE_SOURCE, 'demo_mock');
      const story = await window.ShadowDemoMock.loadGoldenStory(presetId);
      const payload = window.ShadowDemoMock.buildLiveSessionPayload(story, {
        full_profile: mock.full_profile,
        persona: mock.persona,
        visual_character: mock.visual_character
      });
      sessionStorage.setItem('shadow_live_session', JSON.stringify(payload));
      sessionStorage.setItem('shadow_intake_story_id', presetId);
      window.location.replace(window.ShadowDemoMock.demoBrowseHref(presetId));
    } catch (e) {
      alert('Demo 加载失败：' + e.message);
      setSkipDemoLoading(false);
      el.btnNext.disabled = false;
      el.btnNext.textContent = state.step === 3 ? '进入 Demo →' : '继续';
    }
  }

  async function submitIntake() {
    const questionAnswers = state.questions.map((q) => ({
      question_id: q.id,
      answer: state.answers[q.id] || null,
      duration_ms: state.answerMeta[q.id]?.duration_ms || 0
    }));

    if (state.activePresetId && window.ShadowDemoMock?.isDemoStory(state.activePresetId)) {
      await goDemoFromPreset(state.activePresetId);
      return;
    }

    el.btnNext.disabled = true;
    el.btnNext.textContent = 'Persona agent 推导中…';

    const body = {
      layerA: state.layerA,
      selectedTags: state.selectedTags,
      questionAnswers,
      scenarioFromText: state.scenario,
      meta: { total_duration_ms: Date.now() - state.startedAt },
      analyze: true,
      fallback: true
    };

    let result = null;
    let errMsg = null;
    try {
      const res = await fetch('/api/intake/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      result = await res.json();
      if (!res.ok) throw new Error(result.error || res.statusText);
      if (result.persona_source === 'error') {
        errMsg = 'LLM 推导失败，已尝试规则兜底';
      }
    } catch (e) {
      errMsg = e.message;
    }

    if (!result?.full_profile && window.ShadowIntakeProfile?.buildFullProfile) {
      const full_profile = window.ShadowIntakeProfile.buildFullProfile({
        layerA: state.layerA,
        selectedTags: state.selectedTags,
        answersObj: answersObjFromState(),
        domainDetect: state.scenario
      });
      let persona = null;
      if (window.ShadowPersonaAgent?.analyze) {
        persona = window.ShadowPersonaAgent.analyze(full_profile);
      }
      result = {
        full_profile,
        persona,
        persona_source: persona ? 'rule_local' : 'none'
      };
    }

    if (!result?.full_profile) {
      alert('采集失败，请确认已运行 npm run demo:local 或刷新重试。');
      el.btnNext.disabled = false;
      el.btnNext.textContent = 'Persona agent 推导 →';
      return;
    }

    if (!result.persona && window.ShadowPersonaAgent?.analyze) {
      result.persona = window.ShadowPersonaAgent.analyze(result.full_profile);
      result.persona_source = result.persona_source || 'rule_local';
    }

    persistHandoff(result);
    window.ShadowDemoMock?.markCustomIntake?.();
    if (el.previewBody) {
      el.previewBody.textContent = result.persona?.core_tension ||
        '人格已就绪，正在合成你的七年…';
    }
    el.btnNext.textContent = '正在合成你的七年…';

    await routeCustomToDemo(result);
  }

  function personaCardFromPersona(persona) {
    if (!persona) return null;
    return {
      name: persona.shadow_name || '影',
      core_traits: persona.core_traits || [],
      soft_spots: persona.soft_spots || [],
      decision_tendency: persona.decision_tendency || '',
      growth_seed: persona.growth_seed || '',
      core_tension: persona.core_tension,
      defense_mechanism: persona.defense_mechanism,
      value_hierarchy: persona.value_hierarchy,
      voice_notes: persona.voice_notes,
      narrative_warnings: persona.narrative_warnings,
      _from_persona_agent: true
    };
  }

  function ensureScenarioForQuickPath() {
    if (state.scenario) return state.scenario;
    if (window.ShadowScenarioClassify?.classifyProfile) {
      state.scenario = window.ShadowScenarioClassify.classifyProfile({
        choice: state.layerA.choice_text,
        description: state.layerA.self_description
      });
    }
    return state.scenario;
  }

  async function buildQuickIntakeResult() {
    ensureScenarioForQuickPath();
    const full_profile = window.ShadowIntakeProfile?.buildFullProfile({
      layerA: state.layerA,
      selectedTags: state.selectedTags,
      answersObj: answersObjFromState(),
      domainDetect: state.scenario,
      meta: { total_duration_ms: Date.now() - state.startedAt, quick_path: true }
    });
    if (!full_profile) throw new Error('无法构建 profile');

    let persona = null;
    let persona_source = 'rule_local';
    let persona_card = null;

    try {
      const res = await fetch('/api/intake/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layerA: state.layerA,
          selectedTags: state.selectedTags,
          questionAnswers: [],
          scenarioFromText: state.scenario,
          meta: { total_duration_ms: Date.now() - state.startedAt, quick_path: true },
          analyze: true,
          fallback: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.full_profile) {
          persona = data.persona || null;
          persona_card = data.persona_card || personaCardFromPersona(persona);
          persona_source = data.persona_source || 'llm';
          return { full_profile: data.full_profile, persona, persona_card, persona_source, visual_character: data.visual_character };
        }
      }
    } catch (_) { /* offline */ }

    if (window.ShadowPersonaAgent?.analyze) {
      persona = window.ShadowPersonaAgent.analyze(full_profile);
      persona_card = personaCardFromPersona(persona);
    }

    return { full_profile, persona, persona_card, persona_source, visual_character: full_profile.visual_character || null };
  }

  /** 只填岔路口基本信息 → 跳过标签与行为题 → 进入七年 */
  async function submitQuickPath() {
    flushLayerAFromDom();
    if (state.layerA.choice_text.length < 10) {
      if (state.step !== 0) showStep(0);
      flagInvalid(el.choiceInput);
      el.choiceInput?.focus();
      showStepHint(
        state.layerA.choice_text.length === 0
          ? '请先写清岔路口（至少 10 字），再点「跳过做题，直接玩」。'
          : '岔路口再多说一点——影子需要一个具体的分叉（至少 10 字）。',
        'warn'
      );
      return;
    }
    if (!state.layerA.birth_year || !state.layerA.fork_year) {
      if (state.step !== 0) showStep(0);
      showStepHint('请选择出生年份和岔路口年份。', 'warn');
      return;
    }
    if (!state.layerA.gender) {
      if (state.step !== 0) showStep(0);
      showStepHint('请选择性别，方便后续像素动画匹配。', 'warn');
      return;
    }

    state.activePresetId = null;
    window.ShadowDemoMock?.clearDemoMode?.();
    window.ShadowDemoMock?.markCustomIntake?.();
    sessionStorage.removeItem('shadow_intake_story_id');

    setQuickPlayLoading(true);
    state.quickPath = true;
    showStepHint('跳过标签与行为题，正在用你的岔路口合成七年…', 'ok');

    try {
      const result = await buildQuickIntakeResult();
      if (!result.persona && window.ShadowPersonaAgent?.analyze) {
        result.persona = window.ShadowPersonaAgent.analyze(result.full_profile);
        result.persona_card = personaCardFromPersona(result.persona);
        result.persona_source = result.persona_source || 'rule_local';
      }
      persistHandoff(result);
      if (el.previewBody) {
        el.previewBody.textContent = result.persona?.core_tension ||
          '已按你的岔路口生成人格，正在进入七年…';
      }
      await routeCustomToDemo(result);
    } catch (err) {
      console.error('[quick path]', err);
      showStepHint('快速进入失败：' + (err.message || '请刷新后重试'), 'error');
      setQuickPlayLoading(false);
    }
  }

  function buildIntakeRequest(result) {
    return {
      layerA: state.layerA,
      selectedTags: state.selectedTags,
      questionAnswers: state.questions.map((q) => ({
        question_id: q.id,
        answer: state.answers[q.id] || null,
        duration_ms: state.answerMeta[q.id]?.duration_ms || 0
      })),
      scenarioFromText: state.scenario,
      meta: {
        total_duration_ms: Date.now() - state.startedAt,
        quick_path: Boolean(state.quickPath)
      }
    };
  }

  async function handoffToGeneratePipeline(result) {
    const intakeRequest = buildIntakeRequest(result);
    try {
      sessionStorage.setItem('shadow_intake_request', JSON.stringify(intakeRequest));
    } catch (_) { /* quota */ }
    if (window.ShadowGenerateBridge?.onIntakeComplete) {
      window.ShadowGenerateBridge.onIntakeComplete({
        ...result,
        intake_request: intakeRequest
      });
      return true;
    }
    return false;
  }

  // 自定义采集 → 七年呈现。两条链路都落进 demo.html 分层 UI：
  //  · 在 generate 统一页 → ShadowGenerateBridge 本页 API 全链
  //  · API 可用但独立页 → generate.html?autostart=1
  //  · API 不可用 → ShadowCustomStory 规则即时合成 → demo.html?live=1
  async function routeCustomToDemo(result) {
    if (await handoffToGeneratePipeline(result)) return;

    const intakeRequest = buildIntakeRequest(result);
    let apiOk = false;
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      apiOk = res.ok;
    } catch (_) { apiOk = false; }

    if (apiOk) {
      try {
        sessionStorage.setItem('shadow_intake_request', JSON.stringify(intakeRequest));
      } catch (_) { /* quota */ }
      window.location.href = 'generate.html?from=intake&autostart=1';
      return;
    }

    // 离线兜底：本地规则合成七年，直接进入分层叙事浏览
    if (window.ShadowCustomStory?.build) {
      try {
        const story = window.ShadowCustomStory.build({
          profile: profileForCustom(),
          persona: result.persona,
          persona_card: result.persona_card,
          full_profile: result.full_profile,
          eraSnippets: window.__shadowEraSnippets || {}
        });
        const payload = window.ShadowCustomStory.buildLivePayload(story, result);
        sessionStorage.setItem('shadow_live_session', JSON.stringify(payload));
        window.location.href = 'demo.html?live=1';
        return;
      } catch (err) {
        console.error('[custom synth]', err);
      }
    }

    showStepHint('合成失败，请刷新后重试。', 'error');
    el.btnNext.disabled = false;
    el.btnNext.textContent = 'Persona agent 推导 →';
  }

  function profileForCustom() {
    const a = state.layerA;
    const keywords = (state.selectedTags || [])
      .map((t) => t.label || t.name || t.id)
      .filter(Boolean)
      .slice(0, 6);
    return {
      choice: a.choice_text,
      description: a.self_description,
      quote: a.one_liner,
      fork_year: a.fork_year,
      birth_year: a.birth_year,
      age: a.age_at_fork,
      gender: a.gender,
      keywords
    };
  }

  init().catch((err) => {
    console.error(err);
    alert('加载采集页失败，请刷新重试。');
  });
})();
