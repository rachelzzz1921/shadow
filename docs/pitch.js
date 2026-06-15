'use strict';

(function initShadowPitch() {
  const PAGES = [
    { id: 'intro', label: '入内', hint: '从此看起' },
    { id: 'problem', label: '困局', hint: '为何要做' },
    { id: 'pipeline', label: '管线', hint: '五步成文', step: 1 },
    { id: 'harness', label: '底座', hint: '七阶 Harness', step: 2 },
    { id: 'intervention', label: '介入', hint: '岔路口', step: 3 },
    { id: 'quality', label: '质量', hint: '三道门' },
    { id: 'stories', label: '先例', hint: '样例故事' },
    { id: 'start', label: '起行', hint: '即刻体验', cta: true },
  ];

  const NAV_GROUPS = [
    { id: 'intro', label: '入门', indices: [0, 1] },
    { id: 'core', label: '主线', indices: [2, 3, 4] },
    { id: 'depth', label: '延伸', indices: [5, 6] },
    { id: 'action', label: '开玩', indices: [7] },
  ];

  const STEP_MARK = ['壹', '贰', '叁'];

  let page = 0;
  let lock = false;
  let dir = null;

  const track = document.getElementById('pitch-track');
  const hintEl = document.getElementById('pitch-hint');
  const hintSub = document.getElementById('pitch-hint-sub');
  const pageEls = () => Array.from(document.querySelectorAll('.pitch-deck-page'));
  const tabsRoot = document.getElementById('pitch-tabs');
  const trailEl = document.getElementById('pitch-trail');
  const countEl = document.getElementById('pitch-count');
  const railEl = document.getElementById('pitch-rail');

  function groupForPage(i) {
    return NAV_GROUPS.find((g) => g.indices.includes(i)) || NAV_GROUPS[0];
  }

  function formatTrail(i) {
    const p = PAGES[i];
    const g = groupForPage(i);
    if (!p) return '';
    const hint = p.hint ? ` · ${p.hint}` : '';
    if (g.label === p.label) return `<b>${p.label}</b>${hint}`;
    return `${g.label} · <b>${p.label}</b>${hint}`;
  }

  function scrollMetrics(el) {
    if (!el) return { canUp: false, canDown: false, overflow: false };
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 2) return { canUp: false, canDown: false, overflow: false };
    return {
      canUp: el.scrollTop > 2,
      canDown: el.scrollTop < max - 2,
      overflow: true,
    };
  }

  function activePageEl() {
    return pageEls()[page] || null;
  }

  function updateHint() {
    const el = activePageEl();
    const { canUp, canDown, overflow } = scrollMetrics(el);
    let text = '上滑 / 下滑翻页';
    let sub = PAGES[page]?.label || '';
    if (overflow) {
      if (canDown) text = '本页继续下滑阅读';
      else if (page < PAGES.length - 1) text = '已到底 · 再滑翻下一页';
      else if (canUp) text = '已到顶 · 再滑回上一页';
      else text = '上滑 / 下滑翻页';
    } else if (window.matchMedia('(min-width: 768px)').matches) {
      text = '↑↓ ←→ 翻页 · 滚轮在边缘翻页';
    }
    if (hintEl) hintEl.textContent = text;
    if (hintSub) hintSub.textContent = sub ? `当前 · ${sub}` : '';
    document.getElementById('btn-prev').disabled = page === 0;
    document.getElementById('btn-next').disabled = page >= PAGES.length - 1;
  }

  function renderNav() {
    if (trailEl) trailEl.innerHTML = formatTrail(page);
    if (countEl) {
      countEl.innerHTML = `<span style="color:var(--ink)">${page + 1}</span> / ${PAGES.length}`;
    }

    if (tabsRoot) {
      tabsRoot.innerHTML = NAV_GROUPS.map((group) => {
        const isActiveGroup = group.indices.includes(page);
        const tabs = group.indices.map((i) => {
          const p = PAGES[i];
          const on = page === i;
          const isPath = group.id === 'core';
          const stepIdx = p.step != null ? p.step - 1 : -1;
          const stepHtml = isPath && stepIdx >= 0
            ? `<span class="pitch-guide-tab-step" aria-hidden="true">${STEP_MARK[stepIdx]}</span>`
            : '';
          return `<button type="button" class="pitch-guide-tab${on ? ' is-active' : ''}${p.cta ? ' is-cta' : ''}" data-page="${i}" aria-current="${on ? 'page' : 'false'}">${stepHtml}${p.label}</button>`;
        }).join('');
        return `<div class="pitch-guide-group${isActiveGroup ? ' is-active-group' : ''}" style="flex:${group.indices.length}"><span class="pitch-guide-group-label">${group.label}</span><div class="pitch-guide-tabs">${tabs}</div></div>`;
      }).join('');

      tabsRoot.querySelectorAll('[data-page]').forEach((btn) => {
        btn.addEventListener('click', () => go(Number(btn.dataset.page)));
      });
    }

    if (railEl) {
      railEl.innerHTML = NAV_GROUPS.map((group) => {
        const segs = group.indices.map((i) => {
          const cls = i === page ? ' is-current' : i < page ? ' is-done' : '';
          return `<span class="pitch-guide-rail-seg${cls}"></span>`;
        }).join('');
        const done = group.indices.every((i) => i < page);
        const active = group.indices.includes(page);
        return `<div class="pitch-guide-rail-block${active ? ' is-active-group' : ''}${done ? ' is-done-group' : ''}" style="flex:${group.indices.length}">${segs}</div>`;
      }).join('');
    }
  }

  function go(next) {
    if (next < 0 || next >= PAGES.length || next === page || lock) return;
    lock = true;
    dir = next > page ? 'next' : 'prev';
    page = next;
    track.classList.remove('is-next', 'is-prev');
    void track.offsetWidth;
    track.classList.add(dir === 'next' ? 'is-next' : 'is-prev');
    track.style.transform = `translate3d(0, -${page * 100}%, 0)`;
    pageEls().forEach((el, i) => {
      el.setAttribute('aria-hidden', i === page ? 'false' : 'true');
      if (i === page) el.scrollTop = 0;
    });
    renderNav();
    updateHint();
    const u = new URL(location.href);
    u.searchParams.set('page', String(page));
    history.replaceState(null, '', u);
    window.setTimeout(() => {
      lock = false;
      dir = null;
    }, 560);
  }

  function next() { go(page + 1); }
  function prev() { go(page - 1); }

  document.getElementById('btn-prev').addEventListener('click', prev);
  document.getElementById('btn-next').addEventListener('click', next);
  document.getElementById('side-prev').addEventListener('click', prev);
  document.getElementById('side-next').addEventListener('click', next);

  document.querySelectorAll('[data-goto]').forEach((el) => {
    el.addEventListener('click', () => go(Number(el.dataset.goto)));
  });

  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      go(PAGES.length - 1);
    }
  });

  const viewport = document.getElementById('pitch-viewport');
  const touch = { y0: 0, x0: 0, mode: 'none' };
  const FLIP = 56;
  const AXIS = 10;

  viewport.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (!t) return;
    touch.y0 = t.clientY;
    touch.x0 = t.clientX;
    touch.mode = 'none';
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t || touch.mode !== 'none') return;
    const dy = t.clientY - touch.y0;
    const dx = t.clientX - touch.x0;
    if (Math.abs(dy) < AXIS && Math.abs(dx) < AXIS) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      touch.mode = 'scroll';
      return;
    }
    const m = scrollMetrics(activePageEl());
    if (dy > 0 && m.canUp) touch.mode = 'scroll';
    else if (dy < 0 && m.canDown) touch.mode = 'scroll';
    else touch.mode = 'page';
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    if (!t || touch.mode !== 'page') {
      touch.mode = 'none';
      return;
    }
    const dy = t.clientY - touch.y0;
    touch.mode = 'none';
    if (Math.abs(dy) < FLIP) return;
    if (dy < 0) next();
    else prev();
  }, { passive: true });

  pageEls().forEach((el) => {
    el.addEventListener('scroll', updateHint, { passive: true });
    el.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const m = scrollMetrics(el);
      if (e.deltaY > 0 && m.canDown) return;
      if (e.deltaY < 0 && m.canUp) return;
      if (e.deltaY > 0 && page < PAGES.length - 1) {
        e.preventDefault();
        next();
      } else if (e.deltaY < 0 && page > 0) {
        e.preventDefault();
        prev();
      }
    }, { passive: false });
  });

  const initial = Number(new URLSearchParams(location.search).get('page'));
  if (Number.isFinite(initial) && initial >= 0 && initial < PAGES.length) {
    page = initial;
    track.style.transform = `translate3d(0, -${page * 100}%, 0)`;
    pageEls().forEach((el, i) => el.setAttribute('aria-hidden', i === page ? 'false' : 'true'));
  }

  renderNav();
  updateHint();
})();
