'use strict';

(function intakeApp() {
  const STEPS = ['另一条路', '那时的你', '十个瞬间', '确认'];
  const Q_SECTIONS = ['岔路口', '性格', '关系', '价值'];
  const STORAGE_KEY = 'shadow_intake_profile';

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
      scenario_corrected: null
    },
    selectedTags: [],
    answers: {},
    answerMeta: {},
    tagsData: null,
    questions: [],
    scenario: null,
    previewText: ''
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
    choiceInput: document.getElementById('choiceInput'),
    descInput: descInputEl(),
    oneLinerInput: document.getElementById('oneLinerInput'),
    birthYear: document.getElementById('birthYear'),
    forkYear: document.getElementById('forkYear'),
    ageAtFork: document.getElementById('ageAtFork'),
    choiceRing: document.getElementById('choiceRing'),
    descRing: document.getElementById('descRing'),
    descNudge: document.getElementById('descNudge'),
    exampleCards: document.getElementById('exampleCards')
  };

  function descInputEl() {
    return document.getElementById('descInput');
  }

  async function init() {
    const [tagsRes, qRes] = await Promise.all([
      fetch('/data/intake-tags.json'),
      fetch('/data/intake-questions.json')
    ]);
    state.tagsData = await tagsRes.json();
    state.questions = await qRes.json();
    bindLayerA();
    renderExamples();
    renderTagCategories();
    renderStepNav();
    syncAgeFromYears();
    showStep(0);
  }

  function bindLayerA() {
    el.choiceInput.addEventListener('input', () => {
      state.layerA.choice_text = el.choiceInput.value.trim();
      updateCharRing(el.choiceInput.value, el.choiceRing, 20, 120);
      scheduleClassify();
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
    el.ageAtFork.addEventListener('change', () => {
      state.layerA.age_at_fork = Number(el.ageAtFork.value);
    });

    el.scenarioCapsule?.addEventListener('click', () => {
      el.scenarioPopover?.classList.toggle('intake-hidden');
    });

    el.btnBack.addEventListener('click', goBack);
    el.btnNext.addEventListener('click', goNext);
  }

  function renderExamples() {
    if (!el.exampleCards || !state.tagsData?.examples) return;
    el.exampleCards.innerHTML = '';
    for (const ex of state.tagsData.examples) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'intake-example-card';
      card.innerHTML = `<strong>${ex.title}</strong><p>${ex.choice}</p><p style="margin-top:8px">${ex.description}</p>`;
      card.addEventListener('click', () => {
        el.choiceInput.value = ex.choice;
        el.descInput.value = ex.description;
        state.layerA.choice_text = ex.choice;
        state.layerA.self_description = ex.description;
        updateCharRing(ex.choice, el.choiceRing, 20, 120);
        updateCharRing(ex.description, el.descRing, 40, 200);
        scheduleClassify();
        schedulePreview();
      });
      el.exampleCards.appendChild(card);
    }
  }

  function syncAgeFromYears() {
    state.layerA.birth_year = Number(el.birthYear.value);
    state.layerA.fork_year = Number(el.forkYear.value);
    const auto = state.layerA.fork_year - state.layerA.birth_year;
    if (!el.ageAtFork.dataset.touched) {
      el.ageAtFork.value = String(auto);
    }
    state.layerA.age_at_fork = Number(el.ageAtFork.value);
    el.ageAtFork.addEventListener('input', () => {
      el.ageAtFork.dataset.touched = '1';
    }, { once: true });
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

  function renderTagCategories() {
    if (!el.tagCategories || !state.tagsData) return;
    el.tagCategories.innerHTML = '';
    const selectedByCat = {};
    for (const t of state.selectedTags) {
      selectedByCat[t.category_id] = selectedByCat[t.category_id] || [];
      selectedByCat[t.category_id].push(t.id);
    }

    for (const cat of state.tagsData.categories) {
      const details = document.createElement('details');
      details.className = 'intake-tag-category';
      details.open = cat.display_order <= 2;
      const tags = state.tagsData.tags.filter((t) => t.category_id === cat.id);
      const count = (selectedByCat[cat.id] || []).length;
      details.innerHTML = `<summary><span>${cat.label_zh}</span><span>${count}/${cat.max_select}</span></summary>`;

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
    el.stepChips.innerHTML = '';
    STEPS.forEach((label, i) => {
      const chip = document.createElement('span');
      chip.className = 'intake-step-chip' + (i === state.step ? ' active' : '') + (i < state.step ? ' done' : '');
      chip.textContent = `${i + 1}. ${label}`;
      el.stepChips.appendChild(chip);
    });
  }

  function showStep(step) {
    state.step = step;
    renderStepNav();
    el.stepLayerA.classList.toggle('intake-hidden', step !== 0);
    el.stepLayerB.classList.toggle('intake-hidden', step !== 1);
    el.stepLayerC.classList.toggle('intake-hidden', step !== 2);
    el.stepConfirm.classList.toggle('intake-hidden', step !== 3);

    el.btnBack.disabled = step === 0;
    el.btnNext.textContent = step === 3 ? '开始七年 →' : '继续';

    if (step === 2) renderQuestion();
    if (step === 3) renderConfirm();
    if (step === 1) schedulePreview();
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
    el.confirmSummary.innerHTML = `
      <div class="intake-confirm-block"><h3>岔路口</h3><p>${escapeHtml(state.layerA.choice_text)}</p></div>
      <div class="intake-confirm-block"><h3>那时的你</h3><p>${escapeHtml(state.layerA.self_description || '—')}</p></div>
      <div class="intake-confirm-block"><h3>标签</h3><p>${escapeHtml(tags)}</p></div>
      <div class="intake-confirm-block"><h3>影子初读</h3><p>${escapeHtml(state.previewText || localPreview())}</p></div>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function validateStep() {
    if (state.step === 0) {
      const c = state.layerA.choice_text.length;
      if (c < 20) {
        alert('岔路口再多说一点——影子需要一个具体的分叉（至少 20 字）。');
        return false;
      }
      if (!state.layerA.birth_year || !state.layerA.fork_year) return false;
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

  async function submitIntake() {
    const questionAnswers = state.questions.map((q) => ({
      question_id: q.id,
      answer: state.answers[q.id],
      duration_ms: state.answerMeta[q.id]?.duration_ms || 0
    }));

    const body = {
      layerA: state.layerA,
      selectedTags: state.selectedTags,
      questionAnswers,
      scenarioFromText: state.scenario,
      meta: { total_duration_ms: Date.now() - state.startedAt }
    };

    let fullProfile;
    try {
      const res = await fetch('/api/intake/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      fullProfile = await res.json();
    } catch (_) {
      fullProfile = null;
    }

    const handoff = fullProfile?.profile || {
      choice: state.layerA.choice_text,
      description: state.layerA.self_description,
      quote: state.layerA.one_liner,
      age: state.layerA.age_at_fork,
      birth_year: state.layerA.birth_year,
      fork_year: state.layerA.fork_year,
      keywords: state.selectedTags.filter((t) => t.category_id === 'trait' || t.category_id === 'mood_at_fork').map((t) => t.label)
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ handoff, fullProfile: fullProfile || body }));
    window.location.href = '/?intake=1';
  }

  init().catch((err) => {
    console.error(err);
    alert('加载采集页失败，请刷新重试。');
  });
})();
