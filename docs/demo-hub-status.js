'use strict';

(function initHubStatus() {
  const root = document.getElementById('hub-status');
  if (!root) return;

  const dot = root.querySelector('.hub-status-dot');
  const text = root.querySelector('.hub-status-text');
  const ctaFoot = document.querySelector('.cta-foot');

  const host = window.location.hostname;
  const onGitHubPages = /\.github\.io$/i.test(host);
  const onLocalhost = host === 'localhost' || host === '127.0.0.1';
  const apiPrefix = window.SHADOW_BASE_PREFIX || '';

  function setState(tone, message) {
    root.classList.remove('is-ok', 'is-warn', 'is-off');
    root.classList.add(tone);
    if (dot) dot.setAttribute('aria-hidden', tone === 'is-off' ? 'true' : 'false');
    if (text) text.innerHTML = message;
  }

  function ragLabel(rag) {
    if (!rag?.enabled) return 'RAG 关';
    if (rag.mode === 'hybrid') return 'RAG 向量';
    if (rag.local_chunks) return 'RAG 规则索引';
    return 'RAG 待命';
  }

  function providerLabel(provider) {
    return (
      {
        deepseek: 'DeepSeek',
        stepfun: '阶跃',
        dashscope: '通义',
        anthropic: 'Claude',
        openai: 'OpenAI'
      }[provider] || provider || 'LLM'
    );
  }

  function showPagesPreviewHint() {
    setState(
      'is-warn',
      '● GitHub Pages 预览 · 下方四条故事 <a href="demo.html?story=linwan">Mock 秒开</a> · ' +
        '<a href="generate.html">采集与生成</a> 可规则合成七年 · 真 LLM 生成：本地 <code>npm run demo:local</code> → ' +
        '<a href="http://localhost:3000/">localhost:3000</a>'
    );
    if (ctaFoot) {
      ctaFoot.textContent =
        'Pages 静态站 · 填写后可规则合成 · 接入 DeepSeek 真生成请 clone 后 npm run demo:local';
    }
  }

  function showLocalStaticHint() {
    setState(
      'is-off',
      '○ 静态预览（无 API）· 故事 Mock 可玩 · 真生成请 <code>npm run demo:local</code> → ' +
        '<a href="http://localhost:3000/">localhost:3000</a>'
    );
  }

  const hasIntake = Boolean(sessionStorage.getItem('shadow_persona'));

  fetch(`${apiPrefix}/api/health`, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then(d => {
      const rag = ragLabel(d.rag);
      if (d.has_key) {
        const model = d.model_override || '默认模型';
        const llm = `${providerLabel(d.provider)} · ${model}`;
        const intakeHint = hasIntake
          ? ' · 已采集人格 · <a href="generate.html">继续生成</a>'
          : ' · <a href="generate.html">写岔路口</a> 可走真生成';
        setState('is-ok', `● API 已连接 · ${llm} · ${rag}${intakeHint}`);
        return;
      }
      setState(
        'is-warn',
        `● 服务在线 · Mock 模式（未配置 Key）· ${rag} · 预设故事可秒开 · <a href="generate.html">采集页</a> 走规则合成`
      );
    })
    .catch(() => {
      if (onGitHubPages) showPagesPreviewHint();
      else if (onLocalhost) showLocalStaticHint();
      else showLocalStaticHint();
    });
})();
