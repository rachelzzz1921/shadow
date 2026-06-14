'use strict';

/** Shadow intake question renderer — LoveCompass patterns, Shadow visual tokens */
(function exportIntakeQuestions(global) {
  const AUTO_MS = 400;

  function tierLabelAt(value, tierLabels) {
    if (!tierLabels?.length) return '';
    const hit = tierLabels.find((t) => value >= t.range[0] && value <= t.range[1]);
    return hit?.label || '';
  }

  function feedbackAt(value, feedback) {
    if (!feedback?.length) return '';
    const hit = feedback.find((f) => value >= f.range[0] && value <= f.range[1]);
    return hit?.text || '';
  }

  function isAnswered(q, payload) {
    if (!payload) return false;
    if (q.kind === 'rank') {
      return Array.isArray(payload.orderedKeys) && payload.orderedKeys.length === (q.options?.length || 0);
    }
    if ('value' in payload) return Number.isFinite(payload.value);
    return Boolean(payload.optionKey);
  }

  function defaultSliderValue(q) {
    const min = q.ui?.min ?? 0;
    const max = q.ui?.max ?? 100;
    return Math.round((min + max) / 2);
  }

  function renderQuestion(container, question, value, { onChange, onCommit }) {
    container.innerHTML = '';
    const wrap = document.createElement('div');

    if (question.ui?.scene) {
      const scene = document.createElement('div');
      scene.className = 'intake-q-scene';
      scene.textContent = question.ui.scene;
      wrap.appendChild(scene);
    }

    if (question.kind === 'slider') {
      wrap.appendChild(renderSlider(question, value, onChange, onCommit));
    } else if (question.kind === 'mood') {
      wrap.appendChild(renderMood(question, value, onChange, onCommit));
    } else if (question.kind === 'rank') {
      wrap.appendChild(renderRank(question, value, onChange, onCommit));
    } else {
      wrap.appendChild(renderOptions(question, value, onChange, onCommit));
    }

    container.appendChild(wrap);
  }

  function renderSlider(q, value, onChange, onCommit) {
    const min = q.ui.min ?? 0;
    const max = q.ui.max ?? 100;
    const hasVal = value && 'value' in value;
    const current = hasVal ? Number(value.value) : defaultSliderValue(q);

    const box = document.createElement('div');
    box.className = 'intake-slider-box';

    const tier = document.createElement('div');
    tier.className = 'intake-slider-tier';
    tier.textContent = tierLabelAt(current, q.ui.tierLabels) || String(current);
    box.appendChild(tier);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(q.ui.step ?? 1);
    input.value = String(current);

    const feedback = document.createElement('p');
    feedback.className = 'intake-slider-feedback';
    feedback.textContent = feedbackAt(current, q.ui.feedback) || '';

    input.addEventListener('input', () => {
      const v = Number(input.value);
      tier.textContent = tierLabelAt(v, q.ui.tierLabels) || String(v);
      feedback.textContent = feedbackAt(v, q.ui.feedback) || '';
      onChange({ value: v });
    });

    input.addEventListener('pointerup', () => {
      onChange({ value: Number(input.value) });
      onCommit?.();
    });

    box.appendChild(input);

    const labels = document.createElement('div');
    labels.className = 'intake-slider-labels';
    labels.innerHTML = `<span>${q.ui.minLabel ?? min}</span><span>${current}</span><span>${q.ui.maxLabel ?? max}</span>`;
    box.appendChild(labels);
    box.appendChild(feedback);

    if (!hasVal) {
      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'intake-btn ghost';
      confirm.style.marginTop = '12px';
      confirm.style.width = '100%';
      confirm.textContent = `确认当前值 · ${tier.textContent}`;
      confirm.addEventListener('click', () => {
        onChange({ value: current });
        onCommit?.();
      });
      box.appendChild(confirm);
    }

    return box;
  }

  function renderMood(q, value, onChange, onCommit) {
    const grid = document.createElement('div');
    grid.className = 'intake-mood-grid';
    for (const cell of q.ui.cells || []) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'intake-opt' + (value?.optionKey === cell.key ? ' active' : '');
      btn.innerHTML = `<span class="intake-opt-key">${cell.key}</span><span class="intake-opt-text">${cell.label}</span>`;
      btn.addEventListener('click', () => {
        onChange({ optionKey: cell.key });
        setTimeout(() => onCommit?.(), AUTO_MS);
      });
      grid.appendChild(btn);
    }
    return grid;
  }

  function renderRank(q, value, onChange, onCommit) {
    const optionCount = q.options?.length || 0;
    const live = { orderedKeys: [...(value?.orderedKeys || [])] };
    const root = document.createElement('div');
    const hint = document.createElement('p');
    hint.className = 'intake-rank-hint';
    hint.textContent = '按优先级依次点击全部选项；选满后自动继续。';
    root.appendChild(hint);

    const buttons = [];

    function paint() {
      for (let i = 0; i < buttons.length; i++) {
        const { btn, opt } = buttons[i];
        const pos = live.orderedKeys.indexOf(opt.key);
        btn.className = 'intake-opt' + (pos >= 0 ? ' active' : '');
        btn.querySelector('.intake-opt-key').textContent = pos >= 0 ? String(pos + 1) : '—';
      }
    }

    for (const opt of q.options || []) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'intake-opt';
      btn.innerHTML = `<span class="intake-opt-key">—</span><span class="intake-opt-text">${opt.text}</span>`;
      btn.addEventListener('click', () => {
        const pos = live.orderedKeys.indexOf(opt.key);
        const next = pos >= 0
          ? live.orderedKeys.filter((k) => k !== opt.key)
          : [...live.orderedKeys, opt.key];
        live.orderedKeys = next;
        onChange({ orderedKeys: next });
        paint();
        if (next.length === optionCount) {
          setTimeout(() => onCommit?.(), AUTO_MS);
        }
      });
      buttons.push({ btn, opt });
      root.appendChild(btn);
    }

    paint();
    return root;
  }

  function renderOptions(q, value, onChange, onCommit) {
    const root = document.createElement('div');
    const binary = q.kind === 'binary';
    for (const opt of q.options || []) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'intake-opt' + (binary ? ' binary' : '') + (value?.optionKey === opt.key ? ' active' : '');
      btn.innerHTML = `<span class="intake-opt-key">${opt.key}</span><span class="intake-opt-text">${opt.text}${opt.sub ? `<span class="intake-opt-sub">${opt.sub}</span>` : ''}</span>`;
      btn.addEventListener('click', () => {
        onChange({ optionKey: opt.key });
        setTimeout(() => onCommit?.(), AUTO_MS);
      });
      root.appendChild(btn);
    }
    return root;
  }

  global.ShadowIntakeQuestions = {
    ...(global.ShadowIntakeQuestions || {}),
    AUTO_MS,
    isAnswered,
    defaultSliderValue,
    renderQuestion
  };
})(window);
