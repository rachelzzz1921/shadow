'use strict';

/**
 * When Shadow is served under /shadow/ on a shared VPS, API calls must use /shadow/api/…
 * (iching already owns /api/ at the host root).
 */
(function () {
  const match = window.location.pathname.match(/^(\/shadow)(?=\/)/);
  const prefix = match ? match[1] : '';
  if (!prefix) return;

  window.SHADOW_BASE_PREFIX = prefix;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function shadowFetch(input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = prefix + input;
    }
    return nativeFetch(input, init);
  };
})();
