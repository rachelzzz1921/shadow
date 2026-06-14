/**
 * Shadow Demo — UI 引擎（契约字段渲染、导航、介入、对话 fallback）
 */
'use strict';

(function initShadowDemoEngine() {
  const getStory = () => window.ShadowDemo.STORY;
  const { ENV_LABELS, ShadowAgents, normalizeYear, getBeatForYear, getMemoriesForYear, shadowDisplayName } = window.ShadowDemo;
  const T = window.ShadowTransitions;
  const Sc = window.ShadowScenarios;

  const LANDING_PAGE = 0;
  const YEAR_START = 1;
  function getFinalPage() { return 1 + getStory().years.length; }
  function getTotalPages() { return getFinalPage() + 1; }
  let currentPage = LANDING_PAGE;
  let dialogTimer = null;
  /** @type {Array<{year:number, choice:string}>} */
  const userInterventions = [];
  /** @type {Set<number>} */
  const interventionShown = new Set();

  // ─── DOM helpers ─────────────────────────────────────────

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function sceneTag(year) {
    const env = ENV_LABELS[year.environment] || year.environment || year.scene;
    return `${env} · ${year.city || ''}`.replace(/ · $/, '');
  }

  function buildYearTimeline(currentYear) {
    return `<div class="yr-timeline enter-item" aria-hidden="true">${getStory().years.map(y => {
      let cls = 'yr-timeline-seg';
      if (y.year < currentYear) cls += ' past';
      if (y.year === currentYear) cls += ' current';
      if (y.is_pivotal && y.year === currentYear) cls += ' pivotal';
      return `<span class="${cls}"></span>`;
    }).join('')}</div>`;
  }

  /** @param {object} year normalized */
  function buildPixelScene(year) {
    const env = year.environment || 'classroom';
    const mood = year.scene || 'city';
    const scenario = year.scenario || getStory().scenario_primary || 'academic';
    const storyId = getStory().id || getStory()._activeStoryId;
    const richVisual = window.ShadowStoryVisuals?.isRichStory?.(storyId);
    const extras = [];

    if (env === 'classroom') extras.push('<div class="scene-window"></div>');
    if (env === 'dorm_night') extras.push('<div class="scene-moon"></div>');
    if (env === 'stage') extras.push('<div class="scene-spotlight"></div>');
    if (env === 'postoffice') extras.push('<div class="scene-sage"></div>');
    if (env === 'rental-house' || env === 'home-room') extras.push('<div class="scene-moon"></div>');
    if (env === 'studio') extras.push('<div class="scene-spotlight"></div><div class="scene-desk-prop"></div>');
    if (env === 'wedding' || env === 'birthday') extras.push('<div class="scene-spotlight"></div>');
    if (env === 'old-street' && richVisual) extras.push('<div class="scene-street-lamps"></div>');

    const heroUrl = richVisual ? (window.ShadowStoryVisuals?.resolveHeroUrl?.(getStory()) || '') : '';
    const spriteEl = heroUrl
      ? `<img class="sprite hero-png" src="${esc(heroUrl)}" alt="" width="112" height="112" decoding="async" />`
      : '<div class="sprite" aria-hidden="true"></div>';

    const props = Array.isArray(year.key_props) ? year.key_props : [];
    const propsLayer = props.length
      ? `<div class="scene-prop-chips">${props.map(p => `<span class="scene-prop-chip">${esc(p)}</span>`).join('')}</div>`
      : '';

    const fx = [];
    if (mood === 'rain' || mood === 'summer-night' || mood === 'rain-dusk' || year.fx === 'rain') {
      fx.push('<div class="scene-fx scene-fx-rain"></div>');
    }
    if (mood === 'night' || mood === 'winter-room' || mood === 'phone-light' || year.fx === 'night' || year.fx === 'cold') {
      fx.push('<div class="scene-fx scene-fx-night"></div>');
    }

    const richCls = richVisual ? ' has-story-visual scene-rich' : '';
    const extAttr = year.ext_bg ? ` data-ext-bg="${esc(year.ext_bg)}"` : '';

    return `
      <div class="pixel-scene enter-item scene-env-${env} scene-mood-${mood} scene-scenario-${scenario}${richCls}" data-environment="${env}" data-scenario="${scenario}"${extAttr}>
        <span class="scene-corner tl" aria-hidden="true"></span>
        <span class="scene-corner tr" aria-hidden="true"></span>
        <span class="scene-corner bl" aria-hidden="true"></span>
        <span class="scene-corner br" aria-hidden="true"></span>
        <div class="scene-scanlines" aria-hidden="true"></div>
        <div class="scene-backdrop"></div>
        <div class="scene-mood-tint" aria-hidden="true"></div>
        <div class="scene-floor"></div>
        ${extras.join('')}
        ${fx.join('')}
        ${propsLayer}
        <div class="sprite-wrap has-hero-png pose-${year.pose || 'wait'}" data-pose="${year.pose || 'wait'}">
          <div class="sprite-glow"></div>
          ${spriteEl}
        </div>
        <div class="scene-tag snes-inset">
          <span>${esc(sceneTag(year))}</span>
          <span>${year.is_pivotal ? '◆ PIVOTAL' : '○ QUIET'}</span>
        </div>
      </div>
    `;
  }

  function buildYearPage(rawYear) {
    const year = normalizeYear(rawYear);
    const scenario = year.scenario || getStory().scenario_primary || 'academic';
    const theme = Sc?.getTheme(scenario);
    const page = document.createElement('div');
    page.className = `page p-year${year.is_pivotal ? ' pivotal-year' : ' quiet-year'}`;
    page.id = `p-year-${year.year}`;
    page.dataset.year = String(year.year);
    page.dataset.scenario = scenario;

    const emo = year.emotion;
    const moodPct = (year.new_mood / 10) * 100;
    const esteemPct = (year.new_esteem / 10) * 100;
    const yearMemories = getMemoriesForYear(year.year);
    const memHtml = yearMemories.length
      ? yearMemories.map(m => `<li class="mem-${m.type}${m.type === 'pivotal' ? ' mem-pivotal' : ''}"><span class="mem-id">${esc(m.id)}</span>${esc(m.content)}</li>`).join('')
      : `<li class="mem-empty">${esc(year.memory_summary || '—')}</li>`;

    const interventionBlock = year.intervention_prompt
      ? `<div class="info-block snes-inset enter-item intervention-teaser">
          <div class="section-label">◆ 岔路口</div>
          <p>${esc(year.intervention_prompt.question)}</p>
        </div>`
      : '';

    const propsHtml = Array.isArray(year.key_props) && year.key_props.length
      ? `<span class="yr-props">${year.key_props.map(p => esc(p)).join(' · ')}</span>`
      : '';
    const visualBlock = year.visual_anchor
      ? `<div class="yr-visual-block snes-inset enter-item">
          <div class="section-label">◎ 画面锚点</div>
          <p class="yr-visual-anchor">${esc(year.visual_anchor)}</p>
          ${propsHtml}
          ${year.mood_visual ? `<span class="yr-mood-visual">${esc(year.mood_visual)}</span>` : ''}
          ${year.daily_micro ? `<span class="yr-daily-micro">A: ${esc(year.daily_micro)}</span>` : ''}
        </div>`
      : '';

    const dailyHtml = Array.isArray(year.daily_events) && year.daily_events.length
      ? `<div class="daily-events snes-inset enter-item">
          <div class="section-label">◈ 一日切片</div>
          <ul class="daily-list">${year.daily_events.map(d =>
            `<li><time>${esc(d.time)}</time><span>${esc(d.content)}</span></li>`
          ).join('')}</ul>
        </div>`
      : '';

    page.innerHTML = `
      ${buildPixelScene(year)}

      <div id="fate-slot-${year.year}" class="fate-slot snes enter-item" hidden></div>

      <div class="yr-header enter-item">
        <div class="yr-idx">YEAR.${year.year} · 年龄 ${year.age}</div>
        <div class="yr-badge-row">
          <div class="yr-h-badge">${year.year}</div>
          ${year.is_pivotal ? '<span class="yr-key-badge">◆ PIVOTAL</span>' : '<span class="yr-quiet-badge">○ QUIET</span>'}
        </div>
        <div class="yr-title">${esc(year.title)}</div>
        <div class="yr-location">${esc(sceneTag(year))}</div>
        <div class="yr-scenario-badge enter-item">${esc(theme?.label || scenario)} Agent</div>
        <div class="yr-scenario-brief enter-item">${esc(theme?.brief || '')}</div>
        ${buildYearTimeline(year.year)}
      </div>

      ${visualBlock}

      <div class="yr-card snes">
        <div class="enter-item">
          <div class="section-label">◈ 这一年发生了</div>
          <div class="main-event snes-inset${year.is_pivotal ? '' : ' quiet-event'}">${esc(year.event)}</div>
        </div>

        ${dailyHtml}

        <div class="two-col enter-item">
          <div class="info-block snes-inset">
            <div class="section-label">◆ 关键选择</div>
            <p>${esc(year.decision_made)}</p>
          </div>
          ${interventionBlock}
        </div>

        <div class="emo-bar-wrap enter-item emo-dual">
          <div class="emo-row-mini">
            <span class="emo-row-label">♥ ${esc(emo.label)}</span>
            <div class="emo-track thin"><div class="emo-fill" style="width:${moodPct}%"></div></div>
            <span class="emo-row-val">${year.new_mood}/10</span>
          </div>
          <div class="emo-row-mini">
            <span class="emo-row-label">◎ 自我</span>
            <div class="emo-track thin esteem"><div class="emo-fill" style="width:${esteemPct}%"></div></div>
            <span class="emo-row-val">${year.new_esteem}/10</span>
          </div>
        </div>

        <details class="memory-panel enter-item">
          <summary class="section-label">◇ 记忆流 memory_stream</summary>
          <ul class="memory-list">${memHtml}</ul>
        </details>

        <div class="reflection-block snes-inset enter-item">
          <div class="section-label">○ 领悟</div>
          <p class="reflection-text">${esc(year.reflection)}</p>
        </div>

        <button type="button" class="btn-shadow enter-item" data-year-idx="${year.year - 1}">与 Shadow 对话</button>
      </div>

      <div class="pg-hint enter-item">← 翻页切换年份 →</div>
    `;

    page.querySelector('.btn-shadow').addEventListener('click', () => openDialog(year.year - 1));
    return page;
  }

  function buildFinalPage() {
    const f = getStory().final;
    const scenario = getStory().scenario_secondary || 'self_growth';
    const theme = Sc?.getTheme(scenario);
    const finalEnv = f.scene === 'rain' ? 'trainstation' : (f.scene === 'night' ? 'home' : 'postoffice');
    const arcSteps = getStory().years.map(y =>
      `<span class="arc-step" style="--h:${Math.max(8, y.new_mood * 10)}%" data-y="${y.year}"></span>`
    ).join('');
    const page = document.createElement('div');
    page.className = 'page';
    page.id = 'p-final';
    page.dataset.scenario = scenario;

    page.innerHTML = `
      <div class="pixel-scene enter-item scene-env-${finalEnv} scene-mood-${f.scene || 'city'} scene-scenario-${scenario}" data-environment="${finalEnv}" data-scenario="${scenario}">
        <span class="scene-corner tl" aria-hidden="true"></span>
        <span class="scene-corner tr" aria-hidden="true"></span>
        <span class="scene-corner bl" aria-hidden="true"></span>
        <span class="scene-corner br" aria-hidden="true"></span>
        <div class="scene-scanlines" aria-hidden="true"></div>
        <div class="scene-backdrop"></div>
        <div class="scene-floor"></div>
        <div class="scene-sage"></div>
        <div class="scene-tag snes-inset">
          <span>和解 · ${esc(getStory().line_name || '七年')}</span>
          <span>◆ FINAL</span>
        </div>
      </div>

      <div class="final-divider enter-item">
        <div class="line"></div>
        <div class="diamond"></div>
        <span>七 年 后 的 回 信</span>
        <div class="diamond"></div>
        <div class="line r"></div>
      </div>

      <div class="yr-scenario-badge enter-item">${esc(theme?.label || scenario)} Agent · 和解</div>

      <div class="final-card snes">
        <div class="final-title enter-item">${esc(f.title)}</div>

        <div class="enter-item">
          <div class="section-label">── 最后的话 ──</div>
          <p class="arc-desc">${esc(f.message)}</p>
        </div>

        <div class="insight-block snes-inset enter-item">
          <div class="insight-diamond"></div>
          <div class="insight-label">◆ 遗憾 ◆</div>
          <p class="insight-text">「${esc(f.regret || '—')}」</p>
        </div>

        <div class="insight-block snes-inset reconcile-block enter-item">
          <div class="insight-diamond"></div>
          <div class="insight-label">◇ 和解 ◇</div>
          <p class="insight-text">${esc((f.message || '').split('。').filter(Boolean)[0] ? (f.message.split('。').filter(Boolean)[0] + '。') : '七年走过，影子仍在。')}</p>
        </div>

        <div class="emo-arc enter-item">
          <div class="section-label">── 情绪轨迹 ──</div>
          <p class="emotion-arc-text">${esc(f.emotion_arc)}</p>
          <div class="emo-arc-viz" aria-label="七年情绪高度">${arcSteps}</div>
        </div>

        <div class="closing-block enter-item">
          <p class="closing-sign">— ${esc(shadowDisplayName())} 敬上</p>
        </div>
      </div>

      <div class="final-footer enter-item">═══ Shadow 消散在时间的背面 · 和解 ═══</div>
    `;
    return page;
  }

  function buildLandingProfile() {
    const p = getStory().profile;
    const c = getStory().persona_card;
    const el = document.getElementById('profile-teaser');
    if (!el) return;

    el.innerHTML = `
      <div class="pt-row">
        <div class="avatar" aria-hidden="true"></div>
        <div>
          <div class="pt-name">${esc(c.name)}</div>
          <div class="pt-path">${esc(p.choice)}</div>
        </div>
      </div>
      <div class="pt-meta">${esc(p.mbti || '')} · ${p.age} 岁 · ${(p.keywords || []).join(' · ')}</div>
      <div class="pt-concept">${esc(getStory().premise)}</div>
      <details class="persona-details">
        <summary>人格卡 persona_card${c._from_intake ? ' · 来自 Intake' : ''}</summary>
        <ul class="persona-list">
          ${c.core_tension ? `<li><b>矛盾</b> ${esc(c.core_tension)}</li>` : ''}
          <li><b>特质</b> ${(c.core_traits || []).map(esc).join(' · ')}</li>
          <li><b>软肋</b> ${(c.soft_spots || []).map(esc).join('；')}</li>
          <li><b>倾向</b> ${esc(c.decision_tendency)}</li>
          <li><b>成长</b> ${esc(c.growth_seed)}</li>
          ${c.voice_notes ? `<li><b>语气</b> ${esc(c.voice_notes)}</li>` : ''}
        </ul>
      </details>
    `;
  }

  function buildScenarioLegend() {
    const el = document.getElementById('scenario-legend');
    if (!el || !window.ShadowScenarios) return;
    el.innerHTML = Object.values(window.ShadowScenarios.SCENARIO_THEMES)
      .map(t => `<span class="scenario-chip" data-domain="${t.id}">${esc(t.label)}</span>`)
      .join('');
  }

  function buildYearDots() {
    const indicator = document.getElementById('page-indicator');
    indicator.innerHTML = '';
    getStory().years.forEach((node, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot' + (node.is_pivotal ? ' key' : '');
      dot.title = `第 ${node.year} 年 · ${node.title}`;
      dot.setAttribute('aria-label', dot.title);
      if (node.scenario) dot.dataset.scenario = node.scenario;
      dot.onclick = () => goToPage(YEAR_START + i);
      indicator.appendChild(dot);
    });
    const finalDot = document.createElement('button');
    finalDot.type = 'button';
    finalDot.className = 'dot';
    finalDot.title = '七年后的回信';
    finalDot.setAttribute('aria-label', finalDot.title);
    finalDot.onclick = () => goToPage(getFinalPage());
    indicator.appendChild(finalDot);
  }

  function buildLandingYearDots() {
    const container = document.getElementById('year-dots-landing');
    container.innerHTML = '';
    getStory().years.forEach((node, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'yr-dot';
      el.onclick = () => startJourney(i);
      el.innerHTML = `
        <div class="yr-circle${node.is_pivotal ? ' key' : ''}">${node.year}</div>
        <span class="yr-year">${esc(node.title)}</span>
      `;
      container.appendChild(el);
    });
  }

  // ─── Navigation ──────────────────────────────────────────

  function applyPageTransform() {
    const slider = document.getElementById('slider');
    slider.style.transform = `translateX(-${currentPage * 100}vw)`;
    const pages = document.querySelectorAll('.page');
    if (pages[currentPage]) pages[currentPage].scrollTop = 0;
    updateNav();
  }

  function goToPage(n) {
    const target = Math.max(0, Math.min(getTotalPages() - 1, n));
    if (target === currentPage) return;

    const direction = target > currentPage ? 1 : -1;
    const scenarioKey = Sc?.scenarioForPage(target, getStory()) || 'academic';

    const run = () => {
      currentPage = target;
      applyPageTransform();
    };

    const after = () => {
      Sc?.applyScenario(scenarioKey);
      syncScenarioChrome(currentPage, scenarioKey);
      onPageEnter(currentPage);
      const pages = document.querySelectorAll('.page');
      if (pages[currentPage]) T.staggerEnter(pages[currentPage]);
    };

    T.pageTransition(run, direction, scenarioKey).then(ok => {
      if (ok !== false) after();
    });
  }

  function prevPage() { goToPage(currentPage - 1); }
  function nextPage() { goToPage(currentPage + 1); }
  function startJourney(yearOffset) { goToPage(YEAR_START + (yearOffset || 0)); }
  function goLanding() { goToPage(LANDING_PAGE); }

  function updateSourceTag(scenarioKey) {
    const tag = document.getElementById('source-tag');
    if (!tag || currentPage === LANDING_PAGE) return;
    const theme = Sc?.getTheme(scenarioKey);
    const line = getStory().line_name || '平行人生';
    tag.textContent = `📦 ${theme?.label || scenarioKey} · ${line}`;
  }

  function announcePage(pageIdx, scenarioKey) {
    const live = document.getElementById('page-announcer');
    if (!live) return;
    if (pageIdx === LANDING_PAGE) {
      live.textContent = 'Shadow 平行人生 Demo 首页';
      return;
    }
    if (pageIdx === getFinalPage()) {
      live.textContent = '七年后的回信 · 和解';
      return;
    }
    const raw = getStory().years[pageIdx - YEAR_START];
    const theme = Sc?.getTheme(raw?.scenario || scenarioKey);
    if (raw) {
      live.textContent = `第 ${raw.year} 年，${raw.title}，${theme?.label || ''} Agent`;
    }
  }

  function tuneParticles(scenarioKey) {
    const root = document.getElementById('ambient-particles');
    if (!root) return;
    root.classList.toggle('dense', ['family', 'self_growth', 'love'].includes(scenarioKey));
  }

  function syncScenarioChrome(pageIdx, scenarioKey) {
    updateSourceTag(scenarioKey);
    announcePage(pageIdx, scenarioKey);
    tuneParticles(scenarioKey);
  }

  function updateNav() {
    const isLanding = currentPage === LANDING_PAGE;
    document.getElementById('nav-back').classList.toggle('visible', !isLanding);
    document.getElementById('page-indicator').classList.toggle('visible', !isLanding);
    document.getElementById('source-tag').classList.toggle('visible', !isLanding);
    document.getElementById('nav-hint-bar')?.classList.toggle('visible', !isLanding);

    const prev = document.getElementById('nav-prev');
    const next = document.getElementById('nav-next');
    if (isLanding) {
      prev.classList.remove('visible');
      next.classList.remove('visible');
    } else {
      prev.classList.add('visible');
      next.classList.add('visible');
      prev.classList.toggle('hidden', currentPage <= YEAR_START);
      next.classList.toggle('hidden', currentPage >= getFinalPage());
    }

    document.querySelectorAll('#page-indicator .dot').forEach((dot, i) => {
      dot.classList.toggle('active', (currentPage - YEAR_START) === i);
    });
  }

  function applySceneTexturesForPage(pageIdx) {
    const Ttex = window.ShadowSceneTextures;
    if (!Ttex) return;
    if (pageIdx >= YEAR_START && pageIdx < getFinalPage()) {
      const yearIdx = pageIdx - YEAR_START;
      const raw = getStory().years[yearIdx];
      if (!raw) return;
      const year = normalizeYear(raw);
      const scene = document.querySelector(`#p-year-${year.year} .pixel-scene`);
      const scenarioKey = year.scenario || getStory().scenario_primary || 'academic';
      Ttex.apply(scene, scenarioKey, year);
      return;
    }
    if (pageIdx === getFinalPage()) {
      const scenario = getStory().scenario_secondary || 'self_growth';
      const scene = document.querySelector('#p-final .pixel-scene');
      Ttex.apply(scene, scenario, { environment: 'postoffice', scene: getStory().final?.scene || 'city' });
    }
  }

  function applyAllSceneTextures() {
    for (let p = YEAR_START; p <= getFinalPage(); p += 1) {
      applySceneTexturesForPage(p);
    }
  }

  async function onPageEnter(pageIdx) {
    if (pageIdx < YEAR_START || pageIdx > getFinalPage() - 1) return;
    const yearIdx = pageIdx - YEAR_START;
    const rawYear = getStory().years[yearIdx];
    if (!rawYear) return;

    const year = normalizeYear(rawYear);

    if (ShadowAgents.fate.enabled) {
      const last = userInterventions.filter(u => u.year < year.year).pop() || null;
      const result = await ShadowAgents.fate.onYearEnter({
        story: getStory(),
        year,
        beats: getStory().beats,
        beat: getBeatForYear(year.year),
        yearIndex: yearIdx,
        lastIntervention: last
      });
      applyFateSlot(year.year, result);
    }

    if (window.ShadowVisual && !window.ShadowStoryVisuals?.isRichStory?.(getStory().id)) {
      window.ShadowVisual.paintYear(year.year, year.year, year);
    }

    const scenarioKey = year.scenario || getStory().scenario_primary || 'academic';
    const scene = document.querySelector(`#p-year-${year.year} .pixel-scene`);
    if (window.ShadowUniversalAssets && scene && !window.ShadowStoryVisuals?.isRichStory?.(getStory().id)) {
      await window.ShadowUniversalAssets.paintScenarioAsync(scene, scenarioKey);
    }
    if (window.ShadowExtendedAssets && scene && !window.ShadowStoryVisuals?.isRichStory?.(getStory().id)) {
      await window.ShadowExtendedAssets.paintYearAsync(scene, year);
    }

    applySceneTexturesForPage(pageIdx);

    if (year.is_pivotal && year.intervention_prompt && !interventionShown.has(year.year)) {
      interventionShown.add(year.year);
      setTimeout(() => openIntervention(yearIdx), 520);
    }
  }

  /** @param {number} yearNum @param {object|null} result */
  function applyFateSlot(yearNum, result) {
    const slot = document.getElementById(`fate-slot-${yearNum}`);
    if (!slot) return;
    if (!result || (!result.overlay && !result.hint)) {
      slot.hidden = true;
      slot.innerHTML = '';
      return;
    }
    slot.hidden = false;
    slot.innerHTML = `
      ${result.overlay ? `<p class="fate-overlay">${esc(result.overlay)}</p>` : ''}
      ${result.hint ? `<p class="fate-hint">${esc(result.hint)}${result._placeholder ? ' <span class="fate-tag">placeholder</span>' : ''}</p>` : ''}
    `;
  }

  // ─── Intervention ────────────────────────────────────────

  function openIntervention(yearIdx) {
    const year = getStory().years[yearIdx];
    if (!year?.intervention_prompt) return;

    const modal = document.getElementById('intervention-modal');
    document.getElementById('intervention-question').textContent = year.intervention_prompt.question;
    const opts = document.getElementById('intervention-options');
    opts.innerHTML = '';

    year.intervention_prompt.options.forEach(option => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = option;
      btn.onclick = () => selectIntervention(year.year, option);
      opts.appendChild(btn);
    });

    T.modalOpen(modal, 'intervention');
  }

  async function selectIntervention(yearNum, choice) {
    userInterventions.push({ year: yearNum, choice });
    closeIntervention();

    const badge = document.querySelector(`#p-year-${yearNum} .intervention-teaser`);
    if (badge) {
      badge.innerHTML = `<div class="section-label">◆ 你的选择</div><p class="choice-made">${esc(choice)}</p>`;
    }

    if (ShadowAgents.fate.enabled) {
      const yearIdx = yearNum - 1;
      const year = normalizeYear(getStory().years[yearIdx]);
      const result = await ShadowAgents.fate.onIntervention({
        story: getStory(),
        year,
        beats: getStory().beats,
        beat: getBeatForYear(yearNum),
        yearIndex: yearIdx,
        choice,
        lastIntervention: { year: yearNum, choice }
      });
      applyFateSlot(yearNum, result);
    }
  }

  function closeIntervention() {
    T.modalClose(document.getElementById('intervention-modal'));
  }

  // ─── Dialogue ────────────────────────────────────────────

  async function openDialog(yearIdx) {
    const rawYear = getStory().years[yearIdx];
    if (!rawYear) return;
    const year = normalizeYear(rawYear);

    const overlay = document.getElementById('dialog-overlay');
    document.getElementById('dlg-name').textContent = shadowDisplayName();
    document.getElementById('dlg-ctx').textContent = `~ 第 ${year.year} 年 · ${year.title} ~`;

    const textEl = document.getElementById('dlg-text');
    const statusEl = document.getElementById('dlg-status');
    const closeBtn = document.getElementById('btn-dlg-close');

    textEl.innerHTML = '';
    statusEl.textContent = '▼ 正在讲述...';
    closeBtn.textContent = '跳过';

    T.modalOpen(overlay, 'dialog');

    let text = year.shadow_dialogue;
    let citeIds = getMemoriesForYear(year.year).map(m => m.id).slice(0, 1);

    if (ShadowAgents.dialogue.enabled) {
      statusEl.textContent = '▼ Shadow 正在回应...';
      try {
        const live = await ShadowAgents.dialogue.ask({
          story: getStory(),
          year,
          interventions: userInterventions
        });
        if (live?.reply) {
          text = live.reply;
          citeIds = live.cite_memory_ids || citeIds;
          if (live.mood_after) statusEl.textContent = `▼ mood · ${live.mood_after}`;
        }
      } catch (_) {
        /* fallback to static */
      }
    }

    if (citeIds.length) {
      document.getElementById('dlg-cite').textContent = `cite: ${citeIds.join(', ')}`;
      document.getElementById('dlg-cite').hidden = false;
    } else {
      document.getElementById('dlg-cite').hidden = true;
    }

    runTypewriter(textEl, text, statusEl, closeBtn);
  }

  function runTypewriter(textEl, text, statusEl, closeBtn) {
    if (dialogTimer) clearInterval(dialogTimer);
    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'dlg-cursor';
    textEl.appendChild(cursor);

    dialogTimer = setInterval(() => {
      cursor.before(text[i]);
      i++;
      if (i >= text.length) {
        clearInterval(dialogTimer);
        dialogTimer = null;
        cursor.remove();
        statusEl.textContent = '▼ 对话结束';
        closeBtn.textContent = '关闭';
      }
    }, 42);
  }

  function closeDialog() {
    if (dialogTimer) { clearInterval(dialogTimer); dialogTimer = null; }
    T.modalClose(document.getElementById('dialog-overlay'));
  }

  // ─── Init ────────────────────────────────────────────────

  function bindGlobalEvents() {
    document.getElementById('nav-back').addEventListener('click', goLanding);
    document.getElementById('nav-prev').addEventListener('click', prevPage);
    document.getElementById('nav-next').addEventListener('click', nextPage);
    document.getElementById('btn-start').addEventListener('click', () => startJourney(0));
    document.getElementById('btn-dlg-close').addEventListener('click', closeDialog);
    document.getElementById('intervention-skip').addEventListener('click', closeIntervention);

    document.addEventListener('keydown', e => {
      if (document.getElementById('intervention-modal').classList.contains('open')) {
        if (e.key === 'Escape') closeIntervention();
        return;
      }
      if (document.getElementById('dialog-overlay').classList.contains('open')) {
        if (e.key === 'Escape') closeDialog();
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextPage();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevPage();
      }
    });

    let touchStartX = 0;
    document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    document.addEventListener('touchend', e => {
      if (document.getElementById('dialog-overlay').classList.contains('open')) return;
      if (document.getElementById('intervention-modal').classList.contains('open')) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) nextPage();
        else prevPage();
      }
    }, { passive: true });
  }

  function init() {
    const story = getStory();
    const slider = document.getElementById('slider');
    slider.querySelectorAll('.page:not(#p-landing)').forEach(p => p.remove());
    currentPage = LANDING_PAGE;
    userInterventions.length = 0;
    interventionShown.clear();

    story.years.forEach(y => slider.appendChild(buildYearPage(y)));
    slider.appendChild(buildFinalPage());

    buildLandingProfile();
    buildScenarioLegend();
    buildYearDots();
    buildLandingYearDots();

    const btn = document.getElementById('btn-start');
    if (btn) btn.textContent = `进入${story.persona_card.name}的七年`;

    const tagline = document.querySelector('.landing-tagline');
    if (tagline) tagline.textContent = `平行人生 · ${story.line_name || 'Demo'}`;

    const sourceLanding = document.getElementById('source-tag');
    if (sourceLanding && !story._from_live && !story.persona_card._from_intake) {
      sourceLanding.textContent = `📦 Mock · ${story.line_name}`;
    }

    if (story.persona_card._from_intake) {
      if (btn) btn.textContent = `进入${story.persona_card.name}的七年（Mock）`;
      const tag = document.getElementById('source-tag');
      if (tag) tag.textContent = '🧬 Intake · Persona agent';
      if (tagline && story.profile?.choice) {
        tagline.textContent = `你的岔路口 · ${story.scenario_primary || '平行'}域`;
      }
    }

    if (story._from_live) {
      if (btn) btn.textContent = `进入${story.persona_card.name}的七年（Live）`;
      const tag = document.getElementById('source-tag');
      if (tag) tag.textContent = story._demo_mock
        ? '📦 Demo Mock · Golden 七年'
        : '⚡ Live · 全 Agent 生成';
    }

    const dlgName = document.getElementById('dlg-name');
    if (dlgName) dlgName.textContent = shadowDisplayName();

    bindGlobalEvents();
    updateNav();

    T.spawnAmbientParticles(document.getElementById('ambient-particles'), 14);
    Sc?.applyScenario(story.scenario_primary || 'academic');
    syncScenarioChrome(LANDING_PAGE, story.scenario_primary || 'academic');
    applyAllSceneTextures();
    T.initLanding();

    window.ShadowDemo.goToPage = goToPage;
    window.ShadowDemo.getInterventions = () => [...userInterventions];
  }

  window.ShadowDemoEngine = { init };
})();
