'use strict';

/**
 * Shadow Generate — Intake + Job 管线（主路径）
 * Intake → POST /api/story/jobs → SSE → intervention → demo.html?live=1
 * @deprecated 浏览器直连 SSE 逐年路径保留兼容，新功能请走 Job 管线。
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
  let pipelineStartedAt = 0;
  let yearTimings = [];
  const JOB_KEY = 'shadow_gen_job';
  const JOB_ID_KEY = 'shadow_gen_job_id';
  const TIMING_KEY = 'shadow_gen_timings';
  let activeEventSource = null;
  let pendingPollTimer = null;
  let runningPollTimer = null;
  let currentJobId = null;
  let interventionInFlight = false;
  let interventionForYear = null;
  let progressScreenMode = false;

  function setProgressScreen(on) {
    progressScreenMode = !!on;
    document.body.classList.toggle('gen-progress-screen', progressScreenMode);
  }

  const DEFAULT_ETA_MS = {
    fast: { start: 22000, year: 28000, final: 18000 },
    full: { start: 32000, year: 72000, final: 24000 }
  };

  function getGenerationMode() {
    const el = $('gen-fast-mode');
    return el && !el.checked ? 'full' : 'fast';
  }

  function loadTimings() {
    try {
      const raw = localStorage.getItem(TIMING_KEY);
      return raw ? JSON.parse(raw) : { fast: null, full: null };
    } catch {
      return { fast: null, full: null };
    }
  }

  function recordTiming(mode, phase, ms) {
    const store = loadTimings();
    const bucket = store[mode] || { start: [], year: [], final: [] };
    if (!bucket[phase]) bucket[phase] = [];
    bucket[phase].push(ms);
    if (bucket[phase].length > 8) bucket[phase].shift();
    store[mode] = bucket;
    try {
      localStorage.setItem(TIMING_KEY, JSON.stringify(store));
    } catch (_) { /* quota */ }
  }

  function avgMs(list, fallback) {
    if (!list?.length) return fallback;
    return Math.round(list.reduce((a, b) => a + b, 0) / list.length);
  }

  function estimateTotalMs(mode, yearsDone, totalYears) {
    const store = loadTimings();
    const bucket = store[mode] || {};
    const base = DEFAULT_ETA_MS[mode] || DEFAULT_ETA_MS.fast;
    const startMs = avgMs(bucket.start, base.start);
    const yearMs = avgMs(bucket.year, base.year);
    const finalMs = avgMs(bucket.final, base.final);
    const yearsLeft = Math.max(0, totalYears - yearsDone);
    const includeStart = yearsDone === 0;
    return (includeStart ? startMs : 0) + yearsLeft * yearMs + (yearsDone >= totalYears ? 0 : finalMs);
  }

  function formatEta(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    if (sec < 60) return `约 ${sec} 秒`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `约 ${m} 分 ${s} 秒` : `约 ${m} 分钟`;
  }

  function updateEtaLabel(yearsDone, totalYears, mode) {
    const label = $('gen-eta-label');
    const rem = $('gen-eta-remaining');
    if (!label || !rem) return;
    const elapsed = pipelineStartedAt ? Date.now() - pipelineStartedAt : 0;
    const total = estimateTotalMs(mode, yearsDone, totalYears);
    const left = Math.max(0, total - elapsed);
    label.textContent = mode === 'fast'
      ? `快速模式 · 已完成 ${yearsDone}/${totalYears} 年`
      : `完整模式 · 已完成 ${yearsDone}/${totalYears} 年`;
    rem.textContent = left > 0 ? `剩余 ${formatEta(left)}` : '即将完成…';
  }

  function showStreamYear(yearN, text) {
    const wrap = $('gen-year-stream');
    const nEl = $('gen-stream-year-n');
    const tEl = $('gen-stream-text');
    if (!wrap || !tEl) return;
    if (nEl) nEl.textContent = String(yearN ?? '—');
    tEl.textContent = text || '';
    show(wrap);
  }

  function hideStreamYear() {
    hide($('gen-year-stream'));
    const tEl = $('gen-stream-text');
    if (tEl) tEl.textContent = '';
  }

  function openYearDialogue(year, session, profile) {
    if (!window.ShadowGenerateDialogue?.openForYear) return;
    window.ShadowGenerateDialogue.openForYear(year, {
      persona_card: session.persona_card,
      memory_stream: session.memory_stream || [],
      years: session.years || [],
      profile
    });
  }

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

  const STAGE_ORDER = ['persona', 'beats', 'year_1', 'year_2', 'year_3', 'year_4', 'year_5', 'year_6', 'year_7', 'final'];

  function updateStageTimeline(job) {
    const root = $('gen-stage-timeline');
    if (!root) return;
    const done = new Set(job?.completed_stages || []);
    const yearsDone = job?.session?.years?.length || 0;
    for (let i = 1; i <= yearsDone; i++) done.add(`year_${i}`);
    if (job?.session?.beats?.length) done.add('beats');
    if (job?.session?.persona_card) done.add('persona');
    if (jobFinalPayload(job)) done.add('final');

    let active = job?.stage?.stage || null;
    if (job?.status === 'awaiting_intervention') {
      const fy = job.stage?.intervention_from_year || job.stage?.year_index;
      if (fy) active = `year_${fy}`;
    } else if (job?.status === 'running' && job.partial?.current_year_index) {
      active = `year_${job.partial.current_year_index}`;
    } else if (job?.status === 'running' && yearsDone < 7) {
      active = `year_${yearsDone + 1}`;
    } else if (job?.status === 'done') {
      active = 'final';
    }

    root.querySelectorAll('li[data-stage]').forEach((li) => {
      const id = li.getAttribute('data-stage');
      li.classList.remove('is-done', 'is-active', 'is-pivotal');
      if (done.has(id)) li.classList.add('is-done');
      if (id === active) li.classList.add('is-active');
      if (job?.status === 'awaiting_intervention' && id === active) li.classList.add('is-pivotal');
    });
  }

  function showTimingHint(stage, ms) {
    const el = $('gen-timing-hint');
    if (!el || !stage || !ms) return;
    el.textContent = `${stage} · ${ms}ms`;
    show(el);
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

  function jobFinalPayload(job) {
    return job?.result?.final || job?.session?.final || null;
  }

  function jobReadyForDemo(job) {
    const years = job?.session?.years || [];
    const total = job?.session?.beats?.length || 7;
    return Boolean(job?.session && years.length >= total && jobFinalPayload(job));
  }

  async function submitJobIntervention(jobId, data) {
    const body = {
      from_year: data.from_year,
      question: data.prompt?.question || data.question || null,
      choice: data.choice?.choice ?? null,
      option_index: data.choice?.option_index ?? null,
      skipped: !data.choice
    };
    return post(apiUrl(`/api/story/jobs/${encodeURIComponent(jobId)}/intervention`), body);
  }

  async function promptInterventionIfNeeded(job) {
    if (job.status !== 'awaiting_intervention' || interventionInFlight) return;
    const fromYear = job.stage?.intervention_from_year || job.stage?.year_index;
    if (interventionForYear === fromYear) return;

    const prompt = job.stage?.prompt
      || (job.session?.years || []).find((y) => y.year === fromYear)?.intervention_prompt;
    if (!prompt?.question) return;

    interventionInFlight = true;
    interventionForYear = fromYear;
    log('intervention', `第 ${fromYear} 年 pivotal · 请选择介入`);
    const loadingEl = $('intervention-loading');
    try {
      const choice = await openInterventionModal(prompt);
      if (loadingEl) show(loadingEl);
      await submitJobIntervention(job.job_id, { from_year: fromYear, prompt, choice });
      log('intervention', choice ? `已选：${choice.choice}` : '已跳过介入');
      attachJobStream(job.job_id, true);
      scheduleJobPoll(job.job_id);
      try {
        onJobSnapshot(await fetchJob(job.job_id));
      } catch (_) { /* stream/poll will catch up */ }
    } catch (e) {
      showError('提交介入失败：' + e.message);
    } finally {
      if (loadingEl) hide(loadingEl);
      interventionInFlight = false;
    }
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

      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKey);
        modal.hidden = true;
        modal.classList.remove('open');
        resolve(value);
      };

      qEl.textContent = prompt.question;
      optsEl.innerHTML = '';
      const options = prompt.options || [];
      options.forEach((label, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = `<span class="opt-key">${i + 1}</span>${escapeHtml(label)}`;
        btn.onclick = () => finish({ choice: label, option_index: i });
        optsEl.appendChild(btn);
      });

      skipBtn.onclick = () => finish(null);

      const onKey = (ev) => {
        if (ev.key >= '1' && ev.key <= '3') {
          const idx = Number(ev.key) - 1;
          if (options[idx]) finish({ choice: options[idx], option_index: idx });
        }
        if (ev.key === 'Escape') finish(null);
      };
      document.addEventListener('keydown', onKey);

      modal.hidden = false;
      modal.classList.add('open');
      const first = optsEl.querySelector('button');
      if (first) first.focus();
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
        showStreamYear(data.year ?? beat?.year, '');
        break;
      case 'year:partial':
        showStreamYear(data.year ?? beat?.year, data.event || data.title || '');
        break;
      case 'year:done':
        stopWaitTimer();
        clearPending('year');
        hideStreamYear();
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
      analyze: handoff.persona || handoff.persona_card ? false : true,
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
    if (progressScreenMode) return;
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
    if (progressScreenMode) return;
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
    if (progressScreenMode) return;
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
    if (progressScreenMode) return;
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
      _from_generate: true,
      generated_job_id: payload.generated_job_id || null
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

  function enterDemoLive({ storedOk, jobId }) {
    const q = new URLSearchParams({ live: '1', from: 'generate' });
    if (jobId) q.set('job_id', jobId);
    const demoUrl = `demo.html?${q.toString()}`;
    showCompleteOverlay(
      storedOk ? '七年已写好，正在进入阅读器…' : '缓存失败，仍将从服务端加载七年…',
      storedOk ? 2 : 1
    );
    if (btnRun) {
      btnRun.textContent = '完成，正在进入七年…';
      btnRun.disabled = true;
    }
    setProgressScreen(false);
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1200;
    setTimeout(() => {
      window.location.replace(demoUrl);
    }, delay);
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
    livePayload.generated_job_id = currentJobId || loadJobId() || null;
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
      clearJobId();
      disconnectJobStream();
      enterDemoLive({ storedOk, jobId: currentJobId || loadJobId() });
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

  function saveJobId(jobId) {
    try {
      localStorage.setItem(JOB_ID_KEY, jobId);
    } catch (_) { /* quota */ }
  }

  function loadJobId() {
    try {
      return localStorage.getItem(JOB_ID_KEY) || null;
    } catch {
      return null;
    }
  }

  function clearJobId() {
    try {
      localStorage.removeItem(JOB_ID_KEY);
      localStorage.removeItem(JOB_KEY);
    } catch (_) { /* ignore */ }
    hide($('gen-resume-panel'));
  }

  function clearJobPollers() {
    if (pendingPollTimer) {
      clearInterval(pendingPollTimer);
      pendingPollTimer = null;
    }
    if (runningPollTimer) {
      clearInterval(runningPollTimer);
      runningPollTimer = null;
    }
  }

  function scheduleJobPoll(jobId) {
    if (runningPollTimer) return;
    runningPollTimer = setInterval(async () => {
      try {
        const fresh = await fetchJob(jobId);
        onJobSnapshot(fresh);
        if (fresh.status === 'done' || fresh.status === 'failed' || fresh.status === 'awaiting_intervention') {
          clearInterval(runningPollTimer);
          runningPollTimer = null;
        }
      } catch (e) {
        console.warn('[generate] running poll', e);
      }
    }, 2000);
  }

  function disconnectJobStream() {
    if (activeEventSource) {
      activeEventSource.close();
      activeEventSource = null;
    }
    clearJobPollers();
  }

  function apiUrl(path) {
    const prefix = window.SHADOW_BASE_PREFIX || '';
    if (typeof path === 'string' && path.startsWith('/api/')) {
      return prefix + path;
    }
    return path;
  }

  async function fetchJob(jobId) {
    const res = await fetch(apiUrl(`/api/story/jobs/${encodeURIComponent(jobId)}`));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function renderJobStatusBanner(job) {
    const pending = $('gen-pending-panel');
    const failed = $('gen-failed-panel');
    hide(pending);
    hide(failed);

    if (job.status === 'pending') {
      if ($('gen-pending-text')) {
        $('gen-pending-text').textContent = '排队中 — 前面还有任务在生成，本页会自动更新。';
      }
      show(pending);
      return;
    }
    if (job.status === 'failed') {
      const yr = job.stage?.year_index || job.completed_stages?.filter((s) => s.startsWith('year_')).length || 0;
      if ($('gen-failed-text')) {
        $('gen-failed-text').textContent = `生成中断在第 ${yr || '?'} 年附近${job.error ? '：' + job.error : ''}`;
      }
      show(failed);
    }
  }

  function hydrateJobUi(job) {
    const session = job.session;
    if (!session?.beats) return;
    if (!progressScreenMode) {
      renderBeats(session);
    }
    const root = $('gen-years');
    if (root && !progressScreenMode) root.innerHTML = '';
    if (!progressScreenMode) {
      (session.years || []).forEach((y, idx) => {
        const beat = session.beats?.[idx];
        appendYear(y, session.last_fate_context?.era_line || '', beat?.type);
      });
      if (job.result?.final) renderFinal(job.result.final);
    }
    const done = session.years?.length || 0;
    const total = session.beats?.length || 7;
    const pct = job.status === 'done' ? 100 : Math.round(18 + (done / total) * 68);
    setProgress(pct);
    updateEtaLabel(done, total, job.generation_mode || 'fast');
    updateStageTimeline(job);
    if (job.partial?.current_year_text && job.status === 'running') {
      showStreamYear(job.partial.current_year_index || done + 1, job.partial.current_year_text);
    }
  }

  function renderRunningProgress(job) {
    const session = job.session || {};
    const done = session.years?.length || 0;
    const total = job.stage?.total_years || session.beats?.length || 7;
    const label = $('gen-eta-label');
    if (label) {
      const cur = job.status === 'running' && job.partial?.current_year_index > done
        ? job.partial.current_year_index
        : Math.min(done + 1, total);
      label.textContent = `${job.generation_mode === 'fast' ? '快速' : '完整'}模式 · 正在书写第 ${cur} 年 / 共 ${total} 年`;
    }
    setProgress(job.status === 'done' ? 100 : Math.round(18 + (done / total) * 68));
    updateEtaLabel(done, total, job.generation_mode || 'fast');
    updateStageTimeline(job);
    renderJobStatusBanner(job);
  }

  function onJobSnapshot(job) {
    currentJobId = job.job_id;
    saveJobId(job.job_id);
    const runningLike = job.status === 'running' || job.status === 'pending'
      || job.status === 'awaiting_intervention' || job.status === 'orphaned';
    setProgressScreen(runningLike && job.status !== 'done');
    show($('gen-run-panel'));
    if (!progressScreenMode) {
      show($('gen-years-panel'));
    } else {
      show($('gen-year-stream'));
    }
    show($('gen-bg-hint'));
    hydrateJobUi(job);
    renderRunningProgress(job);
    updateStageTimeline(job);

    if (job.status === 'done') {
      clearJobPollers();
      disconnectJobStream();
      const ready = jobReadyForDemo(job);
      if (ready) {
        const intake = job.intake_snapshot || {};
        finishAndEnterDemo(
          job.session,
          { final: jobFinalPayload(job), session: job.session },
          intake,
          job.session.profile,
          {}
        );
      } else {
        showError('生成完成但缺少终局或年份数据，无法进入 Demo。');
        if (btnRun) {
          btnRun.disabled = false;
          btnRun.textContent = '重试';
        }
      }
      return;
    }

    if (job.status === 'awaiting_intervention') {
      void promptInterventionIfNeeded(job);
      return;
    }

    if (job.status === 'failed') {
      disconnectJobStream();
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '重试';
      }
      return;
    }

    if (job.status === 'pending' && !pendingPollTimer) {
      pendingPollTimer = setInterval(async () => {
        try {
          const fresh = await fetchJob(job.job_id);
          onJobSnapshot(fresh);
          if (fresh.status === 'running') attachJobStream(job.job_id, true);
        } catch (e) {
          console.warn('[generate] pending poll', e);
        }
      }, 3000);
    }

    if (job.status === 'running') {
      scheduleJobPoll(job.job_id);
    }
  }

  function handleJobStreamEvent(event, data) {
    if (event === 'job:snapshot') {
      onJobSnapshot(data);
      return;
    }
    if (event === 'job:awaiting_intervention') {
      fetchJob(currentJobId).then(onJobSnapshot).catch((e) => showError(e.message));
      return;
    }
    if (event === 'job:done') {
      fetchJob(currentJobId).then(onJobSnapshot).catch((e) => {
        console.warn('[generate] job:done fetch failed', e);
        enterDemoLive({ storedOk: false, jobId: currentJobId || loadJobId() });
      });
      return;
    }
    if (event === 'job:failed') {
      fetchJob(currentJobId).then(onJobSnapshot).catch((e) => showError(e.message));
      return;
    }
    if (event === 'job:timing') {
      log('timing', `${data.stage} · ${data.ms}ms`);
      showTimingHint(data.stage, data.ms);
      return;
    }
    if (event === 'job:stage_done') {
      fetchJob(currentJobId).then((job) => {
        hydrateJobUi(job);
        renderRunningProgress(job);
        const yr = job.session?.years?.slice(-1)[0];
        if (yr) {
          openYearDialogue(yr, job.session, job.session?.profile);
        }
      }).catch(() => {});
      return;
    }
    if (event === 'year:partial') {
      showStreamYear(data.year, data.event || data.title || '');
      return;
    }
    if (event.startsWith('persona:') || event.startsWith('beats:') || event.startsWith('scenario:')) {
      handleStartStage(event, data);
      return;
    }
    if (event.startsWith('year:') || event.startsWith('fate:')) {
      const idx = (currentJobId && data.year) ? data.year - 1 : 0;
      const beat = { type: data.type };
      handleYearStage(event, data, beat);
    }
  }

  function attachJobStream(jobId, skipSnapshot) {
    disconnectJobStream();
    currentJobId = jobId;
    saveJobId(jobId);

    if (!skipSnapshot) {
      fetchJob(jobId).then(onJobSnapshot).catch((e) => showError(e.message));
    }

    const es = new EventSource(apiUrl(`/api/story/jobs/${encodeURIComponent(jobId)}/stream`));
    activeEventSource = es;

    const bind = (name) => {
      es.addEventListener(name, (ev) => {
        let data = {};
        try {
          data = JSON.parse(ev.data || '{}');
        } catch (_) { /* ignore */ }
        handleJobStreamEvent(name, data);
      });
    };

    [
      'job:snapshot', 'job:queued', 'job:started', 'job:stage_done', 'job:done', 'job:failed',
      'job:awaiting_intervention', 'job:timing',
      'scenario:classified', 'persona:skipped', 'persona:start', 'persona:done',
      'beats:start', 'beats:done',
      'year:start', 'fate:start', 'fate:sampled', 'year:generating', 'year:partial', 'year:done'
    ].forEach(bind);

    es.onerror = () => {
      /* EventSource auto-reconnects with Last-Event-ID */
    };
  }

  async function runPipeline(resumeJobId = null) {
    const handoff = intakeHandoff || readHandoffFromSession();
    if (!handoff?.full_profile && !resumeJobId) {
      alert('请先完成 Intake 采集（岔路口 → 标签 → 行为题 → 确认）。');
      if (isUnified) showIntakeSection();
      return;
    }

    const full = handoff?.full_profile;
    if (full && (full.raw?.choice_text || '').length < 10) {
      alert('岔路口至少 10 字。');
      if (isUnified) showIntakeSection();
      return;
    }

    const generationMode = getGenerationMode();
    resetResults();
    setProgressScreen(true);
    show($('gen-run-panel'));
    show($('gen-bg-hint'));
    showPipelineSection();
    if (btnRun) {
      btnRun.disabled = true;
      btnRun.textContent = '生成中…';
    }
    clearError();
    pipelineStartedAt = Date.now();

    let health;
    try {
      health = await (await fetch('/api/health')).json();
    } catch {
      if (handoff) {
        log('intake', 'API 不可用 — 用本地规则即时合成七年，进入分层浏览');
        await synthLocalAndGoDemo(handoff);
      }
      return;
    }

    if (!health.has_key) {
      if (handoff) {
        log('intake', '未检测到 LLM Key — 用本地规则即时合成七年，进入分层浏览');
        await synthLocalAndGoDemo(handoff);
      }
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
      providerEl.textContent = `${providerLabel} · ${health.model_override || '默认模型'} · ${generationMode === 'fast' ? '快速' : '完整'}模式 · 服务端任务`;
    }

    if (resumeJobId) {
      log('job', `恢复任务 ${resumeJobId}`);
      attachJobStream(resumeJobId);
      return;
    }

    if (!handoff?.full_profile) {
      showError('缺少 Intake 数据');
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '开始 API 生成';
      }
      return;
    }

    let intakeResult = handoff;
    if (intakeResult.persona || intakeResult.persona_card) {
      log('intake', `沿用 Intake Persona（${intakeResult.persona_source || 'cached'}）`);
      renderPersona(intakeResult.persona, intakeResult.persona_card);
    } else {
      log('intake', '构建 profile + Persona agent…');
      try {
        intakeResult = await post('/api/intake/complete', intakeApiPayloadFromHandoff(handoff));
        renderPersona(intakeResult.persona, intakeResult.persona_card);
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
    setProgress(2);
    updateEtaLabel(0, 7, generationMode);

    try {
      const created = await post('/api/story/jobs', {
        profile,
        persona_card: intakeResult.persona_card || null,
        full_profile: intakeResult.full_profile || null,
        generation_mode: generationMode,
        intake_snapshot: {
          full_profile: intakeResult.full_profile,
          persona: intakeResult.persona,
          persona_card: intakeResult.persona_card,
          persona_source: intakeResult.persona_source
        }
      });
      log('job', `已创建 ${created.job_id} · ${created.status}`);
      saveJobId(created.job_id);
      attachJobStream(created.job_id, true);
      onJobSnapshot(created.job);
    } catch (e) {
      showError('创建生成任务失败：' + e.message);
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '重试';
      }
    }
  }

  function showResumePanel(jobId) {
    const panel = $('gen-resume-panel');
    const text = $('gen-resume-text');
    if (!jobId || !panel) return;
    if (text) {
      text.textContent = `未完成的生成任务 · ${jobId.slice(0, 20)}… · 可继续查看进度`;
    }
    show(panel);
  }

  async function checkResumeOnLoad() {
    const params = new URLSearchParams(location.search);
    const paramJobId = params.get('job_id');
    const jobId = paramJobId || loadJobId();
    if (!jobId) return;

    try {
      const job = await fetchJob(jobId);
      if (job.status === 'done' || job.status === 'failed' || job.status === 'running'
        || job.status === 'pending' || job.status === 'orphaned' || job.status === 'awaiting_intervention') {
        showPipelineSection();
        if (job.intake_snapshot?.full_profile) {
          intakeHandoff = job.intake_snapshot;
          renderIntakeSummary(intakeHandoff);
        }
        showResumePanel(jobId);
        if (params.get('autoresume') === '1' || job.status === 'running' || job.status === 'pending'
          || job.status === 'orphaned' || job.status === 'awaiting_intervention') {
          attachJobStream(jobId);
        }
      }
    } catch {
      clearJobId();
    }
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
  btnRun?.addEventListener('click', () => runPipeline());
  $('btn-resume-job')?.addEventListener('click', () => {
    const jobId = loadJobId();
    if (jobId) runPipeline(jobId);
  });
  $('btn-retry-job')?.addEventListener('click', async () => {
    const jobId = loadJobId();
    if (!jobId) return;
    try {
      await post(apiUrl(`/api/story/jobs/${encodeURIComponent(jobId)}/retry`), {});
      attachJobStream(jobId);
      if (btnRun) {
        btnRun.disabled = true;
        btnRun.textContent = '生成中…';
      }
    } catch (e) {
      showError('重试失败：' + e.message);
    }
  });
  $('btn-discard-job')?.addEventListener('click', () => {
    disconnectJobStream();
    clearJobId();
    resetResults();
    hide($('gen-run-panel'));
    if (btnRun) {
      btnRun.disabled = false;
      btnRun.textContent = '开始 API 生成';
    }
  });
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
        setTimeout(() => runPipeline(), 400);
      }
    }
  } else {
    checkResumeOnLoad();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && loadJobId()) {
      show($('gen-bg-hint'));
    }
  });

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
