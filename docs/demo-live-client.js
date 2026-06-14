/**
 * Shadow Live — Intake 推导后 → Beats → 命运 agent → Year×7 → Final → demo.html
 * UI 与 demo.html / intake 同套；走 localhost:3000 API + 阶跃/已配置 LLM
 */
'use strict';

(function () {
  const STORAGE_LIVE = 'shadow_live_session';

  const logEl = document.getElementById('live-log');
  const progressEl = document.getElementById('live-progress');
  const yearCardsEl = document.getElementById('live-year-cards');
  const linkDemo = document.getElementById('link-demo');
  const btnRun = document.getElementById('btn-run');
  const errEl = document.getElementById('live-error');
  const providerEl = document.getElementById('live-provider');
  const personaMini = document.getElementById('live-persona-mini');
  const charPreview = document.getElementById('characterPreview');
  const stageChips = document.querySelectorAll('.live-stage-chip');

  const params = new URLSearchParams(location.search);
  const autostart = params.get('autostart') === '1';

  function setStage(active) {
    stageChips.forEach(chip => {
      const s = chip.dataset.stage;
      chip.classList.remove('is-active');
      if (s === active) chip.classList.add('is-active');
    });
  }

  function markStageDone(...names) {
    stageChips.forEach(chip => {
      if (names.includes(chip.dataset.stage)) {
        chip.classList.add('is-done');
        chip.classList.remove('is-active');
      }
    });
  }

  function log(stage, msg) {
    const li = document.createElement('li');
    li.className = 'stage-' + stage;
    li.textContent = `[${stage}] ${msg}`;
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function showError(msg) {
    let text = msg;
    if (/overdue-payment|Access denied|good standing/i.test(msg)) {
      text = 'LLM 账号异常（通义 DashScope 欠费/停用）。请在 shadow-corpus/archive/demo-v0.2/.env 配置 STEPFUN_API_KEY 并设置 SHADOW_PROVIDER=stepfun，然后重启 npm run demo:local。';
    }
    errEl.textContent = text;
    errEl.classList.remove('intake-hidden');
    log('final', text.slice(0, 120));
  }

  function setProgress(pct) {
    progressEl.style.width = Math.min(100, pct) + '%';
  }

  function profileFromIntake() {
    const rawFull = sessionStorage.getItem('shadow_full_profile');
    const rawPersona = sessionStorage.getItem('shadow_persona');
    const rawCard = sessionStorage.getItem('shadow_persona_card');
    if (!rawFull || rawFull === 'null') return null;

    let full;
    try {
      full = JSON.parse(rawFull);
    } catch {
      return null;
    }
    if (!full?.raw) return null;
    const persona = rawPersona ? JSON.parse(rawPersona) : null;
    const persona_card = rawCard ? JSON.parse(rawCard) : null;

    return {
      profile: {
        choice: full.raw?.choice_text || '',
        age: full.temporal?.age_at_fork ?? 18,
        description: full.raw?.self_description || '',
        quote: full.raw?.one_liner || '',
        keywords: (full.raw?.selected_tags || []).slice(0, 6),
        birth_year: full.temporal?.birth_year,
        fork_year: full.temporal?.fork_year,
        gender: full.raw?.gender || full.temporal?.gender || null
      },
      full_profile: full,
      persona,
      persona_card,
      visual_character: full.visual_character || null
    };
  }

  function renderPersonaMini(intake) {
    const p = intake.persona;
    const card = intake.persona_card;
    if (!p && !card) {
      personaMini.innerHTML = '<p style="font-size:12px;color:var(--ink-muted)">完成 Intake 后显示人格卡</p>';
      return;
    }
    const name = p?.shadow_name || card?.name || '影子';
    const tension = p?.core_tension || card?.core_tension || '';
    const traits = (p?.core_traits || card?.core_traits || []).slice(0, 3).join(' · ');
    personaMini.innerHTML = `
      <h3 style="margin:0 0 8px;font-size:15px">影 · ${escapeHtml(name)}</h3>
      <dl>
        <dt>core_tension</dt><dd>${escapeHtml(tension)}</dd>
        <dt>core_traits</dt><dd>${escapeHtml(traits)}</dd>
      </dl>`;
  }

  function renderCharacter(intake) {
    const vc = intake.visual_character;
    if (vc && window.ShadowCharacterLibrary?.renderPreview) {
      window.ShadowCharacterLibrary.renderPreview(charPreview, {
        asset_id: vc.asset_id,
        label_zh: vc.label_zh,
        image_url: vc.image_url || `/visual-characters/${vc.file}`
      });
      return;
    }
    if (window.ShadowCharacterLibrary?.refreshPreview) {
      window.ShadowCharacterLibrary.refreshPreview(charPreview, {
        layerA: {
          gender: intake.profile.gender,
          age_at_fork: intake.profile.age,
          choice_text: intake.profile.choice,
          self_description: intake.profile.description
        },
        selectedTags: (intake.profile.keywords || []).map(l => ({ label: l }))
      });
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function openInterventionModal(prompt) {
    return new Promise((resolve) => {
      const modal = document.getElementById('intervention-modal');
      const qEl = document.getElementById('intervention-question');
      const optsEl = document.getElementById('intervention-options');
      const skipBtn = document.getElementById('intervention-skip');

      if (!prompt?.question) {
        resolve(null);
        return;
      }

      qEl.textContent = prompt.question;
      optsEl.innerHTML = '';
      (prompt.options || []).forEach((label, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-start';
        btn.style.margin = '6px 6px 0 0';
        btn.textContent = label;
        btn.onclick = () => {
          modal.hidden = true;
          modal.classList.remove('open');
          resolve({ choice: label, option_index: i });
        };
        optsEl.appendChild(btn);
      });

      skipBtn.onclick = () => {
        modal.hidden = true;
        modal.classList.remove('open');
        resolve(null);
      };

      modal.hidden = false;
      modal.classList.add('open');
    });
  }

  function appendYearCard(year, eraLine) {
    const card = document.createElement('article');
    card.className = 'live-year-card snes';
    card.innerHTML = `
      <h4>第 ${year.year} 年 · ${escapeHtml(year.title || '')}</h4>
      <p>${escapeHtml((year.event_summary || year.opening || '').slice(0, 120))}${(year.event_summary || year.opening || '').length > 120 ? '…' : ''}</p>
      ${eraLine ? `<p class="live-era">${escapeHtml(eraLine)}</p>` : ''}`;
    yearCardsEl.appendChild(card);
  }

  async function runDemoMockPipeline(intake) {
    const storyId = window.ShadowDemoMock?.resolveDemoStoryId();
    if (!storyId) return false;

    btnRun.disabled = true;
    btnRun.textContent = 'Demo Mock 播放中…';
    logEl.innerHTML = '';
    yearCardsEl.innerHTML = '';
    errEl.classList.add('intake-hidden');
    providerEl.textContent = '📦 Demo Mock · Golden 叙事 · 无 API';

    await window.ShadowDemoMock.simulateLivePipeline(storyId, {
      log,
      setProgress,
      setStage,
      markStageDone,
      appendYearCard,
      onDone(payload, href) {
        linkDemo.classList.remove('intake-hidden');
        linkDemo.href = href;
        btnRun.textContent = 'Mock 完成';
        log('final', '→ 进入 Demo 浏览（Golden 七年）');
      }
    }, {
      full_profile: intake.full_profile,
      persona: intake.persona,
      visual_character: intake.visual_character
    });
    return true;
  }

  async function runCustomSyntheticPipeline(intake) {
    if (!window.ShadowCustomStory?.build) {
      showError('自定义故事模块未加载。请刷新页面。');
      return false;
    }

    window.ShadowDemoMock?.markCustomIntake?.();
    btnRun.disabled = true;
    btnRun.textContent = '合成你的七年…';
    logEl.innerHTML = '';
    yearCardsEl.innerHTML = '';
    errEl.classList.add('intake-hidden');
    providerEl.textContent = '✍️ 自定义岔路口 · 规则合成七年 · 无需 API';

    setStage('persona');
    log('persona', `影 · ${intake.persona?.shadow_name || intake.persona_card?.name || '你'}`);
    markStageDone('persona');
    setProgress(10);

    let eraSnippets = {};
    try {
      const r = await fetch('demo-era-snippets.json');
      if (r.ok) eraSnippets = await r.json();
    } catch (_) { /* optional */ }

    setStage('beats');
    log('beats', '按你的岔路口与标签编排七年节奏…');
    markStageDone('beats');
    setProgress(18);

    const story = window.ShadowCustomStory.build({
      profile: intake.profile,
      persona: intake.persona,
      persona_card: intake.persona_card,
      full_profile: intake.full_profile,
      eraSnippets
    });

    setStage('year');
    for (let i = 0; i < story.years.length; i++) {
      const yr = story.years[i];
      const cal = (intake.profile.fork_year || 2019) + yr.year;
      const eraLine = eraSnippets[String(cal)]?.era_line || '';
      log('fate', eraLine.slice(0, 72) || `时代层 · ${cal}`);
      log('year', `✓ 第 ${yr.year} 年 · ${yr.title}`);
      appendYearCard(yr, eraLine);
      setProgress(18 + ((i + 1) / story.years.length) * 72);
      await new Promise((r) => setTimeout(r, 120));
    }

    setStage('final');
    log('final', story.final?.title || '七年收束');
    markStageDone('year', 'fate', 'final');
    setProgress(100);

    const payload = window.ShadowCustomStory.buildLivePayload(story, intake);
    sessionStorage.setItem(STORAGE_LIVE, JSON.stringify(payload));
    sessionStorage.setItem('shadow_live_session', JSON.stringify(payload));

    if (story.persona_card) {
      sessionStorage.setItem('shadow_persona_card', JSON.stringify(story.persona_card));
    }

    linkDemo.classList.remove('intake-hidden');
    linkDemo.href = 'demo.html?live=1&from=custom';
    btnRun.textContent = '生成完成';
    log('final', '→ 进入 Demo 浏览你的七年');

    if (params.get('goto') === 'demo' || params.get('autostart') === '1') {
      window.location.href = 'demo.html?live=1&from=custom';
    }
    return true;
  }

  async function runPipeline() {
    const intake = profileFromIntake();
    if (!intake?.profile?.choice || intake.profile.choice.length < 10) {
      showError('缺少 Intake 数据。请先在 intake.html 完成采集。');
      document.getElementById('live-intro').innerHTML =
        '未检测到岔路口。<a href="intake.html" style="color:var(--amber)">去采集 →</a>';
      return;
    }

    if (window.ShadowDemoMock?.shouldUseDemoMock()) {
      await runDemoMockPipeline(intake);
      return;
    }

    if (sessionStorage.getItem('shadow_custom_intake') === '1') {
      await runCustomSyntheticPipeline(intake);
      return;
    }

    btnRun.disabled = true;
    btnRun.textContent = '生成中…';
    logEl.innerHTML = '';
    yearCardsEl.innerHTML = '';
    errEl.classList.add('intake-hidden');
    setProgress(3);
    setStage('beats');

    let health;
    try {
      const hres = await fetch('/api/health');
      health = await hres.json();
    } catch {
      showError('Live API 不可用。请运行 npm run demo:local 并配置 STEPFUN_API_KEY 或 DASHSCOPE_API_KEY。');
      btnRun.disabled = false;
      btnRun.textContent = '重试';
      return;
    }

    if (!health.has_key) {
      log('persona', '未检测到 LLM Key · 改用自定义规则合成七年');
      await runCustomSyntheticPipeline(intake);
      return;
    }

    const providerLabel = {
      stepfun: '阶跃星辰',
      dashscope: '通义 DashScope',
      anthropic: 'Claude',
      openai: 'OpenAI'
    }[health.provider] || health.provider || 'LLM';
    providerEl.textContent = `${providerLabel} · ${health.model_override || '默认模型'}`;

    markStageDone('persona');
    log('persona', intake.persona_card
      ? `复用 Intake 人格 · ${intake.persona_card.name}`
      : `启动 session · ${intake.persona?.shadow_name || '影子'}`);
    setProgress(8);

    let session;
    try {
      const start = await post('/api/story/start', {
        profile: intake.profile,
        persona_card: intake.persona_card || null,
        full_profile: intake.full_profile || null
      });
      session = start.session;
      log('beats', `节奏就绪 · pivotal 年：${(session.pivotal_years || []).join(', ')}`);
      markStageDone('beats');
      setProgress(15);
      setStage('year');
    } catch (e) {
      showError(`启动失败：${e.message}`);
      btnRun.disabled = false;
      btnRun.textContent = '重试';
      return;
    }

    const totalYears = (session.beats || []).length || 7;
    let pendingIntervention = null;

    for (let i = 0; i < totalYears; i++) {
      const beat = session.beats[i];
      log('year', `生成第 ${beat?.year} 年 (${beat?.type})…`);
      setStage('fate');

      let result;
      try {
        result = await post('/api/story/year', {
          session,
          user_intervention: pendingIntervention
        });
      } catch (e) {
        showError(`第 ${beat?.year} 年生成失败：${e.message}`);
        btnRun.disabled = false;
        btnRun.textContent = '重试';
        return;
      }

      pendingIntervention = null;
      session = result.session;
      const eraLine = result.session?.last_fate_context?.era_line || '';
      markStageDone('fate');
      setStage('year');
      log('fate', eraLine.slice(0, 72) || '时代层已采样');
      log('year', `✓ ${result.year?.title || '第' + beat.year + '年'}`);
      appendYearCard(result.year, eraLine);

      setProgress(15 + ((i + 1) / totalYears) * 70);

      if (result.year?.is_pivotal && result.year?.intervention_prompt && i < totalYears - 1) {
        const choice = await openInterventionModal(result.year.intervention_prompt);
        if (choice) {
          pendingIntervention = {
            year: result.year.year,
            choice: choice.choice,
            option_index: choice.option_index
          };
          log('year', `介入：${choice.choice}`);
        }
      }
    }

    setStage('final');
    log('final', '收尾…');
    let fin;
    try {
      fin = await post('/api/story/final', { session });
    } catch (e) {
      showError(`Final 失败：${e.message}`);
      btnRun.disabled = false;
      btnRun.textContent = '重试';
      return;
    }

    session = fin.session;
    log('final', fin.final?.title || '七年收束');
    markStageDone('year', 'final');
    setProgress(100);

    sessionStorage.setItem(STORAGE_LIVE, JSON.stringify({
      session,
      final: fin.final,
      profile: intake.profile,
      full_profile: intake.full_profile,
      persona: intake.persona,
      visual_character: intake.visual_character,
      generated_at: new Date().toISOString()
    }));

    if (session.persona_card) {
      sessionStorage.setItem('shadow_persona', JSON.stringify({
        shadow_name: session.persona_card.name,
        ...session.persona_card
      }));
      sessionStorage.setItem('shadow_persona_card', JSON.stringify(session.persona_card));
    }

    linkDemo.classList.remove('intake-hidden');
    linkDemo.href = 'demo.html?live=1';
    btnRun.textContent = '生成完成';
    log('final', '→ 进入 Demo 浏览七年叙事');

    if (params.get('goto') === 'demo') {
      window.location.href = 'demo.html?live=1';
    }
  }

  async function ensureDemoBootstrap() {
    const urlStory = params.get('story');
    if (params.get('demo') !== '1' || !urlStory || !window.ShadowDemoMock?.isDemoStory(urlStory)) {
      return profileFromIntake();
    }
    window.ShadowDemoMock.markDemoMode(urlStory);
    const existing = sessionStorage.getItem('shadow_full_profile');
    if (existing && existing !== 'null') {
      try {
        const parsed = JSON.parse(existing);
        if (parsed?.raw?.choice_text) return profileFromIntake();
      } catch { /* rebuild */ }
    }
    sessionStorage.removeItem('shadow_full_profile');

    const preset = window.ShadowIntakePresets?.byId(urlStory);
    try {
      const mock = await window.ShadowDemoMock.completeIntakeMock(urlStory, {
        layerA: preset?.layerA,
        selectedTags: preset ? window.ShadowIntakePresets.resolveTags(preset, { tags: [] }) : [],
        scenario: preset ? window.ShadowIntakePresets.scenarioFromPreset(preset) : null
      });
      sessionStorage.setItem('shadow_full_profile', JSON.stringify(mock.full_profile));
      sessionStorage.setItem('shadow_persona', JSON.stringify(mock.persona));
      sessionStorage.setItem('shadow_persona_card', JSON.stringify(mock.persona_card));
      sessionStorage.setItem('shadow_persona_source', 'demo_mock');
      if (mock.visual_character) {
        sessionStorage.setItem('shadow_visual_character', JSON.stringify(mock.visual_character));
      }
    } catch (err) {
      console.error('[demo-live bootstrap]', err);
      showError('Demo Mock 加载失败：' + err.message);
    }
    return profileFromIntake();
  }

  document.getElementById('nav-back-live')?.addEventListener('click', () => {
    window.location.href = 'intake.html';
  });

  btnRun.addEventListener('click', runPipeline);

  (async function initLive() {
    const intake = await ensureDemoBootstrap() || profileFromIntake();
    if (intake?.profile?.choice) {
      const choice = intake.profile.choice;
      document.getElementById('live-intro').textContent =
        `岔路口：${choice.slice(0, 56)}${choice.length > 56 ? '…' : ''}`;
      renderPersonaMini(intake);
      renderCharacter(intake);
      if (window.ShadowDemoMock?.shouldUseDemoMock()) {
        providerEl.textContent = '📦 Demo Mock · Golden 叙事 · 无 API';
      }
    }

    if (autostart && intake?.profile?.choice) {
      btnRun.textContent = window.ShadowDemoMock?.shouldUseDemoMock()
        ? 'Demo Mock 启动中…'
        : 'Intake 已就绪，启动中…';
      setTimeout(runPipeline, 400);
    }
  })();
})();
