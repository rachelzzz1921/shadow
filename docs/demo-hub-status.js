'use strict';

/** 首页状态条：仅面向访客的轻提示，不暴露 API / Mock / 部署细节 */
(function initHubStatus() {
  const root = document.getElementById('hub-status');
  if (!root) return;

  const text = root.querySelector('.hub-status-text');
  const apiPrefix = window.SHADOW_BASE_PREFIX || '';

  function setState(tone, message) {
    root.classList.remove('is-ok', 'is-warn', 'is-off');
    root.classList.add(tone);
    if (text) text.innerHTML = message;
  }

  function hideBar() {
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
  }

  let hasIntake = false;
  try {
    hasIntake = Boolean(sessionStorage.getItem('shadow_persona'));
  } catch (_) { /* ignore */ }

  fetch(`${apiPrefix}/api/health`, { cache: 'no-store' })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then((d) => {
      if (d.has_key) {
        const intakeHint = hasIntake
          ? ' · <a href="generate.html">继续书写你的七年</a>'
          : ' · <a href="generate.html">从岔路口开始</a>';
        setState('is-ok', `● 影子在线，可以为你书写平行人生${intakeHint}`);
        return;
      }
      hideBar();
    })
    .catch(() => {
      hideBar();
    });
})();
