/**
 * Shadow Demo — 拟人化场景过场 + 像素 wipe
 * 六域各一种过场形态（door / walk / pulse / wave / commute / step）
 */
'use strict';

(function initShadowTransitions() {
  const WIPE_COLS = 20;
  const WIPE_ROWS = 12;
  const WIPE_MS = 680;
  const ACTOR_MS = 820;
  const STAGGER_MS = 55;

  let wipeRoot = null;
  let actorRoot = null;
  let busy = false;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      <div class="actor-curtain actor-curtain-l"></div>
      <div class="actor-curtain actor-curtain-r"></div>
      <div class="actor-friend actor-friend-a" aria-hidden="true"></div>
      <div class="actor-friend actor-friend-b" aria-hidden="true"></div>
      <div class="actor-friend actor-friend-c" aria-hidden="true"></div>
      <div class="actor-body">
        <div class="actor-bubble"></div>
        <div class="actor-sprite"></div>
        <div class="actor-ground"></div>
      </div>
    `;
    document.body.appendChild(actorRoot);
    return actorRoot;
  }

  function resetOverlays() {
    if (wipeRoot) wipeRoot.classList.remove('active', 'wipe-in', 'wipe-out');
    if (actorRoot) {
      actorRoot.className = '';
      actorRoot.id = 'actor-transition';
      actorRoot.removeAttribute('aria-hidden');
      actorRoot.setAttribute('aria-hidden', 'true');
    }
  }

  const FALLBACK_THEME = {
    transition: 'walk',
    walkLine: '',
    walkLineBack: '',
    sprite: 'assets/kenney/tiles/tile_0096.png'
  };

  function resolveTheme(scenarioKey) {
    return window.ShadowScenarios?.getTheme(scenarioKey || 'academic') || FALLBACK_THEME;
  }

  function playWipe(phase, direction) {
    return new Promise(resolve => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }
      const el = ensureWipe();
      el.dataset.dir = direction >= 0 ? 'fwd' : 'back';
      el.classList.remove('wipe-in', 'wipe-out');
      void el.offsetWidth;
      if (phase === 'in') {
        el.classList.add('active', 'wipe-in');
      } else {
        el.classList.add('wipe-out');
      }
      setTimeout(() => {
        el.classList.remove('wipe-in', 'wipe-out');
        if (phase === 'out') el.classList.remove('active');
        resolve();
      }, WIPE_MS + 80);
    });
  }

  /**
   * @param {object} theme ShadowScenarios theme
   * @param {'cover'|'reveal'} phase
   * @param {number} direction
   */
  function playActorPhase(theme, phase, direction) {
    return new Promise(resolve => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }
      const mode = theme?.transition || 'walk';
      const el = ensureActorStage();
      const bubble = el.querySelector('.actor-bubble');
      const friends = el.querySelectorAll('.actor-friend');

      el.className = '';
      el.id = 'actor-transition';
      el.classList.add('active', `mode-${mode}`, phase);

      if (mode === 'wave') {
        friends.forEach(f => {
          f.style.backgroundImage = `url('${theme.sprite}')`;
        });
        el.querySelector('.actor-body').style.display = 'none';
      } else {
        el.querySelector('.actor-body').style.display = '';
        if (bubble) {
          bubble.textContent = phase === 'cover'
            ? (direction >= 0 ? theme.walkLine : theme.walkLineBack)
            : (direction >= 0 ? theme.walkLineBack : theme.walkLine);
        }
      }

      if (phase === 'cover') {
        el.classList.add('actor-on');
      } else {
        el.classList.remove('actor-on');
      }

      const ms = mode === 'pulse' ? 680 : ACTOR_MS;
      setTimeout(() => {
        if (phase === 'reveal') {
          el.classList.remove('active', 'actor-on');
        }
        resolve();
      }, ms + 60);
    });
  }

  /**
   * @param {() => void} mutateDom
   * @param {number} direction
   * @param {string} [scenarioKey]
   * @returns {Promise<boolean>} false = skipped (already transitioning)
   */
  async function pageTransition(mutateDom, direction, scenarioKey) {
    if (busy) return false;

    const theme = resolveTheme(scenarioKey);

    if (prefersReducedMotion()) {
      mutateDom();
      return true;
    }

    busy = true;
    resetOverlays();

    try {
      if (window.ShadowScenarios) {
        window.ShadowScenarios.applyScenario(scenarioKey || 'academic');
      }

      await playActorPhase(theme, 'cover', direction);

      const useWipe = ['walk', 'commute', 'step'].includes(theme.transition);
      if (useWipe) await playWipe('in', direction);

      mutateDom();

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      if (useWipe) await playWipe('out', direction);
      await playActorPhase(theme, 'reveal', direction);
      return true;
    } catch (err) {
      console.error('[ShadowTransitions]', err);
      resetOverlays();
      mutateDom();
      return true;
    } finally {
      busy = false;
      resetOverlays();
    }
  }

  function staggerEnter(root) {
    if (!root || prefersReducedMotion()) return;
    root.querySelectorAll('.enter-item').forEach((el, idx) => {
      el.classList.remove('enter-active');
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
  }

  function initLanding() {
    const landing = document.getElementById('p-landing');
    if (!landing || prefersReducedMotion()) return;
    if (window.ShadowScenarios && window.ShadowDemo?.STORY) {
      window.ShadowScenarios.applyScenario(
        window.ShadowDemo.STORY.scenario_primary || 'academic'
      );
    }
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
