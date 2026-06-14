'use strict';

/**
 * Shadow Demo — BGM (One Way Ticket) + pixel UI SFX via Web Audio API
 */
(function initShadowAudio(global) {
  const BGM_URL = 'audio/one-way-ticket.mp3';
  const BGM_VOLUME = 0.2;
  const STORAGE_MUTE = 'shadow_audio_muted';

  let bgm = null;
  let ctx = null;
  let unlocked = false;
  let muted = false;

  function prefersReducedMotion() {
    return global.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function loadMute() {
    try {
      muted = global.localStorage?.getItem(STORAGE_MUTE) === '1';
    } catch (_) {
      muted = false;
    }
  }

  function saveMute() {
    try {
      global.localStorage?.setItem(STORAGE_MUTE, muted ? '1' : '0');
    } catch (_) { /* ignore */ }
  }

  function getCtx() {
    if (!ctx) {
      const Ctx = global.AudioContext || global.webkitAudioContext;
      if (Ctx) ctx = new Ctx();
    }
    return ctx;
  }

  function unlock() {
    if (unlocked || prefersReducedMotion()) return;
    unlocked = true;
    const ac = getCtx();
    if (ac?.state === 'suspended') ac.resume();
    if (!muted) startBgm();
  }

  function ensureBgm() {
    if (bgm) return bgm;
    bgm = new Audio(BGM_URL);
    bgm.loop = true;
    bgm.volume = BGM_VOLUME;
    bgm.preload = 'auto';
    return bgm;
  }

  function startBgm() {
    if (muted || prefersReducedMotion()) return;
    const el = ensureBgm();
    const p = el.play();
    if (p?.catch) p.catch(() => {});
  }

  function stopBgm() {
    if (!bgm) return;
    bgm.pause();
    try {
      bgm.currentTime = 0;
    } catch (_) { /* ignore */ }
  }

  function setMuted(next) {
    muted = Boolean(next);
    saveMute();
    if (muted) stopBgm();
    else if (unlocked) startBgm();
    syncToggleUi();
  }

  function toggleMute() {
    setMuted(!muted);
    if (!muted) playUiClick();
  }

  function tone(freq, durationSec, opts = {}) {
    if (muted || prefersReducedMotion()) return;
    const ac = getCtx();
    if (!ac) return;

    const {
      type = 'square',
      gain = 0.06,
      attack = 0.008,
      release = 0.12,
      detune = 0
    } = opts;

    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t0 + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec + release);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + durationSec + release + 0.02);
  }

  function playUiClick() {
    unlock();
    tone(520, 0.04, { type: 'square', gain: 0.045, release: 0.08 });
  }

  function playOptionHover() {
    unlock();
    tone(660, 0.03, { type: 'sine', gain: 0.028, release: 0.06 });
  }

  function playOptionSelect() {
    unlock();
    tone(523.25, 0.07, { type: 'square', gain: 0.055, release: 0.1 });
    global.setTimeout(() => {
      tone(659.25, 0.09, { type: 'square', gain: 0.05, release: 0.14 });
    }, 70);
  }

  function playModalOpen() {
    unlock();
    tone(392, 0.05, { type: 'triangle', gain: 0.04, release: 0.1 });
    global.setTimeout(() => {
      tone(523.25, 0.08, { type: 'triangle', gain: 0.045, release: 0.12 });
    }, 55);
  }

  function playPageTurn() {
    unlock();
    tone(440, 0.035, { type: 'sine', gain: 0.03, release: 0.07 });
  }

  function bindOptionButton(btn) {
    if (!btn || btn.dataset.shadowAudioBound) return;
    btn.dataset.shadowAudioBound = '1';
    btn.addEventListener('mouseenter', playOptionHover, { passive: true });
    btn.addEventListener('focus', playOptionHover);
    btn.addEventListener('click', playOptionSelect);
  }

  function syncToggleUi() {
    const btn = global.document?.getElementById('audio-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    btn.title = muted ? '开启音乐与音效' : '静音';
    btn.textContent = muted ? '🔇' : '🔊';
  }

  function mountToggle() {
    const doc = global.document;
    if (!doc || doc.getElementById('audio-toggle')) return;

    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.id = 'audio-toggle';
    btn.className = 'audio-toggle';
    btn.setAttribute('aria-label', '音乐与音效开关');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      unlock();
      toggleMute();
    });
    doc.body.appendChild(btn);
    syncToggleUi();
  }

  function wireGlobalUnlock() {
    const once = () => unlock();
    global.document?.addEventListener('pointerdown', once, { once: true, passive: true });
    global.document?.addEventListener('keydown', once, { once: true });
  }

  loadMute();
  wireGlobalUnlock();

  global.ShadowAudio = {
    unlock,
    startBgm,
    stopBgm,
    setMuted,
    toggleMute,
    playUiClick,
    playOptionHover,
    playOptionSelect,
    playModalOpen,
    playPageTurn,
    bindOptionButton,
    mountToggle
  };
})(window);
