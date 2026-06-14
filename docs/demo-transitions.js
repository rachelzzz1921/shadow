/**
 * Shadow Demo — 拟人化场景过场（编排：演员退场 → 像素翻页 → 轻量入场）
 */
'use strict';

(function initShadowTransitions() {
  const WIPE_COLS = 20;
  const WIPE_ROWS = 12;
  const ACTOR_COVER_MS = 480;
  const ACTOR_EXIT_MS = 180;
  const ACTOR_REVEAL_MS = 320;
  const WIPE_MS = 440;
  const STAGGER_MS = 48;

  let wipeRoot = null;
  let actorRoot = null;
  let busy = false;
  let transitionGen = 0;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function ensureWipe() {
    if (wipeRoot) return wipeRoot;
    wipeRoot = document.createElement('div');
    wipeRoot.id = 'pixel-wipe';
    wipeRoot.className = 'pixel-wipe';
    wipeRoot.setAttribute('aria-hidden', 'true');
    const grid = document.createElement('div');
    grid.className = 'pixel-wipe-grid';
    for (let i = 0; i < WIPE_COLS * WIPE_ROWS; i++) {
      const block = document.createElement('span');
      block.className = 'pixel-wipe-block';
      block.style.setProperty('--col', String(i % WIPE_COLS));
      block.style.setProperty('--row', String(Math.floor(i / WIPE_COLS)));
      grid.appendChild(block);
    }
    wipeRoot.appendChild(grid);
    document.body.appendChild(wipeRoot);
    return wipeRoot;
  }

  function ensureActorStage() {
    if (actorRoot) return actorRoot;
    actorRoot = document.createElement('div');
    actorRoot.id = 'actor-transition';
    actorRoot.setAttribute('aria-hidden', 'true');
    actorRoot.innerHTML = `
      <div class="actor-vignette" aria-hidden="true"></div>
      <div class="actor-curtain actor-curtain-l"></div>
      <div class="actor-curtain actor-curtain-r"></div>
      <div class="actor-pulse-ring" aria-hidden="true"></div>
      <div class="actor-friend actor-friend-a" aria-hidden="true"></div>
      <div class="actor-friend actor-friend-b" aria-hidden="true"></div>
      <div class="actor-friend actor-friend-c" aria-hidden="true"></div>
      <div class="actor-wave-bubble" aria-hidden="true"></div>
      <div class="actor-stage">
        <div class="actor-stage-floor" aria-hidden="true"></div>
        <div class="actor-body">
          <div class="actor-bubble"></div>
          <div class="actor-sprite"></div>
          <div class="actor-ground"></div>
        </div>
      </div>
    `;
    document.body.appendChild(actorRoot);
    return actorRoot;
  }

  function resetOverlays() {
    if (wipeRoot) wipeRoot.classList.remove('active', 'wipe-in', 'wipe-out');
    if (!actorRoot) return;
    actorRoot.className = '';
    actorRoot.id = 'actor-transition';
    actorRoot.setAttribute('aria-hidden', 'true');
    const body = actorRoot.querySelector('.actor-body');
    const stage = actorRoot.querySelector('.actor-stage');
    const waveBubble = actorRoot.querySelector('.actor-wave-bubble');
    if (body) {
      body.style.display = '';
      body.classList.remove('actor-exiting', 'actor-entering');
    }
    if (stage) stage.classList.remove('actor-exiting', 'actor-entering');
    if (waveBubble) waveBubble.textContent = '';
    actorRoot.querySelectorAll('.actor-friend').forEach(f => {
      f.style.backgroundImage = '';
      f.classList.remove('actor-exiting');
    });
  }

  const FALLBACK_THEME = {
    transition: 'walk',
    walkLine: '',
    walkLineBack: '',
    sprite: { sheet: 'visual-assets/coolschool_B.png', pos: '-240px -672px', size: '48px 48px' }
  };

  function resolveTheme(scenarioKey) {
    return window.ShadowScenarios?.getTheme(scenarioKey || 'academic') || FALLBACK_THEME;
  }

  function usesWipe(mode) {
    return ['walk', 'commute', 'step'].includes(mode);
  }

  function playWipe(phase, direction) {
    return new Promise(resolve => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }
      const el = ensureWipe();
      el.dataset.dir = direction >= 0 ? 'fwd' : 'back';
      el.dataset.phase = phase;
      el.classList.remove('wipe-in', 'wipe-out');
      void el.offsetWidth;
      el.classList.add('active', phase === 'in' ? 'wipe-in' : 'wipe-out');
      setTimeout(() => {
        el.classList.remove('wipe-in', 'wipe-out');
        if (phase === 'out') el.classList.remove('active');
        resolve();
      }, WIPE_MS + 60);
    });
  }

  function applySpriteEl(el, sprite, extraPos) {
    if (!el || !sprite) return;
    if (typeof sprite === 'string') {
      el.style.backgroundImage = `url('${sprite}')`;
      el.style.backgroundSize = '';
      el.style.backgroundPosition = extraPos || '';
      return;
    }
    el.style.backgroundImage = `url('${sprite.sheet}')`;
    el.style.backgroundSize = sprite.size || '48px 48px';
    el.style.backgroundPosition = extraPos || sprite.pos || '0 0';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.imageRendering = 'pixelated';
  }

  function prepareActor(theme, phase, direction) {
    const mode = theme?.transition || 'walk';
    const el = ensureActorStage();
    const bubble = el.querySelector('.actor-bubble');
    const waveBubble = el.querySelector('.actor-wave-bubble');
    const sprite = el.querySelector('.actor-sprite');
    const body = el.querySelector('.actor-body');
    const stage = el.querySelector('.actor-stage');
    const friends = el.querySelectorAll('.actor-friend');

    el.className = '';
    el.id = 'actor-transition';
    el.classList.add('active', `mode-${mode}`, phase);
    el.setAttribute('aria-hidden', 'false');

    if (sprite) applySpriteEl(sprite, theme.sprite);

    const line = phase === 'cover'
      ? (direction >= 0 ? theme.walkLine : theme.walkLineBack)
      : (direction >= 0 ? theme.walkLineBack : theme.walkLine);

    if (mode === 'wave') {
      if (body) body.style.display = 'none';
      if (waveBubble) waveBubble.textContent = line;
      friends.forEach((f, i) => {
        const base = theme.sprite?.pos || '0 0';
        const parts = base.split(/\s+/);
        const x = parseInt(parts[0], 10) - i * 48;
        applySpriteEl(f, theme.sprite, `${x}px ${parts[1] || '0'}`);
      });
    } else {
      if (body) body.style.display = '';
      if (bubble) bubble.textContent = line;
      if (waveBubble) waveBubble.textContent = '';
    }

    body?.classList.remove('actor-exiting', 'actor-entering');
    stage?.classList.remove('actor-exiting', 'actor-entering');
    el.classList.toggle('actor-on', phase === 'cover' || phase === 'reveal');

    return { el, mode, body, stage };
  }

  /** 演员 cover：只在底部舞台，不挡全屏 */
  function playActorCover(theme, direction) {
    return new Promise(resolve => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }
      const { mode, stage } = prepareActor(theme, 'cover', direction);
      const ms = mode === 'door' ? 640 : mode === 'wave' ? 680 : ACTOR_COVER_MS;
      setTimeout(resolve, ms + 40);
    });
  }

  /** 演员退场：在 wipe 开始前淡出，避免双层遮挡 */
  function playActorExit(theme) {
    return new Promise(resolve => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }
      const el = actorRoot;
      if (!el) {
        resolve();
        return;
      }
      const mode = theme?.transition || 'walk';
      el.classList.add('actor-exiting');
      el.querySelector('.actor-body')?.classList.add('actor-exiting');
      el.querySelector('.actor-stage')?.classList.add('actor-exiting');
      el.querySelectorAll('.actor-friend').forEach(f => f.classList.add('actor-exiting'));

      const ms = mode === 'door' ? 480 : mode === 'wave' ? 360 : ACTOR_EXIT_MS;
      setTimeout(() => {
        el.classList.remove('active', 'actor-on', 'actor-exiting');
        resolve();
      }, ms + 30);
    });
  }

  /** 轻量 reveal：新页入场前的短促演员探头 */
  function playActorReveal(theme, direction) {
    return new Promise(resolve => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }
      const mode = theme?.transition || 'walk';
      if (mode === 'door' || mode === 'pulse') {
        prepareActor(theme, 'reveal', direction);
        const ms = mode === 'door' ? 560 : 420;
        setTimeout(() => {
          actorRoot?.classList.remove('active', 'actor-on');
          resolve();
        }, ms + 30);
        return;
      }

      const { body, stage } = prepareActor(theme, 'reveal', direction);
      body?.classList.add('actor-entering');
      stage?.classList.add('actor-entering');
      setTimeout(() => {
        actorRoot?.classList.remove('active', 'actor-on');
        body?.classList.remove('actor-entering');
        stage?.classList.remove('actor-entering');
        resolve();
      }, ACTOR_REVEAL_MS + 30);
    });
  }

  /**
   * @param {() => void} mutateDom
   * @param {number} direction
   * @param {string} [scenarioKey]
   * @returns {Promise<boolean>}
   */
  async function pageTransition(mutateDom, direction, scenarioKey) {
    const gen = ++transitionGen;

    if (busy) {
      resetOverlays();
      mutateDom();
      busy = false;
      return true;
    }

    const theme = resolveTheme(scenarioKey);
    const mode = theme.transition || 'walk';
    const withWipe = usesWipe(mode);

    if (prefersReducedMotion()) {
      mutateDom();
      return true;
    }

    busy = true;
    resetOverlays();

    try {
      window.ShadowScenarios?.applyScenario(scenarioKey || 'academic');

      await playActorCover(theme, direction);
      if (gen !== transitionGen) return true;

      if (withWipe) {
        await playActorExit(theme);
        if (gen !== transitionGen) return true;
        await playWipe('in', direction);
        if (gen !== transitionGen) return true;
      } else if (mode === 'door') {
        await wait(120);
        if (gen !== transitionGen) return true;
        mutateDom();
        await playActorReveal(theme, direction);
        return true;
      } else if (mode === 'pulse' || mode === 'wave') {
        await playActorExit(theme);
        if (gen !== transitionGen) return true;
      }

      if (withWipe || mode === 'pulse' || mode === 'wave') {
        mutateDom();
        await wait(16);
        if (gen !== transitionGen) return true;
        if (withWipe) await playWipe('out', direction);
      }

      return true;
    } catch (err) {
      console.error('[ShadowTransitions]', err);
      if (gen === transitionGen) mutateDom();
      return true;
    } finally {
      if (gen === transitionGen) {
        busy = false;
        resetOverlays();
      }
    }
  }

  function revealEnterItems(root) {
    if (!root) return;
    root.querySelectorAll('.enter-item').forEach(el => {
      el.classList.add('enter-active');
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.animation = 'none';
    });
  }

  function staggerEnter(root) {
    if (!root) return;

    const items = root.querySelectorAll('.enter-item');
    if (prefersReducedMotion()) {
      revealEnterItems(root);
      return;
    }

    items.forEach((el, idx) => {
      el.classList.remove('enter-active');
      el.style.opacity = '';
      el.style.transform = '';
      el.style.animation = '';
      el.style.animationDelay = `${idx * STAGGER_MS}ms`;
      void el.offsetWidth;
      el.classList.add('enter-active');
    });

    const scene = root.querySelector('.pixel-scene');
    if (scene) {
      scene.classList.remove('scene-enter');
      void scene.offsetWidth;
      scene.classList.add('scene-enter');
    }

    const sprite = root.querySelector('.sprite-wrap');
    if (sprite) {
      sprite.classList.remove('sprite-enter');
      void sprite.offsetWidth;
      sprite.classList.add('sprite-enter');
    }

    const fallbackMs = items.length * STAGGER_MS + 640;
    setTimeout(() => {
      items.forEach(el => {
        if (parseFloat(getComputedStyle(el).opacity) < 0.5) {
          el.classList.add('enter-active');
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
    }, fallbackMs);
  }

  function initLanding() {
    const landing = document.getElementById('p-landing');
    if (!landing || prefersReducedMotion()) return;
    window.ShadowScenarios?.applyScenario(
      window.ShadowDemo?.STORY?.scenario_primary || 'academic'
    );
    staggerEnter(landing);
  }

  function spawnAmbientParticles(container, count) {
    if (!container || prefersReducedMotion()) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'ambient-particle';
      p.style.left = `${6 + Math.random() * 88}%`;
      p.style.animationDuration = `${5 + Math.random() * 6}s`;
      p.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(p);
    }
  }

  function modalOpen(overlay, kind) {
    if (!overlay) return;
    overlay.hidden = false;
    overlay.dataset.modal = kind;
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      const panel = overlay.querySelector('.modal-cutin');
      if (panel) {
        panel.classList.remove('cutin-active');
        void panel.offsetWidth;
        panel.classList.add('cutin-active');
      }
    });
  }

  function modalClose(overlay) {
    if (!overlay) return;
    overlay.classList.remove('open');
    const panel = overlay.querySelector('.modal-cutin');
    if (panel) panel.classList.remove('cutin-active');
    const wait = prefersReducedMotion() ? 0 : 280;
    setTimeout(() => {
      if (!overlay.classList.contains('open')) overlay.hidden = true;
    }, wait);
  }

  window.ShadowTransitions = {
    pageTransition,
    staggerEnter,
    initLanding,
    spawnAmbientParticles,
    modalOpen,
    modalClose,
    prefersReducedMotion
  };
})();
