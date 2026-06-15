/**
 * Shadow Demo — UI 引擎（契约字段渲染、导航、介入、对话 fallback）
 */
'use strict';

(function initShadowDemoEngine() {
  const getStory = () => window.ShadowDemo.STORY;
  const { ENV_LABELS, ShadowAgents, normalizeYear, getBeatForYear, getMemoriesForYear, shadowDisplayName } = window.ShadowDemo;
  const T = window.ShadowTransitions;
  const Sc = window.ShadowScenarios;
  const Sfx = () => window.ShadowAudio;

  const LANDING_PAGE = 0;
  const YEAR_START = 1;
  function getFinalPage() { return 1 + getStory().years.length; }
  function getTotalPages() { return getFinalPage() + 1; }
  let currentPage = LANDING_PAGE;
  /** 首页未点「进入七年」前，禁止方向键/滑动误触翻页 */
  let journeyStarted = false;
  /** Intake 直达七年时，返回键回 intake 而非 Landing */
  let skipLandingMode = false;

  function shouldSkipLanding() {
    const params = new URLSearchParams(location.search);
    if (params.get('from') === 'intake') return true;
    if (params.get('from') === 'generate') return true;
    if (params.get('live') === '1') return true;
    if (params.get('skipLanding') === '1') return true;
    try {
      if (sessionStorage.getItem('shadow_intake_story_id')) return true;
    } catch (_) { /* ignore */ }
    return false;
  }

  function enableSkipLandingMode() {
    skipLandingMode = true;
    document.body.classList.add('skip-landing');
    document.documentElement.classList.add('skip-landing-boot');
    const landing = document.getElementById('p-landing');
    if (landing) landing.setAttribute('aria-hidden', 'true');
  }

  function autoStartJourney() {
    enableSkipLandingMode();
    journeyStarted = true;
    currentPage = YEAR_START;
    applyPageTransform();
    const scenarioKey = Sc?.scenarioForPage(YEAR_START, getStory()) || getStory().scenario_primary || 'academic';
    Sc?.applyScenario(scenarioKey);
    syncScenarioChrome(currentPage, scenarioKey);
    onPageEnter(currentPage);
    const pages = document.querySelectorAll('.page');
    if (pages[currentPage]) T.staggerEnter(pages[currentPage]);
  }

  function handleNavBack() {
    if (skipLandingMode || shouldSkipLanding()) {
      window.location.href = 'intake.html';
      return;
    }
    goLanding();
  }
  let dialogTimer = null;
  /** @type {{ yearIdx: number, year: object, busy: boolean } | null} */
  let dialogSession = null;
  let interventionTimer = null;
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
    const isWufuxdu = storyId === 'wufuxdu';
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

    const heroUrl = (richVisual || isWufuxdu)
      ? (window.ShadowStoryVisuals?.resolveHeroUrl?.(getStory()) || '')
      : '';
    const spriteEl = heroUrl
      ? `<img class="sprite hero-png" src="${esc(heroUrl)}" alt="" width="112" height="112" decoding="async" />`
      : '<div class="sprite" aria-hidden="true"></div>';

    const props = Array.isArray(year.key_props) ? year.key_props : [];
    const propsLayer = props.length
      ? `<div class="scene-prop-chips">${props.map(p => `<span class="scene-prop-chip">${esc(p)}</span>`).join('')}</div>`
      : '';

    const animAssets = year.anim_assets || {};
    const wufuxduLayer = isWufuxdu
      ? `<div class="wfd-cinematic-layer" aria-hidden="true">
          <div class="wfd-sky-drift" data-asset-id="${esc(animAssets.sky || '')}"></div>
          <div class="wfd-season-overlay" data-asset-id="${esc(animAssets.season || animAssets.weather || '')}"></div>
          <div class="wfd-fog" data-asset-id="${esc(animAssets.fog || '')}"></div>
          <div class="wfd-lantern" data-asset-id="${esc(animAssets.lantern || '')}"></div>
          <div class="wfd-transport" data-asset-id="${esc(animAssets.transit || '')}"></div>
          <div class="wfd-particles" data-asset-id="${esc(animAssets.vfx || '')}"></div>
          <div class="wfd-window-light"></div>
          <div class="wfd-luggage" data-asset-id="PX-EXT-027"></div>
          <div class="wfd-prop wfd-prop-a" data-asset-id="PX-EXT-027"></div>
          <div class="wfd-prop wfd-prop-b" data-asset-id="PX-EXT-027"></div>
          <div class="wfd-npc-row" data-asset-id="${esc(animAssets.npc || '')}">
            <span></span><span></span><span></span><span></span><span class="is-empty"></span>
          </div>
          <div class="wfd-flashback"></div>
          <div class="wfd-hud" data-asset-id="${esc(animAssets.hud || 'PX-EXT-026')}">
            <span>Y${year.year}/7</span>
            <i style="--p:${Math.max(1, Math.min(7, year.year)) / 7 * 100}%"></i>
          </div>
        </div>`
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
      <div class="pixel-scene enter-item scene-env-${env} scene-mood-${mood} scene-scenario-${scenario}${richCls}${isWufuxdu ? ` wufuxdu-cinematic mode-${year.anim_mode || 'idle'} warmth-${year.warmth || year.year}` : ''}" data-environment="${env}" data-scenario="${scenario}" data-anim-mode="${esc(year.anim_mode || '')}" data-warmth="${esc(String(year.warmth || ''))}"${extAttr}>
        <span class="scene-corner tl" aria-hidden="true"></span>
        <span class="scene-corner tr" aria-hidden="true"></span>
        <span class="scene-corner bl" aria-hidden="true"></span>
        <span class="scene-corner br" aria-hidden="true"></span>
        <div class="scene-scanlines" aria-hidden="true"></div>
        <div class="scene-backdrop"></div>
        <div class="scene-mood-tint" aria-hidden="true"></div>
        <div class="scene-floor"></div>
        ${wufuxduLayer}
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

    const heroUrl = window.ShadowStoryVisuals?.resolveHeroUrl?.(getStory()) || '';
    const portrait = heroUrl
      ? `<img class="pt-portrait" src="${esc(heroUrl)}" alt="" width="96" height="96" decoding="async" />`
      : '<div class="avatar pt-portrait-fallback" aria-hidden="true"></div>';

    el.innerHTML = `
      <div class="pt-hero">${portrait}</div>
      <div class="pt-name">${esc(c.name)}</div>
      <div class="pt-path">${esc(p.choice)}</div>
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
      dot.onclick = () => {
        Sfx()?.playPageTurn?.();
        goToPage(YEAR_START + i);
      };
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

  /** skip-landing 时 Landing 脱离 flex 占位，滑块偏移需扣掉一页 */
  function sliderOffsetForPage(pageIdx) {
    if (skipLandingMode && pageIdx > LANDING_PAGE) return pageIdx - 1;
    return pageIdx;
  }

  function applyPageTransform() {
    const slider = document.getElementById('slider');
    slider.style.transform = `translateX(-${sliderOffsetForPage(currentPage) * 100}vw)`;
    const pages = document.querySelectorAll('.page');
    if (pages[currentPage]) pages[currentPage].scrollTop = 0;
    updateNav();
  }

  function goToPage(n) {
    const target = Math.max(0, Math.min(getTotalPages() - 1, n));
    if (target === currentPage) return;

    const interventionModal = document.getElementById('intervention-modal');
    if (interventionModal?.classList.contains('open')) {
      closeIntervention();
    }
    if (interventionTimer) {
      clearTimeout(interventionTimer);
      interventionTimer = null;
    }

    const direction = target > currentPage ? 1 : -1;
    const scenarioKey = Sc?.scenarioForPage(target, getStory()) || 'academic';

    const run = () => {
      currentPage = target;
      if (target === LANDING_PAGE) journeyStarted = false;
      else if (target >= YEAR_START) journeyStarted = true;
      applyPageTransform();
    };

    const after = () => {
      if (currentPage !== target) return;
      Sc?.applyScenario(scenarioKey);
      syncScenarioChrome(currentPage, scenarioKey);
      onPageEnter(currentPage);
      const pages = document.querySelectorAll('.page');
      if (pages[currentPage]) T.staggerEnter(pages[currentPage]);
    };

    T.pageTransition(run, direction, scenarioKey).then(ok => {
      if (ok === false) {
        run();
      }
      after();
    });
  }

  function prevPage() {
    if (currentPage <= LANDING_PAGE) return;
    goToPage(currentPage - 1);
  }

  function nextPage() {
    if (currentPage === LANDING_PAGE && !journeyStarted) return;
    if (currentPage >= getFinalPage()) return;
    goToPage(currentPage + 1);
  }

  function startJourney(yearOffset) {
    journeyStarted = true;
    goToPage(YEAR_START + (yearOffset || 0));
  }

  function goLanding() {
    journeyStarted = false;
    goToPage(LANDING_PAGE);
  }

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
    document.getElementById('source-tag')?.classList.toggle('visible', !isLanding);
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
      if (scene && (window.ShadowStoryVisuals?.isRichStory?.(getStory().id) || getStory().id === 'wufuxdu')) {
        const hero = scene.querySelector('.hero-png');
        const url = window.ShadowStoryVisuals.resolveHeroUrl(getStory());
        if (hero && url) hero.src = url;
      }
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

    const storyId = getStory().id;

    if (window.ShadowVisual && !window.ShadowStoryVisuals?.isRichStory?.(storyId) && storyId !== 'wufuxdu') {
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
      const pageAtSchedule = pageIdx;
      if (interventionTimer) clearTimeout(interventionTimer);
      interventionTimer = setTimeout(() => {
        interventionTimer = null;
        if (currentPage !== pageAtSchedule) return;
        openIntervention(yearIdx);
      }, 520);
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
      Sfx()?.bindOptionButton?.(btn);
      opts.appendChild(btn);
    });

    Sfx()?.playModalOpen?.();
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

  function setDialogBusy(busy) {
    if (dialogSession) dialogSession.busy = busy;
    const input = document.getElementById('dialog-input');
    const send = document.getElementById('dialog-send');
    const closeBtn = document.getElementById('btn-dlg-close');
    if (input) input.disabled = busy;
    if (send) send.disabled = busy;
    if (closeBtn) closeBtn.disabled = busy;
    document.querySelectorAll('#dlg-suggest .dlg-suggest-chip')
      .forEach(c => { if (!c.dataset.used) c.disabled = busy; });
  }

  /** 把引用的 memory id 解析成真实记忆内容（而非裸 id，给用户"它真的记得"的实感） */
  function memoryCiteText(citeIds) {
    if (!citeIds?.length) return '';
    const stream = getStory().memory_stream || [];
    const texts = citeIds
      .map(id => {
        const m = stream.find(mm => mm.id === id);
        return m ? (m.content || m.memory_summary || m.summary || '') : '';
      })
      .filter(Boolean)
      .map(t => `「${t.length > 42 ? t.slice(0, 42) + '…' : t}」`);
    return texts.length ? `凭着这段记忆 · ${texts.join('、')}` : '';
  }

  /** 取一句话里最有"抓手"感的短片段（去标点，截断） */
  function pickFragment(text, max = 9) {
    const parts = String(text || '')
      .replace(/[，。！？、；：…—\s「」『』""''（）()]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    return (parts[0] || String(text || '')).slice(0, max);
  }

  /**
   * 本地兜底的推荐问题 —— 仅在 /api/dialogue/suggest 不可用（静态站 / 断网）时使用。
   * 比写死的四句更贴语境：扣住年份、人格软肋、记忆、以及影子刚说的那句话，并按
   * 年份+轮次轮换，让不同年 / 不同轮拿到不同组合，避免"太同质化"。
   */
  function suggestedQuestions(year, turns) {
    const story = getStory();
    const pc = story.persona_card || {};
    const asked = new Set((turns || []).filter(t => t.role !== 'shadow').map(t => t.text));
    const lastShadow = (turns || []).slice().reverse().find(t => t.role === 'shadow');

    // anchored = 扣住语境的高相关问句，永远排在前面、不参与轮换
    const anchored = [];
    if (lastShadow?.text) {
      const frag = pickFragment(lastShadow.text);
      if (frag) anchored.push(`你说的「${frag}」，后来呢？`);
    }
    if (year?.title) anchored.push(`「${year.title}」那年，最难熬的是哪一刻？`);
    if (year?.is_pivotal) anchored.push('那个岔路口，你有过一秒想反悔吗？');
    const soft = (pc.soft_spots || [])[0];
    if (soft) anchored.push(`你到现在，还会被「${pickFragment(soft, 7)}」绊住吗？`);
    const mems = getMemoriesForYear(year?.year) || [];
    if (mems[0]?.content) anchored.push(`${pickFragment(mems[0].content, 8)}那件事，你怎么过去的？`);

    // generic = 通用填充，按年份+轮次轮换，避免每次都一样
    const generic = [
      '那一刻，你身边有人懂你吗？',
      '这一路，你失去的和得到的，哪个更重？',
      '能给那年的我带一句话，你会说什么？',
      '有没有一个人，你一直没机会说谢谢？'
    ];
    const freshAnchored = anchored.filter(q => !asked.has(q));
    const freshGeneric = generic.filter(q => !asked.has(q));
    const off = freshGeneric.length ? ((year?.year || 1) + (turns?.length || 0)) % freshGeneric.length : 0;
    const rotated = freshGeneric.slice(off).concat(freshGeneric.slice(0, off));

    const out = freshAnchored.concat(rotated).slice(0, 4);
    return out.length >= 3 ? out : anchored.concat(generic).slice(0, 4);
  }

  /** 把一组问题渲染成可点击的 chip */
  function renderSuggestChips(box, questions, statusEl, closeBtn) {
    box.classList.remove('dlg-suggest-loading');
    box.innerHTML = '';
    const asked = new Set((dialogSession?.turns || []).filter(t => t.role !== 'shadow').map(t => t.text));
    const fresh = questions.filter(q => q && !asked.has(q)).slice(0, 4);
    if (!fresh.length) { box.hidden = true; return; }
    fresh.forEach(q => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'dlg-suggest-chip';
      chip.textContent = q;
      chip.addEventListener('click', async () => {
        if (dialogSession?.busy) return;
        chip.dataset.used = '1';
        chip.disabled = true;
        Sfx()?.playUiClick?.();
        appendDialogTurn('user', q);
        await requestShadowReply(q, statusEl, closeBtn);
        await refreshSuggestions(statusEl, closeBtn);
        const inp = document.getElementById('dialog-input');
        if (inp) inp.focus();
      });
      box.appendChild(chip);
    });
    box.hidden = false;
  }

  /**
   * 刷新推荐问题：先尝试小 agent（/api/dialogue/suggest），按当前对话上下文生成；
   * 失败 / 为空则退回本地兜底。每次影子回完话都会调一次，所以 chip 会跟着对话走。
   */
  async function refreshSuggestions(statusEl, closeBtn) {
    const box = document.getElementById('dlg-suggest');
    if (!box || !dialogSession) return;
    const session = dialogSession;
    const year = session.year;

    box.classList.add('dlg-suggest-loading');
    box.innerHTML = '<span class="dlg-suggest-hint">影子在想，你大概还想问…</span>';
    box.hidden = false;

    let questions = null;
    try {
      if (ShadowAgents.dialogue.enabled && typeof ShadowAgents.dialogue.suggest === 'function') {
        const out = await ShadowAgents.dialogue.suggest({
          story: getStory(),
          year,
          turns: (session.turns || []).slice(-6),
          lastReply: session.lastReply || '',
          atYear: year.year
        });
        if (out?.questions?.length) questions = out.questions;
      }
    } catch (err) {
      console.warn('[suggest]', err.message);
    }

    // 若期间对话已关闭 / 切换，丢弃这次结果，避免覆盖新上下文
    if (dialogSession !== session) return;

    if (!questions || !questions.length) {
      questions = suggestedQuestions(year, session.turns);
    }
    renderSuggestChips(box, questions, statusEl, closeBtn);
  }

  function appendDialogTurn(role, text, citeIds) {
    const thread = document.getElementById('dlg-thread');
    if (!thread) return null;
    if (dialogSession) (dialogSession.turns ||= []).push({ role, text });
    const turn = document.createElement('div');
    turn.className = `dlg-turn dlg-turn-${role}`;
    if (role === 'shadow' && citeIds?.length) {
      const citeText = memoryCiteText(citeIds);
      turn.innerHTML = esc(text) + (citeText ? `<span class="dlg-turn-cite">${esc(citeText)}</span>` : '');
    } else {
      turn.textContent = text;
    }
    thread.appendChild(turn);
    thread.scrollTop = thread.scrollHeight;
    return turn;
  }

  function waitTypewriter(textEl, text, statusEl, closeBtn) {
    return new Promise(resolve => {
      if (dialogTimer) clearInterval(dialogTimer);
      if (T.prefersReducedMotion()) {
        textEl.textContent = text;
        statusEl.textContent = '▼ 可以继续提问';
        closeBtn.textContent = '关闭';
        setDialogBusy(false);
        resolve();
        return;
      }

      textEl.textContent = '';
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
          statusEl.textContent = '▼ 可以继续提问';
          closeBtn.textContent = '关闭';
          setDialogBusy(false);
          resolve();
        }
      }, 42);
    });
  }

  async function requestShadowReply(userQuestion, statusEl, closeBtn) {
    if (!dialogSession) return;
    setDialogBusy(true);
    statusEl.textContent = '▼ Shadow 正在回应...';
    closeBtn.textContent = '等待';

    let text = dialogSession.year.shadow_dialogue;
    let citeIds = getMemoriesForYear(dialogSession.year.year).map(m => m.id).slice(0, 1);
    let moodAfter = '';

    if (ShadowAgents.dialogue.enabled) {
      try {
        const live = await ShadowAgents.dialogue.ask({
          story: getStory(),
          year: dialogSession.year,
          interventions: userInterventions,
          userQuestion
        });
        if (live?.reply) {
          text = live.reply;
          citeIds = live.cite_memory_ids || citeIds;
          moodAfter = live.mood_after || '';
        }
      } catch (_) {
        /* fallback to static */
      }
    }

    // 记下影子这一轮的回答，喂给追问向导 + 兜底问题
    if (dialogSession) {
      (dialogSession.turns ||= []).push({ role: 'shadow', text });
      dialogSession.lastReply = text;
    }

    const citeEl = document.getElementById('dlg-cite');
    if (citeEl) citeEl.hidden = true;

    const thread = document.getElementById('dlg-thread');
    if (!thread) {
      setDialogBusy(false);
      return;
    }
    const turn = document.createElement('div');
    turn.className = 'dlg-turn dlg-turn-shadow';
    const body = document.createElement('span');
    turn.appendChild(body);
    if (citeIds.length) {
      const citeText = memoryCiteText(citeIds);
      if (citeText) {
        const cite = document.createElement('span');
        cite.className = 'dlg-turn-cite';
        cite.textContent = citeText;
        turn.appendChild(cite);
      }
    }
    thread.appendChild(turn);
    if (moodAfter) statusEl.textContent = `▼ mood · ${moodAfter}`;
    await waitTypewriter(body, text, statusEl, closeBtn);
    thread.scrollTop = thread.scrollHeight;
  }

  async function openDialog(yearIdx) {
    const rawYear = getStory().years[yearIdx];
    if (!rawYear) return;
    const year = normalizeYear(rawYear);

    const overlay = document.getElementById('dialog-overlay');
    const thread = document.getElementById('dlg-thread');
    const form = document.getElementById('dialog-form');
    const input = document.getElementById('dialog-input');
    document.getElementById('dlg-name').textContent = shadowDisplayName();
    document.getElementById('dlg-ctx').textContent = `~ 第 ${year.year} 年 · ${year.title} ~`;

    const statusEl = document.getElementById('dlg-status');
    const closeBtn = document.getElementById('btn-dlg-close');

    dialogSession = { yearIdx, year, busy: false, turns: [], lastReply: '' };
    if (thread) thread.innerHTML = '';
    if (form) form.hidden = true;
    if (input) input.value = '';
    statusEl.textContent = '▼ 正在连接 Shadow...';
    closeBtn.textContent = '跳过';

    Sfx()?.playModalOpen?.();
    T.modalOpen(overlay, 'dialog');

    const openingQ = `第 ${year.year} 年「${year.title}」—— Shadow，你想对现在的我说什么？`;
    await requestShadowReply(openingQ, statusEl, closeBtn);
    if (form) form.hidden = false;
    await refreshSuggestions(statusEl, closeBtn);
    if (input) input.focus();
  }

  async function submitDialogQuestion(e) {
    e.preventDefault();
    const input = document.getElementById('dialog-input');
    const statusEl = document.getElementById('dlg-status');
    const closeBtn = document.getElementById('btn-dlg-close');
    const question = input?.value.trim();
    if (!question || !dialogSession || dialogSession.busy) return;
    Sfx()?.playUiClick?.();
    input.value = '';
    appendDialogTurn('user', question);
    await requestShadowReply(question, statusEl, closeBtn);
    await refreshSuggestions(statusEl, closeBtn);
    input.focus();
  }

  function closeDialog() {
    if (dialogTimer) { clearInterval(dialogTimer); dialogTimer = null; }
    dialogSession = null;
    setDialogBusy(false);
    const sug = document.getElementById('dlg-suggest');
    if (sug) { sug.hidden = true; sug.innerHTML = ''; }
    T.modalClose(document.getElementById('dialog-overlay'));
  }

  // ─── Init ────────────────────────────────────────────────

  function bindGlobalEvents() {
    Sfx()?.mountToggle?.();

    document.getElementById('nav-back').addEventListener('click', () => {
      Sfx()?.playUiClick?.();
      handleNavBack();
    });
    document.getElementById('nav-prev').addEventListener('click', () => {
      Sfx()?.playPageTurn?.();
      prevPage();
    });
    document.getElementById('nav-next').addEventListener('click', () => {
      Sfx()?.playPageTurn?.();
      nextPage();
    });
    document.getElementById('btn-start').addEventListener('click', () => {
      Sfx()?.playOptionSelect?.();
      startJourney(0);
    });
    document.getElementById('btn-dlg-close').addEventListener('click', () => {
      Sfx()?.playUiClick?.();
      closeDialog();
    });
    document.getElementById('dialog-form')?.addEventListener('submit', submitDialogQuestion);
    document.getElementById('intervention-skip').addEventListener('click', () => {
      Sfx()?.playUiClick?.();
      closeIntervention();
    });

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
      if (currentPage === LANDING_PAGE && !journeyStarted) return;
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
      if (currentPage === LANDING_PAGE && !journeyStarted) return;
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
    journeyStarted = false;
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
      if (tag) {
        const params = new URLSearchParams(location.search);
        if (params.get('from') === 'generate' || story._from_generate) {
          tag.textContent = '⚡ Generate · Live 七年';
        } else {
          tag.textContent = story._demo_mock
            ? '📦 Demo Mock · Golden 七年'
            : '⚡ Live · 全 Agent 生成';
        }
      }
    }

    const dlgName = document.getElementById('dlg-name');
    if (dlgName) dlgName.textContent = shadowDisplayName();

    bindGlobalEvents();
    updateNav();

    T.spawnAmbientParticles(document.getElementById('ambient-particles'), 14);
    applyAllSceneTextures();

    if (shouldSkipLanding()) {
      autoStartJourney();
      Sfx()?.unlock?.();
    } else {
      Sc?.applyScenario(story.scenario_primary || 'academic');
      syncScenarioChrome(LANDING_PAGE, story.scenario_primary || 'academic');
      T.initLanding();
    }

    window.ShadowDemo.goToPage = goToPage;
    window.ShadowDemo.getInterventions = () => [...userInterventions];
  }

  window.ShadowDemoEngine = { init };
})();
