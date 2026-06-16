'use strict';

/**
 * 生成页逐年对话 — 某年完成即可与影子聊，下一年生成时可继续聊已完成的年。
 */
(function () {
  const ShadowAgents = window.ShadowDemo?.ShadowAgents;

  let activeYear = null;
  let turns = [];
  let busy = false;
  let storyCtx = null;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function pickFragment(text, max = 9) {
    const parts = String(text || '')
      .replace(/[，。！？、；：…—\s「」『』""''（）()]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    return (parts[0] || String(text || '')).slice(0, max);
  }

  function localSuggest(year, t) {
    const asked = new Set(t.filter((x) => x.role !== 'shadow').map((x) => x.text));
    const lastShadow = t.slice().reverse().find((x) => x.role === 'shadow');
    const out = [];
    if (lastShadow?.text) {
      const frag = pickFragment(lastShadow.text);
      if (frag) out.push(`你说的「${frag}」，后来呢？`);
    }
    if (year?.title) out.push(`「${year.title}」那年，最难熬的是哪一刻？`);
    if (year?.is_pivotal) out.push('那个岔路口，你有过一秒想反悔吗？');
    const generic = [
      '那一刻，你身边有人懂你吗？',
      '能给那年的我带一句话，你会说什么？',
      '有没有一个人，你一直没机会说谢谢？'
    ];
    return out.concat(generic).filter((q) => !asked.has(q)).slice(0, 4);
  }

  function renderTurns() {
    const box = $('gen-dlg-turns');
    if (!box) return;
    box.innerHTML = turns
      .map((t) => {
        const cls = t.role === 'user' ? 'gen-dlg-user' : 'gen-dlg-shadow';
        const who = t.role === 'user' ? '你' : '影';
        return `<div class="gen-dlg-turn ${cls}"><span class="gen-dlg-who">${who}</span><p>${escapeHtml(t.text)}</p></div>`;
      })
      .join('');
    box.scrollTop = box.scrollHeight;
  }

  function setBusy(on) {
    busy = on;
    const input = $('gen-dlg-input');
    const send = $('gen-dlg-send');
    if (input) input.disabled = on;
    if (send) send.disabled = on;
    document.querySelectorAll('#gen-dlg-suggest .dlg-suggest-chip').forEach((c) => {
      if (!c.dataset.used) c.disabled = on;
    });
  }

  function syncStoryCtx(ctx, year) {
    storyCtx = ctx || storyCtx;
    window.ShadowDemo = window.ShadowDemo || {};
    window.ShadowDemo.STORY = {
      persona_card: storyCtx?.persona_card || null,
      memory_stream: storyCtx?.memory_stream || [],
      years: storyCtx?.years || (year ? [year] : []),
      profile: storyCtx?.profile || {}
    };
  }

  async function refreshSuggest() {
    const box = $('gen-dlg-suggest');
    if (!box || !activeYear) return;
    box.hidden = false;
    box.classList.add('dlg-suggest-loading');
    box.innerHTML = '<span class="dlg-suggest-hint">影子在想，你大概还想问…</span>';

    let questions = [];
    const lastShadow = turns.slice().reverse().find((x) => x.role === 'shadow');
    try {
      if (ShadowAgents?.dialogue?.enabled && typeof ShadowAgents.dialogue.suggest === 'function') {
        const out = await ShadowAgents.dialogue.suggest({
          year: activeYear,
          atYear: activeYear.year,
          turns,
          lastReply: lastShadow?.text || activeYear.shadow_dialogue || ''
        });
        questions = out?.questions || [];
      }
    } catch (err) {
      console.warn('[generate-dialogue suggest]', err.message);
    }
    if (!questions.length) questions = localSuggest(activeYear, turns);

    box.classList.remove('dlg-suggest-loading');
    box.innerHTML = '';
    const asked = new Set(turns.filter((t) => t.role !== 'shadow').map((t) => t.text));
    questions.filter((q) => q && !asked.has(q)).slice(0, 4).forEach((q) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'dlg-suggest-chip';
      chip.textContent = q;
      chip.addEventListener('click', () => {
        if (busy) return;
        chip.dataset.used = '1';
        chip.disabled = true;
        void ask(q);
      });
      box.appendChild(chip);
    });
    if (!box.childElementCount) box.hidden = true;
  }

  async function ask(text) {
    const q = String(text || '').trim();
    if (!q || !activeYear || busy) return;
    turns.push({ role: 'user', text: q });
    renderTurns();
    setBusy(true);

    let reply = activeYear.shadow_dialogue || '……';
    try {
      if (ShadowAgents?.dialogue?.enabled && typeof ShadowAgents.dialogue.ask === 'function') {
        const live = await ShadowAgents.dialogue.ask({
          year: activeYear,
          userQuestion: q,
          turns
        });
        reply = live?.reply || reply;
      }
    } catch (err) {
      console.warn('[generate-dialogue ask]', err.message);
    }

    turns.push({ role: 'shadow', text: reply });
    renderTurns();
    setBusy(false);
    await refreshSuggest();
  }

  function bindOnce() {
    const send = $('gen-dlg-send');
    const input = $('gen-dlg-input');
    if (!send || send.dataset.bound) return;
    send.dataset.bound = '1';
    send.addEventListener('click', () => {
      const v = input?.value?.trim();
      if (!v) return;
      if (input) input.value = '';
      void ask(v);
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send.click();
      }
    });
  }

  function openForYear(year, ctx) {
    bindOnce();
    syncStoryCtx(ctx, year);
    activeYear = year;
    turns = [];
    const panel = $('gen-year-dialogue');
    const label = $('gen-dlg-year-label');
    if (label) {
      label.textContent = `第 ${year.year} 年 · ${year.title || '影子'} — 生成间隙可聊`;
    }
    show(panel);
    renderTurns();
    void refreshSuggest();
  }

  function show(el) {
    el?.classList.remove('gen-hidden');
  }

  function hide() {
    $('gen-year-dialogue')?.classList.add('gen-hidden');
  }

  window.ShadowGenerateDialogue = {
    openForYear,
    hide,
    getTurns: () => turns.slice(),
    getActiveYear: () => activeYear
  };
})();
