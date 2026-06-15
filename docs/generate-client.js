'use strict';

/**
 * Shadow Generate — Intake 全链 + API 七年生成
 * Intake（四层）→ Persona → start/stream → year×7/stream → final → demo.html?live=1
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const logEl = $('gen-log');
  const progressEl = $('gen-progress');
  const errEl = $('gen-error');
  const providerEl = $('gen-provider');
  const btnRun = $('btn-run');
  const isUnified = document.body.classList.contains('generate-unified');

  let lastExport = null;
  let intakeHandoff = null;
  const pendingLog = new Map();
  let waitTimer = null;

  function stopWaitTimer() {
    if (waitTimer) {
      clearInterval(waitTimer);
      waitTimer = null;
    }
  }

  function startWaitTimer(stage, baseMsg, onTick) {
    stopWaitTimer();
    const started = Date.now();
    waitTimer = setInterval(() => {
      const secs = Math.floor((Date.now() - started) / 1000);
      onTick(secs);
      logPending(stage, `${baseMsg} · 已等待 ${secs}s`);
    }, 1000);
  }

  function logPending(stage, msg) {
    let li = pendingLog.get(stage);
    if (!li) {
      li = document.createElement('li');
      li.className = 'gen-log-pending';
      logEl?.appendChild(li);
      pendingLog.set(stage, li);
    }
    li.textContent = `[${stage}] ${msg}`;
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }

  function clearPending(stage) {
    const li = pendingLog.get(stage);
    if (li) li.remove();
    pendingLog.delete(stage);
  }

  function show(el) {
    el?.classList.remove('gen-hidden');
  }

  function hide(el) {
    el?.classList.add('gen-hidden');
  }

  function setProgress(pct) {
    if (progressEl) progressEl.style.width = Math.min(100, pct) + '%';
  }

  function log(stage, msg) {
    const li = document.createElement('li');
    li.textContent = `[${stage}] ${msg}`;
    logEl?.appendChild(li);
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }

  function showError(msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    show(errEl);
  }

  function clearError() {
    hide(errEl);
    if (errEl) errEl.textContent = '';
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function openInterventionModal(prompt) {
    return new Promise((resolve) => {
      const modal = document.getElementById('intervention-modal');
      const qEl = document.getElementById('intervention-question');
      const optsEl = document.getElementById('intervention-options');
      const skipBtn = document.getElementById('intervention-skip');

      if (!prompt?.question || !modal) {
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

  async function post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText || `HTTP ${res.status}`);
    return data;
  }

  /** POST + SSE (fetch ReadableStream — implementing-realtime-sync pattern) */
  async function postSse(path, body, onEvent) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body)
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || res.statusText || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalPayload = null;
    let lastError = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIdx;
      while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        const event = (block.match(/^event: (.+)$/m) || [])[1];
        const dataMatch = block.match(/^data: (.+)$/ms);
        if (!event || !dataMatch) continue;
        let data;
        try {
          data = JSON.parse(dataMatch[1]);
        } catch {
          continue;
        }
        if (event === 'error') {
          lastError = new Error(data.message || '生成失败');
        } else if (event === 'start:done' || event === 'year:complete') {
          finalPayload = data;
        }
        if (typeof onEvent === 'function') onEvent(event, data);
      }
    }

    if (lastError) throw lastError;
    if (!finalPayload) throw new Error('SSE 流未返回结果');
    return finalPayload;
  }

  function handleStartStage(event, data) {
    switch (event) {
      case 'scenario:classified':
        setProgress(8);
        log('scenario', `${data.label || data.domain || '—'} · ${data.agent || '命运'}`);
        break;
      case 'persona:skipped':
        log('persona', `沿用 Intake · ${data.name || '影子'}`);
        setProgress(9);
        break;
      case 'persona:start':
        logPending('persona', 'Persona agent 写人格卡…');
        setProgress(9);
        break;
      case 'persona:done':
        clearPending('persona');
        log('persona', `${data.name || '影子'}`);
        setProgress(10);
        break;
      case 'beats:start':
        logPending('beats', 'Beats agent 编排七年节奏…');
        setProgress(11);
        startWaitTimer('beats', 'Beats agent 编排七年节奏…', (secs) => {
          setProgress(11 + Math.min(6, secs / 15));
        });
        break;
      case 'beats:done':
        stopWaitTimer();
        clearPending('beats');
        log('beats', `pivotal · ${(data.pivotal_years || []).join(', ')}`);
        setProgress(18);
        break;
      default:
        break;
    }
  }

  function handleYearStage(event, data, beat) {
    switch (event) {
      case 'year:start':
        logPending('year', `Year agent 生成中 (${beat?.type || data.type})…`);
        break;
      case 'fate:start':
        logPending('fate', `第 ${data.year ?? beat?.year} 年 · 命运 agent 采样…`);
        break;
      case 'fate:sampled':
        clearPending('fate');
        log('fate', (data.era_line || '时代层已注入').slice(0, 80));
        break;
      case 'year:generating':
        break;
      case 'year:done':
        stopWaitTimer();
        clearPending('year');
        log('year', `✓ ${data.title || '第' + (data.year ?? beat?.year) + '年'}`);
        break;
      default:
        break;
    }
  }

  function readHandoffFromSession() {
    try {
      const raw = sessionStorage.getItem('shadow_full_profile');
      if (!raw) return null;
      const full_profile = JSON.parse(raw);
      let persona = null;
      let persona_card = null;
      let intake_request = null;
      const personaRaw = sessionStorage.getItem('shadow_persona');
      const cardRaw = sessionStorage.getItem('shadow_persona_card');
      const reqRaw = sessionStorage.getItem('shadow_intake_request');
      if (personaRaw) persona = JSON.parse(personaRaw);
      if (cardRaw) persona_card = JSON.parse(cardRaw);
      if (reqRaw) intake_request = JSON.parse(reqRaw);
      return {
        full_profile,
        persona,
        persona_card,
        persona_source: sessionStorage.getItem('shadow_persona_source') || null,
        intake_request
      };
    } catch {
      return null;
    }
  }

  function layerAFromFull(full) {
    return {
      choice_text: full.raw?.choice_text || '',
      self_description: full.raw?.self_description || '',
      one_liner: full.raw?.one_liner || '',
      birth_year: full.temporal?.birth_year,
      fork_year: full.temporal?.fork_year,
      age_at_fork: full.temporal?.age_at_fork,
      gender: full.raw?.gender || full.temporal?.gender || 'female'
    };
  }

  function profileFromFull(full) {
    const layerA = layerAFromFull(full);
    const structuredTags = full.raw?.selected_tags || full.profile?.selected_tags || [];
    const keywords = full.profile?.keywords
      || structuredTags.map((t) => (typeof t === 'string' ? t : t.label)).slice(0, 5);
    return {
      choice: layerA.choice_text,
      description: layerA.self_description,
      quote: layerA.one_liner,
      birth_year: layerA.birth_year,
      fork_year: layerA.fork_year,
      age: layerA.age_at_fork,
      gender: layerA.gender,
      keywords,
      scenario_domain: full.profile?.scenario_domain || full.meta?.scenario_detected,
      scenario_label: full.profile?.scenario_label,
      selected_tags: structuredTags
    };
  }

  function intakeApiPayloadFromHandoff(handoff) {
    const full = handoff.full_profile;
    const req = handoff.intake_request || {};
    const layerA = req.layerA || layerAFromFull(full);
    const selectedTags = req.selectedTags
      || (full.raw?.selected_tags || []).map((label) => ({ label }));
    const questionAnswers = req.questionAnswers || full.micro_questions || [];
    const scenarioFromText = req.scenarioFromText
      || (full.meta?.scenario_detected
        ? { top: full.meta.scenario_detected, conf: full.meta.scenario_confidence }
        : null);
    return {
      layerA,
      selectedTags,
      questionAnswers,
      scenarioFromText,
      meta: req.meta || full.meta || {},
      analyze: true,
      fallback: true
    };
  }

  function renderIntakeSummary(handoff) {
    const root = $('gen-intake-summary');
    if (!root || !handoff?.full_profile) return;
    const full = handoff.full_profile;
    const tags = (full.raw?.selected_tags || [])
      .map((t) => (typeof t === 'string' ? t : t.label))
      .join(' · ') || '—';
    const answered = full.meta?.answered ?? full.micro_questions?.length ?? 0;
    const personaName = handoff.persona_card?.name
      || handoff.persona?.shadow_name
      || '—';
    const sourceLabel = {
      llm: 'LLM',
      rule_fallback: '规则兜底',
      rule_local: '离线规则',
      error: '异常'
    }[handoff.persona_source] || handoff.persona_source || '—';

    root.innerHTML = `
      <div class="gen-card">
        <p class="gen-era">岔路口 · ${escapeHtml(full.raw?.choice_text || '—')}</p>
        ${full.raw?.self_description ? `<p class="gen-era">自述 · ${escapeHtml(full.raw.self_description)}</p>` : ''}
        <p class="gen-era">标签 · ${escapeHtml(tags)}</p>
        <p class="gen-era">行为题 · ${answered} 题 · Persona · 影 · ${escapeHtml(personaName)}（${escapeHtml(sourceLabel)}）</p>
        ${full.tension_flags?.length
    ? `<p class="gen-era">张力 · ${escapeHtml(full.tension_flags[0].detail)}</p>`
    : ''}
      </div>`;
  }

  function showPipelineSection() {
    hide($('gen-intake-section'));
    show($('gen-pipeline-section'));
    show($('gen-intake-summary-panel'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showIntakeSection() {
    show($('gen-intake-section'));
    hide($('gen-pipeline-section'));
    resetResults();
    hide($('gen-run-panel'));
    if (btnRun) {
      btnRun.disabled = false;
      btnRun.textContent = '开始 API 生成';
    }
  }

  function renderPersona(persona, card) {
    const root = $('gen-persona');
    if (!root) return;
    const name = card?.name || persona?.shadow_name || '影子';
    root.innerHTML = `
      <div class="gen-card">
        <h4>影 · ${escapeHtml(name)}</h4>
        <dl>
          <dt>core_tension</dt><dd>${escapeHtml(persona?.core_tension || card?.core_tension || '—')}</dd>
          <dt>core_traits</dt><dd>${escapeHtml((persona?.core_traits || card?.core_traits || []).join(' · '))}</dd>
          <dt>soft_spots</dt><dd>${escapeHtml((persona?.soft_spots || card?.soft_spots || []).join(' · '))}</dd>
          <dt>decision_tendency</dt><dd>${escapeHtml(persona?.decision_tendency || card?.decision_tendency || '—')}</dd>
          <dt>growth_seed</dt><dd>${escapeHtml(persona?.growth_seed || card?.growth_seed || '—')}</dd>
        </dl>
      </div>`;
    show($('gen-persona-panel'));
  }

  function renderBeats(session) {
    const root = $('gen-beats');
    if (!root) return;
    const items = (session.beats || [])
      .map((b) => `<li>第 ${b.year} 年 · <strong>${b.type}</strong> · ${escapeHtml(b.seed || '')}</li>`)
      .join('');
    root.innerHTML = `
      <p class="gen-era">pivotal 年：${(session.pivotal_years || []).join('、') || '—'}</p>
      <ul class="gen-beats-list">${items}</ul>
      <p class="gen-era">scenario · ${escapeHtml(session.scenario?.label || session.scenario?.domain || '—')}</p>`;
    show($('gen-beats-panel'));
  }

  function appendYear(year, eraLine, beatType) {
    const root = $('gen-years');
    if (!root) return;
    const block = document.createElement('article');
    block.className = 'gen-year-block' + (year.is_pivotal ? ' pivotal' : '');
    block.innerHTML = `
      <h4>第 ${year.year} 年 · ${escapeHtml(year.title || '')}${year.is_pivotal ? ' · PIVOTAL' : ''}</h4>
      <p class="gen-era">${escapeHtml(eraLine || '命运层 · 时代背景')}</p>
      <p class="gen-era">beat · ${escapeHtml(beatType || '')} · mood ${year.new_mood ?? '—'} · esteem ${year.new_esteem ?? '—'}</p>
      <div class="gen-event">${escapeHtml(year.event || year.opening || year.event_summary || '')}</div>
      ${year.reflection ? `<p class="gen-era" style="margin-top:10px">reflection · ${escapeHtml(year.reflection)}</p>` : ''}
      ${year.decision_made ? `<p class="gen-era">decision · ${escapeHtml(year.decision_made)}</p>` : ''}`;
    root.appendChild(block);
    show($('gen-years-panel'));
  }

  function renderFinal(final) {
    const root = $('gen-final');
    if (!root || !final) return;
    root.innerHTML = `
      <p class="gen-era">${escapeHtml(final.title || '七年后的回信')}</p>
      <div class="gen-final">${escapeHtml(final.message || final.body || JSON.stringify(final, null, 2))}</div>
      ${final.quote ? `<p class="gen-era" style="margin-top:12px">「${escapeHtml(final.quote)}」</p>` : ''}
      ${final.sign_off ? `<p class="gen-era">${escapeHtml(final.sign_off)}</p>` : ''}`;
    show($('gen-final-panel'));
  }

  function buildApiLivePayload(session, fin, intakeResult, profile) {
    const extras = {
      final: fin.final,
      profile,
      full_profile: intakeResult.full_profile || null,
      persona: intakeResult.persona || null,
      visual_character: intakeResult.full_profile?.visual_character || null
    };
    if (window.ShadowCustomStory?.buildLivePayloadFromApiSession) {
      return window.ShadowCustomStory.buildLivePayloadFromApiSession(session, extras);
    }
    return {
      session: {
        ...session,
        persona_card: session.persona_card || intakeResult.persona_card,
        _demo_mock: false
      },
      ...extras,
      generated_at: new Date().toISOString(),
      _from_generate: true
    };
  }

  function compactLivePayload(payload) {
    const s = payload.session || {};
    return {
      session: {
        run_id: s.run_id,
        years: s.years || [],
        beats: s.beats,
        pivotal_years: s.pivotal_years,
        memory_stream: s.memory_stream || [],
        persona_card: s.persona_card,
        shadow: s.shadow,
        profile: s.profile,
        mood: s.mood,
        esteem: s.esteem,
        scenario: s.scenario,
        visual_character: s.visual_character || payload.visual_character || null,
        replan_log: s.replan_log,
        _demo_mock: false
      },
      final: payload.final,
      profile: payload.profile,
      persona: payload.persona,
      visual_character: payload.visual_character || s.visual_character || null,
      generated_at: payload.generated_at,
      _from_generate: true
    };
  }

  function persistLiveSession(payload) {
    const attempts = [
      () => payload,
      () => compactLivePayload(payload)
    ];
    for (const build of attempts) {
      try {
        const slim = build();
        sessionStorage.setItem('shadow_live_session', JSON.stringify(slim));
        return true;
      } catch (err) {
        console.warn('[generate] sessionStorage persist failed', err);
      }
    }
    return false;
  }

  function showCompleteOverlay(message, seconds) {
    let overlay = document.getElementById('gen-complete-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'gen-complete-overlay';
      overlay.className = 'gen-complete-overlay';
      overlay.innerHTML = '<p class="gen-complete-title"></p><p class="gen-complete-sub"></p>';
      document.body.appendChild(overlay);
    }
    const title = overlay.querySelector('.gen-complete-title');
    const sub = overlay.querySelector('.gen-complete-sub');
    if (title) title.textContent = '七年已生成';
    if (sub) sub.textContent = message;
    overlay.hidden = false;
    overlay.classList.add('is-visible');
    if (seconds > 0 && sub) {
      let left = seconds;
      const tick = () => {
        sub.textContent = `${message}（${left}s）`;
        left -= 1;
        if (left >= 0) setTimeout(tick, 1000);
      };
      tick();
    }
  }

  function enterDemoLive({ storedOk }) {
    const demoUrl = 'demo.html?live=1&from=generate';
    showCompleteOverlay(
      storedOk ? '正在进入七年浏览…' : '缓存失败，请点击下方按钮进入',
      storedOk ? 2 : 0
    );
    $('gen-final-panel')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    if (btnRun) {
      btnRun.textContent = storedOk ? '完成，正在进入七年…' : '完成 — 请点击下方进入七年';
      btnRun.disabled = true;
    }
    const finalPanel = $('gen-final-panel');
    if (finalPanel && !finalPanel.querySelector('.gen-demo-link')) {
      const linkWrap = document.createElement('div');
      linkWrap.className = 'gen-actions gen-demo-link';
      linkWrap.style.marginTop = '20px';
      linkWrap.innerHTML =
        '<a href="demo.html?live=1&from=generate" class="btn-start" style="display:inline-block;text-decoration:none">进入七年浏览 →</a>';
      finalPanel.appendChild(linkWrap);
    }
    if (storedOk) {
      setTimeout(() => {
        window.location.replace(demoUrl);
      }, 1200);
    } else {
      showError('七年数据过大未能自动缓存，请点击「进入七年浏览」手动打开。');
    }
  }

  function finishAndEnterDemo(activeSession, fin, intakeResult, profile, health) {
    const mergedSession = {
      ...(fin.session || activeSession),
      years: (fin.session?.years?.length ? fin.session.years : activeSession?.years) || [],
      final: fin.final
    };
    lastExport = {
      profile,
      full_profile: intakeResult.full_profile,
      persona: intakeResult.persona,
      persona_card: mergedSession.persona_card || intakeResult.persona_card,
      session: mergedSession,
      final: fin.final,
      generated_at: new Date().toISOString(),
      provider: health?.provider
    };
    const livePayload = buildApiLivePayload(mergedSession, fin, intakeResult, profile);
    if (!livePayload.session?.years?.length) {
      showError('生成完成但缺少年份数据，无法进入 Demo。');
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '重试';
      }
      return;
    }
    try {
      const storedOk = persistLiveSession(livePayload);
      enterDemoLive({ storedOk });
    } catch (err) {
      console.error('[generate] finishAndEnterDemo', err);
      showError('进入 Demo 失败：' + (err.message || '未知错误'));
      enterDemoLive({ storedOk: false });
    }
  }

  function resetResults() {
    lastExport = null;
    stopWaitTimer();
    pendingLog.clear();
    ['gen-persona', 'gen-beats', 'gen-years', 'gen-final'].forEach((id) => {
      const el = $(id);
      if (el) el.innerHTML = '';
    });
    hide($('gen-persona-panel'));
    hide($('gen-beats-panel'));
    hide($('gen-years-panel'));
    hide($('gen-final-panel'));
    if (logEl) logEl.innerHTML = '';
    setProgress(0);
    clearError();
  }

  // API 不可用 / 无 Key 时的兜底：本地规则合成七年 → demo.html 分层 UI（与离线 intake 一致）
  async function synthLocalAndGoDemo(handoff) {
    if (!window.ShadowCustomStory?.build) {
      showError('本地合成模块未加载，请刷新后重试。');
      return false;
    }
    const full = handoff.full_profile || {};
    const raw = full.raw || {};
    const temporal = full.temporal || {};
    const profile = {
      choice: raw.choice_text || '',
      description: raw.self_description || '',
      quote: raw.one_liner || '',
      fork_year: temporal.fork_year || raw.fork_year || 2019,
      birth_year: temporal.birth_year || raw.birth_year,
      age: temporal.age_at_fork || raw.age || 18,
      gender: raw.gender || temporal.gender,
      keywords: (raw.selected_tags || []).slice(0, 6)
    };
    let eraSnippets = window.__shadowEraSnippets;
    if (!eraSnippets) {
      try { eraSnippets = await (await fetch('demo-era-snippets.json')).json(); }
      catch { eraSnippets = {}; }
    }
    try {
      const story = window.ShadowCustomStory.build({
        profile,
        persona: handoff.persona,
        persona_card: handoff.persona_card,
        full_profile: full,
        eraSnippets
      });
      const payload = window.ShadowCustomStory.buildLivePayload(story, handoff);
      sessionStorage.setItem('shadow_live_session', JSON.stringify(payload));
      window.location.href = 'demo.html?live=1';
      return true;
    } catch (err) {
      showError('本地合成失败：' + err.message);
      return false;
    }
  }

  async function runPipeline() {
    let handoff = intakeHandoff || readHandoffFromSession();
    if (!handoff?.full_profile) {
      alert('请先完成 Intake 采集（岔路口 → 标签 → 行为题 → 确认）。');
      if (isUnified) showIntakeSection();
      return;
    }

    const full = handoff.full_profile;
    if ((full.raw?.choice_text || '').length < 10) {
      alert('岔路口至少 10 字。');
      if (isUnified) showIntakeSection();
      return;
    }

    resetResults();
    show($('gen-run-panel'));
    if (btnRun) {
      btnRun.disabled = true;
      btnRun.textContent = '生成中…';
    }
    clearError();

    let health;
    try {
      health = await (await fetch('/api/health')).json();
    } catch {
      log('intake', 'API 不可用 — 用本地规则即时合成七年，进入分层浏览');
      await synthLocalAndGoDemo(handoff);
      return;
    }

    if (!health.has_key) {
      log('intake', '未检测到 LLM Key — 用本地规则即时合成七年，进入分层浏览');
      await synthLocalAndGoDemo(handoff);
      return;
    }

    const providerLabel = {
      deepseek: 'DeepSeek',
      stepfun: '阶跃星辰',
      dashscope: '通义 DashScope',
      anthropic: 'Claude',
      openai: 'OpenAI'
    }[health.provider] || health.provider;
    if (providerEl) {
      providerEl.textContent = `${providerLabel} · ${health.model_override || '默认模型'} · 命运 agent + RAG`;
    }

    setProgress(2);

    let intakeResult = handoff;
    if (intakeResult.persona || intakeResult.persona_card) {
      log('intake', `沿用 Intake Persona（${intakeResult.persona_source || 'cached'}）· 含标签与行为题`);
      renderPersona(intakeResult.persona, intakeResult.persona_card);
    } else {
      log('intake', '构建 profile + Persona agent（含标签与行为题）…');
      try {
        intakeResult = await post('/api/intake/complete', intakeApiPayloadFromHandoff(handoff));
        renderPersona(intakeResult.persona, intakeResult.persona_card);
        log('persona', `${intakeResult.persona_source || 'ok'} · ${intakeResult.persona_card?.name || intakeResult.persona?.shadow_name || '影子'}`);
      } catch (e) {
        showError('Intake/Persona 失败：' + e.message);
        if (btnRun) {
          btnRun.disabled = false;
          btnRun.textContent = '重试';
        }
        return;
      }
    }

    const profile = profileFromFull(intakeResult.full_profile || full);
    if (intakeResult.persona || intakeResult.persona_card) {
      log('persona', `${intakeResult.persona_source || 'ok'} · ${intakeResult.persona_card?.name || intakeResult.persona?.shadow_name || '影子'}`);
    }
    setProgress(10);

    let session;
    try {
      const startPayload = {
        profile,
        persona_card: intakeResult.persona_card || null,
        full_profile: intakeResult.full_profile || null
      };
      const start = await postSse('/api/story/start/stream', startPayload, handleStartStage);
      session = start.session;
      renderBeats(session);
    } catch (e) {
      stopWaitTimer();
      showError('Story 启动失败：' + e.message);
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '重试';
      }
      return;
    }

    const totalYears = (session.beats || []).length || 7;
    let pendingIntervention = null;

    for (let i = 0; i < totalYears; i++) {
      const beat = session.beats[i];
      startWaitTimer('year', `Year agent 生成中 (${beat.type})…`, (secs) => {
        setProgress(18 + ((i + secs / 90) / totalYears) * 68);
      });

      let result;
      let yearErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await postSse(
            '/api/story/year/stream',
            { session, user_intervention: pendingIntervention },
            (event, data) => handleYearStage(event, data, beat)
          );
          yearErr = null;
          break;
        } catch (e) {
          yearErr = e;
          stopWaitTimer();
          clearPending('year');
          clearPending('fate');
          if (attempt < 2) {
            log('year', `第 ${beat.year} 年 schema 未通过，重试 ${attempt + 2}/3…`);
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      }
      stopWaitTimer();
      if (yearErr) {
        showError(`第 ${beat.year} 年失败：${yearErr.message}`);
        if (btnRun) {
          btnRun.disabled = false;
          btnRun.textContent = '重试';
        }
        return;
      }

      pendingIntervention = null;
      session = result.session;
      const eraLine = session.last_fate_context?.era_line || '';
      appendYear(result.year, eraLine, beat.type);
      setProgress(18 + ((i + 1) / totalYears) * 68);

      if (result.year?.is_pivotal && result.year?.intervention_prompt && i < totalYears - 1) {
        const choice = await openInterventionModal(result.year.intervention_prompt);
        if (choice) {
          pendingIntervention = {
            from_year: result.year.year,
            question: result.year.intervention_prompt?.question,
            choice: choice.choice,
            option_index: choice.option_index
          };
          log('year', `介入：${choice.choice}`);
        }
      }
    }

    log('final', 'Final agent 收束…');
    let fin;
    try {
      fin = await post('/api/story/final', { session });
    } catch (e) {
      showError('Final 失败：' + e.message);
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '重试';
      }
      return;
    }

    session = fin.session;
    renderFinal(fin.final);
    setProgress(100);
    log('final', '完成 — 即将进入 Demo 七年浏览');
    finishAndEnterDemo(session, fin, intakeResult, profile, health);
  }

  function onIntakeComplete(result) {
    intakeHandoff = {
      ...result,
      intake_request: result.intake_request || null
    };
    try {
      if (result.intake_request) {
        sessionStorage.setItem('shadow_intake_request', JSON.stringify(result.intake_request));
      }
    } catch (_) { /* quota */ }
    renderIntakeSummary(intakeHandoff);
    showPipelineSection();
    const tag = document.getElementById('source-tag');
    if (tag) tag.textContent = '⚡ Generate · API';
    setTimeout(runPipeline, 350);
  }

  function exportJson() {
    if (!lastExport) return;
    const blob = new Blob([JSON.stringify(lastExport, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shadow-generate-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  window.ShadowGenerateBridge = { onIntakeComplete };

  $('nav-back')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  $('btn-edit-intake')?.addEventListener('click', showIntakeSection);
  btnRun?.addEventListener('click', runPipeline);
  $('btn-export')?.addEventListener('click', exportJson);
  $('btn-reset')?.addEventListener('click', () => {
    resetResults();
    hide($('gen-run-panel'));
    if (btnRun) {
      btnRun.disabled = false;
      btnRun.textContent = '开始 API 生成';
    }
  });

  const params = new URLSearchParams(location.search);
  if (params.get('from') === 'intake' || params.get('autostart') === '1') {
    const handoff = readHandoffFromSession();
    if (handoff?.full_profile) {
      intakeHandoff = handoff;
      renderIntakeSummary(handoff);
      showPipelineSection();
      if (params.get('autostart') === '1') {
        setTimeout(runPipeline, 400);
      }
    }
  }

  fetch('/api/health')
    .then((r) => r.json())
    .then((h) => {
      if (!providerEl) return;
      if (h.has_key) {
        providerEl.textContent = isUnified
          ? `就绪 · ${h.provider || 'LLM'} · 先完成 Intake，确认后自动生成本页七年`
          : `就绪 · ${h.provider || 'LLM'} · 点「开始 API 生成」`;
      } else {
        providerEl.textContent = '未检测到 API Key — 请配置 .env 后重启 demo:local';
      }
    })
    .catch(() => {
      if (providerEl) providerEl.textContent = '本地服务未连接 — npm run demo:local';
    });
})();
