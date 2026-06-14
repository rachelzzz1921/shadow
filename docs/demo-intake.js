/**
 * Shadow Intake — 三层采集 UI（vanilla）
 */
'use strict';

(function () {
  const STORAGE_PROFILE = 'shadow_full_profile';
  const STORAGE_PERSONA = 'shadow_persona';

  const state = {
    layer: 'A',
    layerA: { choice: '', self_description: '', one_liner: '', birth_year: null, fork_year: null, age: null },
    picked: {},
    answers: {},
    qIndex: 0,
    qStart: Date.now(),
    openCats: {},
    search: '',
    seed: null,
    domainDetect: { top: null, conf: 0 },
    summary: null,
    summaryStarted: false
  };

  const root = document.getElementById('intake-root');

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function categories() {
    return state.seed?.categories?.filter(c => c.id !== 'scenario_hint') || [];
  }

  function tagsForCat(catId) {
    const q = state.search.trim().toLowerCase();
    return (state.seed?.tags || [])
      .filter(t => t.category_id === catId)
      .filter(t => !q || t.label.toLowerCase().includes(q) || (t.synonyms || []).some(s => s.toLowerCase().includes(q)))
      .map(t => t.label);
  }

  function flatTags() {
    return Object.entries(state.picked).flatMap(([cat, arr]) => arr.map(label => ({ cat, category_id: cat, label })));
  }

  function clarity() {
    let c = 0;
    const a = state.layerA;
    if (a.choice) c += 0.12;
    if (a.self_description) c += 0.1;
    if (a.birth_year && a.fork_year) c += 0.05;
    c += Math.min(Object.values(state.picked).flat().length, 12) / 12 * 0.23;
    c += Object.keys(state.answers).length / 10 * 0.5;
    return Math.min(c, 1);
  }

  function canLayerA() {
    return (state.layerA.choice || '').length >= 20 && state.layerA.birth_year && state.layerA.fork_year && state.layerA.age != null;
  }

  function canLayerB() {
    return (state.picked.trait || []).length >= 1 &&
      (state.picked.mood_at_fork || []).length >= 1 &&
      (state.picked.value || []).length >= 1;
  }

  function updateDomain() {
    const tags = flatTags().map(t => t.label);
    const text = [state.layerA.choice, state.layerA.self_description].join(' ');
    state.domainDetect = window.ShadowIntakeQuestions.detectDomain(text, tags);
  }

  function toggleTag(catId, label, max) {
    const arr = state.picked[catId] || [];
    if (arr.includes(label)) {
      state.picked[catId] = arr.filter(x => x !== label);
    } else if (arr.length < max) {
      state.picked[catId] = [...arr, label];
    }
    updateDomain();
    render();
  }

  function recordAnswer(id, value) {
    state.answers[id] = { value, durationMs: Date.now() - state.qStart };
  }

  function buildProfile() {
    return window.ShadowIntakeProfile.buildFullProfile({
      layerA: {
        choice_text: state.layerA.choice,
        self_description: state.layerA.self_description,
        one_liner: state.layerA.one_liner,
        birth_year: state.layerA.birth_year,
        fork_year: state.layerA.fork_year,
        age_at_fork: state.layerA.age
      },
      selectedTags: flatTags(),
      answersObj: state.answers,
      domainDetect: state.domainDetect
    });
  }

  function shadowReadHtml() {
    const p = state.picked;
    const traits = p.trait || [];
    const fears = p.fear || [];
    const vals = p.value || [];
    const moods = p.mood_at_fork || [];
    const rels = p.relation_pressure || [];
    const any = traits.length || fears.length || vals.length || moods.length || rels.length;
    if (!any) {
      return '<div class="shadow-read-body" style="color:var(--fog)">先选几个标签——这里会实时显示，影子第一眼会怎么读你。</div>';
    }
    const frag = [];
    if (traits.length) frag.push(`你像是${traits.slice(0, 2).join('、')}的人`);
    if (fears.length) frag.push(`怕${fears[0].replace(/^怕/, '')}，所以有些事你说不出口`);
    if (vals.length) frag.push(`取舍时，你下意识护住的是「${vals[0]}」`);
    if (rels.length) frag.push(`而${rels[0]}，让那个决定变得更重`);
    const tail = moods.length ? `那段日子的底色，是${moods[0]}。` : '';
    let extra = '';
    if (traits.includes('好强又自卑') || fears.includes('怕被看穿') || vals.includes('面子')) {
      extra = ' <span style="color:var(--glow)">我们还不确定——你扛着的，到底是你想要的，还是你以为该想要的。</span>';
    }
    return `<div class="shadow-read-body">${esc(frag.join('；'))}。${esc(tail)}${extra}</div>`;
  }

  function renderLayerA() {
    const { EXAMPLES } = window.ShadowIntakeQuestions;
    const ex = EXAMPLES.map(e => `
      <button type="button" class="example-card" data-ex="${esc(e.tag)}">
        <div class="tag">${esc(e.tag)}</div>
        <div class="choice">${esc(e.choice)}</div>
        <div class="desc">${esc(e.desc)}</div>
      </button>`).join('');

    const dom = state.domainDetect.top
      ? `<div class="domain-detect">系统读到这条岔路口可能和 <strong>${esc(window.ShadowIntakeQuestions.DOMAINS[state.domainDetect.top]?.zh || state.domainDetect.top)}</strong> 有关（${Math.round(state.domainDetect.conf * 100)}%）</div>`
      : '';

    return `
      <p class="field-hint">用「如果当年我……而不是……」说出那个岔路口。影子会替你走那条没走的路。</p>
      <div class="example-cards">${ex}</div>
      <div class="field-label">岔路口 <span class="field-req">必填 · ≥20字</span></div>
      <textarea id="f-choice" placeholder="如果当年我……">${esc(state.layerA.choice)}</textarea>
      <div style="height:20px"></div>
      <div class="field-label">那时候的你</div>
      <div class="field-hint">不用漂亮，真实就好</div>
      <textarea id="f-desc" placeholder="我那时候……">${esc(state.layerA.self_description)}</textarea>
      <div style="height:20px"></div>
      <div class="field-label">一句话形容</div>
      <input type="text" id="f-liner" placeholder="再撑一下，撑过去就好了" value="${esc(state.layerA.one_liner)}" />
      <div style="height:24px"></div>
      <div class="field-label">时间锚点</div>
      <div class="year-row">
        <label>出生年<input type="number" id="f-birth" min="1950" max="2015" value="${state.layerA.birth_year ?? ''}" /></label>
        <label>岔路口年<input type="number" id="f-fork" min="1970" max="2030" value="${state.layerA.fork_year ?? ''}" /></label>
        <label>当时年龄<input type="number" id="f-age" min="10" max="80" value="${state.layerA.age ?? ''}" readonly /></label>
      </div>
      ${dom}
      ${nextBar(canLayerA(), canLayerA() ? '' : '填好岔路口（≥20字）和出生/岔路口年份就能继续', 'B')}
    `;
  }

  function renderLayerB() {
    const cats = categories();
    const main = cats.map(cat => {
      const list = tagsForCat(cat.id);
      const n = (state.picked[cat.id] || []).length;
      const open = state.openCats[cat.id] !== false;
      return `
        <div class="tag-cat">
          <button type="button" class="tag-cat-head" data-cat-toggle="${cat.id}">
            <span>${esc(cat.label_zh)} <small style="color:var(--fog)">${esc(cat.description)}</small></span>
            <span style="font-family:var(--mono);font-size:11px;color:${n ? 'var(--glow)' : 'var(--fog)'}">${n}/${cat.max_select}</span>
          </button>
          ${open ? `<div class="tag-pool">${list.map(tag => {
            const on = (state.picked[cat.id] || []).includes(tag);
            const full = n >= cat.max_select && !on;
            return `<button type="button" class="tag-btn${on ? ' on' : ''}" data-tag="${esc(cat.id)}:${esc(tag)}" ${full ? 'disabled' : ''}>${esc(tag)}</button>`;
          }).join('')}</div>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="field-hint" style="margin-bottom:16px">标签库来自 seed_tags.json · 影子需要重点，不需要全部。</div>
      <input type="text" id="tag-search" placeholder="搜索标签…" value="${esc(state.search)}" style="margin-bottom:16px" />
      <div class="tag-layout">
        <div class="tag-main">${main}</div>
        <div class="tag-side">
          <div class="shadow-read">
            <div class="shadow-read-title">影子初读</div>
            ${shadowReadHtml()}
            <div style="margin-top:16px;font-size:11px;color:var(--fog);font-style:italic">这只是初步印象，真正的影子会在 Persona agent 里被推导成形。</div>
          </div>
        </div>
      </div>
      ${nextBar(canLayerB(), canLayerB() ? '' : '性格 / 心情 / 价值 各至少选 1 个', 'C', 'A')}
    `;
  }

  function renderQuestion(q) {
    const { SECTIONS, QUESTIONS } = window.ShadowIntakeQuestions;
    const i = state.qIndex;
    const cur = state.answers[q.id]?.value;

    let body = '';
    if (q.kind === 'binary') {
      body = `<div class="opt-row">${q.options.map(o => `
        <button type="button" class="opt-btn big${cur === o.key ? ' on' : ''}" data-q="${q.id}" data-val="${o.key}">
          <div class="opt-text">${esc(o.text)}</div>
          <div class="opt-sub">${esc(o.sub)}</div>
        </button>`).join('')}</div>`;
    } else if (q.kind === 'choice' || q.kind === 'scenario') {
      body = `<div class="opt-grid">${q.options.map(o => `
        <button type="button" class="opt-btn${cur === o.key ? ' on' : ''}" data-q="${q.id}" data-val="${o.key}">
          <span class="opt-key">${o.key}</span>
          <div><div class="opt-text">${esc(o.text)}</div><div class="opt-sub">${esc(o.sub)}</div></div>
        </button>`).join('')}</div>`;
    } else if (q.kind === 'slider') {
      const v = cur ?? Math.round((q.min + q.max) / 2);
      const tier = q.tiers.find(([a, b]) => v >= a && v <= b)?.[2] || '';
      const fb = q.feedback.find(([a, b]) => v >= a && v <= b)?.[2] || '';
      body = `
        <div class="slider-wrap">
          <div class="slider-labels"><span>${esc(q.left)}</span><span>${esc(q.right)}</span></div>
          <div class="slider-val" id="slider-val">${v}</div>
          <div class="slider-tier" id="slider-tier">${esc(tier)}</div>
          <input type="range" id="slider-input" min="${q.min}" max="${q.max}" value="${v}" data-q="${q.id}" />
          <div class="slider-fb" id="slider-fb">${esc(fb)}</div>
          <p style="text-align:center;font-size:11px;color:var(--fog);font-family:var(--mono)">松手即记录 · 自动进入下一题</p>
        </div>`;
    } else if (q.kind === 'mood') {
      body = `<div class="mood-grid">${q.cells.map(c => `
        <button type="button" class="mood-cell${cur === c.key ? ' on' : ''}" data-q="${q.id}" data-val="${c.key}">
          <div style="font-size:19px;margin-bottom:8px">${esc(c.label)}</div>
          <div style="font-family:var(--mono);font-size:10.5px;color:var(--fog)">${esc(c.q)}</div>
        </button>`).join('')}</div>
        <p style="text-align:center;font-family:var(--mono);font-size:11px;color:var(--fog);margin-top:16px">横轴：向外 ←→ 向内 · 纵轴：激烈 ↑↓ 低沉</p>`;
    } else if (q.kind === 'rank') {
      const order = cur || q.items.map(x => x.key);
      const byKey = Object.fromEntries(q.items.map(x => [x.key, x]));
      body = order.map((k, idx) => {
        const it = byKey[k];
        return `
          <div class="rank-row${idx === 0 ? ' top' : ''}">
            <span class="rank-num">${idx + 1}</span>
            <div style="flex:1"><div class="opt-text">${esc(it.text)}</div><div class="opt-sub">${esc(it.sub)}</div></div>
            <div>
              <button type="button" class="btn-ghost" data-rank-up="${k}" ${idx === 0 ? 'disabled' : ''}>▲</button>
              <button type="button" class="btn-ghost" data-rank-down="${k}" ${idx === order.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
          </div>`;
      }).join('') + `<button type="button" class="btn-primary" style="width:100%;margin-top:8px" data-rank-commit="${q.id}">就按这个顺序 →</button>`;
    }

    const secIdx = SECTIONS.indexOf(q.section);
    const secChips = SECTIONS.map((s, j) => `<span style="color:${j <= secIdx ? 'var(--mist)' : 'var(--fog)'};opacity:${j <= secIdx ? 1 : 0.5}">${s}</span>`).join(' <span style="color:var(--line)">—</span> ');

    return `
      <div class="q-progress"><span>${secChips}</span><span>${i + 1} / ${QUESTIONS.length}</span></div>
      <div class="q-bar"><div class="q-bar-fill" style="width:${(i / QUESTIONS.length) * 100}%"></div></div>
      <div class="q-id">${esc(q.id)}</div>
      ${q.scene ? `<div class="q-scene">场景 · ${esc(q.scene)}</div>` : ''}
      <h2 class="q-title">${esc(q.text)}</h2>
      ${q.subtitle ? `<div class="q-sub">${esc(q.subtitle)}</div>` : ''}
      <div style="min-height:280px">${body}</div>
      <div class="next-bar" style="border-top:none;padding-top:16px">
        <button type="button" class="btn-ghost" id="q-prev" ${i === 0 ? 'disabled' : ''}>← 上一题</button>
        <span style="font-size:11px;color:var(--fog);font-style:italic">${esc(q.note)}</span>
      </div>`;
  }

  function renderLayerC() {
    const { QUESTIONS } = window.ShadowIntakeQuestions;
    return renderQuestion(QUESTIONS[state.qIndex]);
  }

  function persistSession(full, persona, source) {
    try {
      sessionStorage.setItem(STORAGE_PROFILE, JSON.stringify(full));
      sessionStorage.setItem(STORAGE_PERSONA, JSON.stringify(persona));
      if (source) sessionStorage.setItem('shadow_persona_source', source);
    } catch (_) { /* ignore quota */ }
  }

  function renderSummaryContent(full, persona, source, errorMsg) {
    const sourceLabel = {
      llm: '阶跃星辰 LLM',
      rule_fallback: 'LLM 失败 · 规则兜底',
      rule_local: '离线规则版（无 API）'
    }[source] || source || '未知';

    const tension = (full.tension_flags || []).map(t => `
      <div style="margin-bottom:10px">
        <div>${esc(t.detail)}</div>
        <div style="font-size:12px;color:var(--fog);font-style:italic;margin-top:4px">${esc(t.note)}</div>
      </div>`).join('');

    return `
      <h2 class="summary-title">影子已经成形</h2>
      <p class="summary-sub">Persona agent · <span style="color:var(--glow)">${esc(sourceLabel)}</span>${errorMsg ? ` · ${esc(errorMsg)}` : ''}</p>
      ${full.tension_flags?.length ? `<div class="tension-box"><div style="font-family:var(--mono);font-size:11px;color:var(--glow);margin-bottom:10px">⚑ 张力点</div>${tension}</div>` : ''}
      <div class="persona-card">
        <h3>影 · ${esc(persona.shadow_name)}</h3>
        <dl>
          <dt>core_tension</dt><dd>${esc(persona.core_tension)}</dd>
          <dt>core_traits</dt><dd>${(persona.core_traits || []).map(esc).join(' · ')}</dd>
          <dt>soft_spots</dt><dd>${(persona.soft_spots || []).map(s => `<div style="margin-bottom:8px">${esc(s)}</div>`).join('')}</dd>
          <dt>decision_tendency</dt><dd>${esc(persona.decision_tendency)}</dd>
          <dt>growth_seed</dt><dd>${esc(persona.growth_seed)}</dd>
          <dt>voice_notes</dt><dd>${esc(persona.voice_notes)}</dd>
        </dl>
      </div>
      <details>
        <summary style="cursor:pointer;color:var(--fog);font-family:var(--mono);font-size:12px">full_profile JSON</summary>
        <pre class="json-pre">${esc(JSON.stringify(full, null, 2))}</pre>
      </details>
      <details style="margin-top:12px">
        <summary style="cursor:pointer;color:var(--fog);font-family:var(--mono);font-size:12px">persona JSON</summary>
        <pre class="json-pre">${esc(JSON.stringify(persona, null, 2))}</pre>
      </details>
      <div class="summary-actions">
        <a href="demo-live.html" class="btn-primary" style="text-decoration:none;display:inline-block">Live 全链生成（需 API）</a>
        <a href="demo.html?from=intake" class="btn-primary" style="text-decoration:none;display:inline-block;background:transparent;color:var(--glow);border:1px solid var(--glow-line)">Mock 预览七年</a>
        <button type="button" class="btn-ghost" id="btn-restart">重新采集</button>
      </div>
      <p class="intake-foot-link"><a href="demo-hub.html">← Demo 入口</a></p>`;
  }

  function renderSummary() {
    if (!state.summary || state.summary.loading) {
      return `
        <div class="intake-loading" style="padding:48px 0">
          <div style="font-size:20px;margin-bottom:12px">Persona agent 正在读你…</div>
          <div style="font-size:13px;color:var(--fog)">full_profile → 阶跃星辰 LLM · 约 10–40 秒</div>
        </div>`;
    }
    const { full, persona, source, error } = state.summary;
    return renderSummaryContent(full, persona, source, error);
  }

  async function beginSummary() {
    if (state.summaryStarted) return;
    state.summaryStarted = true;
    const full = buildProfile();
    state.summary = { loading: true, full, persona: null, source: null };
    render();

    try {
      const res = await fetch('/api/persona/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_profile: full, fallback: true })
      });
      const data = await res.json();
      if (!res.ok || !data.persona) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      state.summary = {
        loading: false,
        full: data.full_profile || full,
        persona: data.persona,
        source: data.source || 'llm',
        error: data.llm_error || null
      };
    } catch (err) {
      const persona = window.ShadowPersonaAgent.analyze(full);
      state.summary = {
        loading: false,
        full,
        persona,
        source: 'rule_local',
        error: err.message
      };
    }

    persistSession(state.summary.full, state.summary.persona, state.summary.source);
    render();
  }

  function nextBar(can, hint, next, back) {
    return `
      <div class="next-bar">
        ${back ? `<button type="button" class="btn-ghost" data-goto="${back}">← 返回</button>` : '<span></span>'}
        <div style="display:flex;align-items:center;gap:16px">
          ${hint ? `<span style="font-size:12px;color:var(--fog)">${esc(hint)}</span>` : ''}
          <button type="button" class="btn-primary" data-goto="${next}" ${can ? '' : 'disabled'}>继续 →</button>
        </div>
      </div>`;
  }

  function renderNav() {
    const layers = [['A', '自由说'], ['B', '选标签'], ['C', '十道问']];
    return layers.map(([k, l], idx) => {
      const active = state.layer === k;
      const done = (k === 'A' && state.layer !== 'A' && canLayerA()) ||
        (k === 'B' && (state.layer === 'C' || state.layer === 'done'));
      return `
        <button type="button" class="${active ? 'active' : ''}${done ? ' done' : ''}" data-goto="${k}" ${k === 'C' && !canLayerA() ? 'disabled' : ''}>
          <span class="step-id">${done ? '✓' : `0${idx + 1}`}</span>
          <span>${l}</span>
        </button>`;
    }).join('');
  }

  function render() {
    if (!state.seed) return;

    let main = '';
    if (state.layer === 'A') main = renderLayerA();
    else if (state.layer === 'B') main = renderLayerB();
    else if (state.layer === 'C') main = renderLayerC();
    else main = renderSummary();

    root.innerHTML = `
      <div class="intake-glow"></div>
      <div class="intake-road"></div>
      <div class="intake-wrap">
        <header class="intake-header">
          <div>
            <div class="intake-kicker">SHADOW</div>
            <h1 class="intake-title">告诉影子，你是谁</h1>
            <p class="intake-sub">三层采集 → full_profile → Persona agent 推导 persona JSON。</p>
          </div>
          <div class="intake-clarity">
            <svg viewBox="0 0 80 110" width="64" height="88" aria-hidden="true">
              <ellipse cx="40" cy="28" rx="14" ry="16" fill="var(--cool)" opacity="${0.12 + clarity() * 0.5}"/>
              <rect x="28" y="44" width="24" height="36" rx="6" fill="var(--cool)" opacity="${0.12 + clarity() * 0.4}"/>
            </svg>
            <div class="intake-clarity-num">清晰度 ${Math.round(clarity() * 100)}%</div>
          </div>
        </header>
        ${state.layer !== 'done' ? `<nav class="intake-nav">${renderNav()}</nav>` : ''}
        <main>${main}</main>
        <p class="intake-foot-link"><a href="demo.html">← 返回 Demo</a></p>
      </div>`;

    bindEvents();

    if (state.layer === 'done') {
      window.__shadowSeedTags = state.seed;
      beginSummary();
    }
  }

  function bindEvents() {
    root.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-goto');
        if (t === 'B' && !canLayerA()) return;
        if (t === 'C' && !canLayerB()) return;
        if (t === 'C') { state.qStart = Date.now(); }
        state.layer = t;
        if (t === 'done') state.layer = 'done';
        render();
      });
    });

    root.querySelectorAll('.example-card').forEach(card => {
      card.addEventListener('click', () => {
        const tag = card.getAttribute('data-ex');
        const ex = window.ShadowIntakeQuestions.EXAMPLES.find(e => e.tag === tag);
        if (!ex) return;
        state.layerA.choice = ex.choice;
        state.layerA.self_description = ex.desc;
        updateDomain();
        render();
      });
    });

    const bindField = (id, key, parse) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        state.layerA[key] = parse ? parse(el.value) : el.value;
        if (id === 'f-birth' || id === 'f-fork') {
          const b = Number(state.layerA.birth_year);
          const f = Number(state.layerA.fork_year);
          if (b && f && f >= b) state.layerA.age = f - b;
        }
        updateDomain();
        if (id === 'f-age') return;
        const ageEl = document.getElementById('f-age');
        if (ageEl) ageEl.value = state.layerA.age ?? '';
      });
    };
    bindField('f-choice', 'choice');
    bindField('f-desc', 'self_description');
    bindField('f-liner', 'one_liner');
    bindField('f-birth', 'birth_year', v => v ? Number(v) : null);
    bindField('f-fork', 'fork_year', v => v ? Number(v) : null);

    const search = document.getElementById('tag-search');
    if (search) {
      search.addEventListener('input', () => {
        state.search = search.value;
        render();
        const n = document.getElementById('tag-search');
        if (n) { n.focus(); n.selectionStart = n.selectionEnd = n.value.length; }
      });
    }

    root.querySelectorAll('[data-cat-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cat-toggle');
        state.openCats[id] = state.openCats[id] === false;
        render();
      });
    });

    root.querySelectorAll('[data-tag]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [cat, ...rest] = btn.getAttribute('data-tag').split(':');
        const label = rest.join(':');
        const catMeta = categories().find(c => c.id === cat);
        toggleTag(cat, label, catMeta?.max_select || 5);
      });
    });

    root.querySelectorAll('[data-q]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-q');
        const val = btn.getAttribute('data-val');
        recordAnswer(id, val);
        advanceQuestion();
      });
    });

    const slider = document.getElementById('slider-input');
    if (slider) {
      const q = window.ShadowIntakeQuestions.QUESTIONS[state.qIndex];
      const sync = () => {
        const v = Number(slider.value);
        document.getElementById('slider-val').textContent = v;
        document.getElementById('slider-tier').textContent = q.tiers.find(([a, b]) => v >= a && v <= b)?.[2] || '';
        document.getElementById('slider-fb').textContent = q.feedback.find(([a, b]) => v >= a && v <= b)?.[2] || '';
      };
      slider.addEventListener('input', sync);
      slider.addEventListener('pointerup', () => {
        recordAnswer(slider.getAttribute('data-q'), Number(slider.value));
        advanceQuestion();
      });
    }

    root.querySelectorAll('[data-rank-up],[data-rank-down]').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = window.ShadowIntakeQuestions.QUESTIONS[state.qIndex];
        const order = [...(state.answers[q.id]?.value || q.items.map(x => x.key))];
        const k = btn.getAttribute('data-rank-up') || btn.getAttribute('data-rank-down');
        const idx = order.indexOf(k);
        const dir = btn.hasAttribute('data-rank-up') ? -1 : 1;
        const to = idx + dir;
        if (to < 0 || to >= order.length) return;
        [order[idx], order[to]] = [order[to], order[idx]];
        state.answers[q.id] = { value: order, durationMs: 0 };
        render();
      });
    });

    const rankCommit = root.querySelector('[data-rank-commit]');
    if (rankCommit) {
      rankCommit.addEventListener('click', () => {
        const id = rankCommit.getAttribute('data-rank-commit');
        if (!state.answers[id]) {
          const q = window.ShadowIntakeQuestions.QUESTIONS[state.qIndex];
          state.answers[id] = { value: q.items.map(x => x.key), durationMs: Date.now() - state.qStart };
        }
        advanceQuestion();
      });
    }

    const qPrev = document.getElementById('q-prev');
    if (qPrev) {
      qPrev.addEventListener('click', () => {
        if (state.qIndex > 0) {
          state.qIndex -= 1;
          state.qStart = Date.now();
          render();
        }
      });
    }

    const restart = document.getElementById('btn-restart');
    if (restart) {
      restart.addEventListener('click', () => {
        state.layer = 'A';
        state.qIndex = 0;
        state.answers = {};
        state.picked = {};
        state.summary = null;
        state.summaryStarted = false;
        render();
      });
    }
  }

  function advanceQuestion() {
    const { QUESTIONS } = window.ShadowIntakeQuestions;
    if (state.qIndex < QUESTIONS.length - 1) {
      state.qIndex += 1;
      state.qStart = Date.now();
      setTimeout(render, 350);
    } else {
      setTimeout(() => {
        state.layer = 'done';
        render();
      }, 400);
    }
  }

  async function init() {
    root.innerHTML = '<div class="intake-loading">加载标签库…</div>';
    try {
      const res = await fetch('data/seed_tags.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.seed = await res.json();
      window.__shadowSeedTags = state.seed;
      categories().forEach(c => { state.openCats[c.id] = true; });
      render();
    } catch (e) {
      root.innerHTML = `<div class="intake-loading">加载失败：${esc(e.message)}<br>请用 <code>npm run demo:preview</code> 启动本地服务。</div>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
