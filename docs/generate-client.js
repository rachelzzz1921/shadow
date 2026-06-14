'use strict';

/**
 * Shadow Generate — Intake 全链 + API 七年纯文字输出
 * Intake（四层）→ Persona → POST /api/story/start → year×7 → final
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
    return {
      choice: layerA.choice_text,
      description: layerA.self_description,
      quote: layerA.one_liner,
      birth_year: layerA.birth_year,
      fork_year: layerA.fork_year,
      age: layerA.age_at_fork,
      gender: layerA.gender,
      keywords: full.raw?.selected_tags || []
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
    const tags = (full.raw?.selected_tags || []).join(' · ') || '—';
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

  function resetResults() {
    lastExport = null;
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
      showError('API 不可用。请先运行 npm run demo:local');
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '开始 API 生成';
      }
      return;
    }

    if (!health.has_key) {
      showError('未检测到 LLM Key。请在 shadow-corpus/archive/demo-v0.2/.env 配置 DEEPSEEK_API_KEY 或 STEPFUN_API_KEY。');
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '开始 API 生成';
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
      log('beats', 'Beats agent 编排七年节奏…');
      const start = await post('/api/story/start', {
        profile,
        persona_card: intakeResult.persona_card || null,
        full_profile: intakeResult.full_profile || null
      });
      session = start.session;
      renderBeats(session);
      log('beats', `pivotal · ${(session.pivotal_years || []).join(', ')}`);
      setProgress(18);
    } catch (e) {
      showError('Story 启动失败：' + e.message);
      if (btnRun) {
        btnRun.disabled = false;
        btnRun.textContent = '重试';
      }
      return;
    }

    const totalYears = (session.beats || []).length || 7;

    for (let i = 0; i < totalYears; i++) {
      const beat = session.beats[i];
      log('fate', `第 ${beat.year} 年 · 命运 agent 采样…`);
      log('year', `Year agent 生成中 (${beat.type})…`);

      let result;
      let yearErr = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await post('/api/story/year', { session, user_intervention: null });
          yearErr = null;
          break;
        } catch (e) {
          yearErr = e;
          if (attempt < 2) {
            log('year', `第 ${beat.year} 年 schema 未通过，重试 ${attempt + 2}/3…`);
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      }
      if (yearErr) {
        showError(`第 ${beat.year} 年失败：${yearErr.message}`);
        if (btnRun) {
          btnRun.disabled = false;
          btnRun.textContent = '重试';
        }
        return;
      }

      session = result.session;
      const eraLine = session.last_fate_context?.era_line || result.session?.last_fate_context?.era_line || '';
      appendYear(result.year, eraLine, beat.type);
      log('fate', eraLine.slice(0, 80) || '时代层已注入');
      log('year', `✓ ${result.year?.title || '第' + beat.year + '年'}`);
      setProgress(18 + ((i + 1) / totalYears) * 68);
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
    log('final', '完成');

    lastExport = {
      profile,
      full_profile: intakeResult.full_profile,
      persona: intakeResult.persona,
      persona_card: session.persona_card || intakeResult.persona_card,
      session,
      final: fin.final,
      generated_at: new Date().toISOString(),
      provider: health.provider
    };

    if (btnRun) {
      btnRun.textContent = '生成完成';
      btnRun.disabled = false;
    }
  }

  function onIntakeComplete(result) {
    intakeHandoff = {
      ...result,
      intake_request: result.intake_request || null
    };
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
    window.location.href = 'demo-hub.html';
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
