/**
 * Shadow Demo — UI 引擎（契约字段渲染、导航、介入、对话 fallback）
 */
'use strict';

(function initShadowDemoEngine() {
  const { STORY, ENV_LABELS, ShadowAgents, normalizeYear, getBeatForYear, getMemoriesForYear, shadowDisplayName } = window.ShadowDemo;
  const T = window.ShadowTransitions;
  const Sc = window.ShadowScenarios;

  const LANDING_PAGE = 0;
  const YEAR_START = 1;
  const FINAL_PAGE = 1 + STORY.years.length;

  let currentPage = LANDING_PAGE;
  const totalPages = FINAL_PAGE + 1;
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

  /** @param {object} year normalized */
  function buildPixelScene(year) {
    const env = year.environment || 'classroom';
    const mood = year.scene || 'city';
    const scenario = year.scenario || STORY.scenario_primary || 'academic';
    const extras = [];

    if (env === 'classroom') extras.push('<div class="scene-window"></div>');
    if (env === 'dorm_night') extras.push('<div class="scene-moon"></div>');
    if (env === 'stage') extras.push('<div class="scene-spotlight"></div>');
    if (env === 'postoffice') extras.push('<div class="scene-sage"></div>');

    const fx = [];
    if (mood === 'rain') fx.push('<div class="scene-fx scene-fx-rain"></div>');
    if (mood === 'night') fx.push('<div class="scene-fx scene-fx-night"></div>');

    return `
      <div class="pixel-scene enter-item scene-env-${env} scene-mood-${mood} scene-scenario-${scenario}" data-environment="${env}" data-scenario="${scenario}">
        <div class="scene-backdrop"></div>
        <div class="scene-floor"></div>
        ${extras.join('')}
        ${fx.join('')}
        <div class="sprite-wrap pose-${year.pose || 'wait'}" data-pose="${year.pose || 'wait'}">
          <div class="sprite-glow"></div>
          <div class="sprite" aria-hidden="true"></div>
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
    const scenario = year.scenario || STORY.scenario_primary || 'academic';
    const theme = Sc?.getTheme(scenario);
    const page = document.createElement('div');
    page.className = `page p-year${year.is_pivotal ? ' pivotal-year' : ' quiet-year'}`;
    page.id = `p-year-${year.year}`;
    page.dataset.year = String(year.year);
    page.dataset.scenario = scenario;

    const emo = year.emotion;
    const emoPct = (emo.value / 10) * 100;
    const yearMemories = getMemoriesForYear(year.year);
    const memHtml = yearMemories.length
      ? yearMemories.map(m => `<li class="mem-${m.type}"><span class="mem-id">${esc(m.id)}</span>${esc(m.content)}</li>`).join('')
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
          ${year.daily_micro ? `<span class="yr-daily-micro">A: ${esc(year.daily_micro)}</span>` : ''}
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
      </div>

      ${visualBlock}

      <div class="yr-card snes">
        <div class="enter-item">
          <div class="section-label">◈ 这一年发生了</div>
          <div class="main-event snes-inset${year.is_pivotal ? '' : ' quiet-event'}">${esc(year.event)}</div>
        </div>

        <div class="two-col enter-item">
          <div class="info-block snes-inset">
            <div class="section-label">◆ 关键选择</div>
            <p>${esc(year.decision_made)}</p>
          </div>
          ${interventionBlock}
        </div>

        <div class="emo-bar-wrap enter-item">
          <div class="emo-label-row">
            <span>♥ ${esc(emo.label)}</span>
            <span>mood ${year.new_mood}/10 · esteem ${year.new_esteem}/10</span>
          </div>
          <div class="emo-track"><div class="emo-fill" style="width:${emoPct}%"></div></div>
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
    const f = STORY.final;
    const scenario = STORY.scenario_secondary || 'self_growth';
    const theme = Sc?.getTheme(scenario);
    const page = document.createElement('div');
    page.className = 'page';
    page.id = 'p-final';
    page.dataset.scenario = scenario;

    page.innerHTML = `
      <div class="pixel-scene enter-item scene-env-postoffice scene-mood-city scene-scenario-${scenario}" data-environment="postoffice" data-scenario="${scenario}">
        <div class="scene-backdrop"></div>
        <div class="scene-floor"></div>
        <div class="scene-sage"></div>
        <div class="scene-tag snes-inset">
          <span>和解 · 邮局</span>
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
          <p class="insight-text">「${esc(f.regret)}」</p>
        </div>

        <div class="insight-block snes-inset reconcile-block enter-item">
          <div class="insight-diamond"></div>
          <div class="insight-label">◇ 和解 ◇</div>
          <p class="insight-text">够了。在低处找到一种安静的平稳。</p>
        </div>

        <div class="emo-arc enter-item">
          <div class="section-label">── 情绪轨迹 ──</div>
          <p class="emotion-arc-text">${esc(f.emotion_arc)}</p>
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
    const p = STORY.profile;
    const c = STORY.persona_card;
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
      <div class="pt-concept">${esc(STORY.premise)}</div>
      <details class="persona-details">
        <summary>人格卡 persona_card</summary>
        <ul class="persona-list">
          <li><b>特质</b> ${(c.core_traits || []).map(esc).join(' · ')}</li>
          <li><b>软肋</b> ${(c.soft_spots || []).map(esc).join('；')}</li>
          <li><b>倾向</b> ${esc(c.decision_tendency)}</li>
          <li><b>成长</b> ${esc(c.growth_seed)}</li>
        </ul>
      </details>
    `;
  }

  function buildYearDots() {
    const indicator = document.getElementById('page-indicator');
    indicator.innerHTML = '';
    STORY.years.forEach((node, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot' + (node.is_pivotal ? ' key' : '');
      dot.title = `第 ${node.year} 年 · ${node.title}`;
      dot.setAttribute('aria-label', dot.title);
      dot.onclick = () => goToPage(YEAR_START + i);
      indicator.appendChild(dot);
    });
    const finalDot = document.createElement('button');
    finalDot.type = 'button';
    finalDot.className = 'dot';
    finalDot.title = '七年后的回信';
    finalDot.setAttribute('aria-label', finalDot.title);
    finalDot.onclick = () => goToPage(FINAL_PAGE);
    indicator.appendChild(finalDot);
  }

  function buildLandingYearDots() {
    const container = document.getElementById('year-dots-landing');
    container.innerHTML = '';
    STORY.years.forEach((node, i) => {
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
    const target = Math.max(0, Math.min(totalPages - 1, n));
    if (target === currentPage) return;

    const direction = target > currentPage ? 1 : -1;
    const scenarioKey = Sc?.scenarioForPage(target, STORY) || 'academic';

    const run = () => {
      currentPage = target;
      applyPageTransform();
    };

    const after = () => {
      Sc?.applyScenario(scenarioKey);
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

  function updateNav() {
    const isLanding = currentPage === LANDING_PAGE;
    document.getElementById('nav-back').classList.toggle('visible', !isLanding);
    document.getElementById('page-indicator').classList.toggle('visible', !isLanding);
    document.getElementById('source-tag').classList.toggle('visible', !isLanding);

    const prev = document.getElementById('nav-prev');
    const next = document.getElementById('nav-next');
    if (isLanding) {
      prev.classList.remove('visible');
      next.classList.remove('visible');
    } else {
      prev.classList.add('visible');
      next.classList.add('visible');
      prev.classList.toggle('hidden', currentPage <= YEAR_START);
      next.classList.toggle('hidden', currentPage >= FINAL_PAGE);
    }

    document.querySelectorAll('#page-indicator .dot').forEach((dot, i) => {
      dot.classList.toggle('active', (currentPage - YEAR_START) === i);
    });
  }

  async function onPageEnter(pageIdx) {
    if (pageIdx < YEAR_START || pageIdx > FINAL_PAGE - 1) return;
    const yearIdx = pageIdx - YEAR_START;
    const rawYear = STORY.years[yearIdx];
    if (!rawYear) return;

    const year = normalizeYear(rawYear);

    if (ShadowAgents.fate.enabled) {
      const last = userInterventions.filter(u => u.year < year.year).pop() || null;
      const result = await ShadowAgents.fate.onYearEnter({
        story: STORY,
        year,
        beats: STORY.beats,
        beat: getBeatForYear(year.year),
        yearIndex: yearIdx,
        lastIntervention: last
      });
      applyFateSlot(year.year, result);
    }

    if (window.ShadowVisual) {
      window.ShadowVisual.paintYear(year.year, year.year, year);
    }

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
    const year = STORY.years[yearIdx];
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
      const year = normalizeYear(STORY.years[yearIdx]);
      const result = await ShadowAgents.fate.onIntervention({
        story: STORY,
        year,
        beats: STORY.beats,
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
    const rawYear = STORY.years[yearIdx];
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
          story: STORY,
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
    const slider = document.getElementById('slider');
    STORY.years.forEach(y => slider.appendChild(buildYearPage(y)));
    slider.appendChild(buildFinalPage());

    buildLandingProfile();
    buildYearDots();
    buildLandingYearDots();
    bindGlobalEvents();
    updateNav();

    T.spawnAmbientParticles(document.getElementById('ambient-particles'), 14);
    Sc?.applyScenario(STORY.scenario_primary || 'academic');
    T.initLanding();

    window.ShadowDemo.goToPage = goToPage;
    window.ShadowDemo.getInterventions = () => [...userInterventions];
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
