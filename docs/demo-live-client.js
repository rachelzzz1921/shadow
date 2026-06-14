/**
 * Shadow Live Demo — Intake → story/start → year×7 → final → Demo 浏览
 */
'use strict';

(function () {
  const STORAGE_LIVE = 'shadow_live_session';
  const logEl = document.getElementById('live-log');
  const progressEl = document.getElementById('live-progress');
  const ivBox = document.getElementById('intervention-live');
  const linkDemo = document.getElementById('link-demo');

  function log(stage, msg) {
    const li = document.createElement('li');
    li.className = 'stage-' + stage;
    li.textContent = `[${stage}] ${msg}`;
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setProgress(pct) {
    progressEl.style.width = Math.min(100, pct) + '%';
  }

  function profileFromIntake() {
    const rawFull = sessionStorage.getItem('shadow_full_profile');
    const rawPersona = sessionStorage.getItem('shadow_persona');
    if (!rawFull) return null;
    const full = JSON.parse(rawFull);
    const persona = rawPersona ? JSON.parse(rawPersona) : null;
    return {
      profile: {
        choice: full.raw?.choice_text || '',
        age: full.temporal?.age_at_fork ?? 18,
        description: full.raw?.self_description || '',
        quote: full.raw?.one_liner || '',
        keywords: (full.raw?.selected_tags || []).slice(0, 6),
        birth_year: full.temporal?.birth_year,
        fork_year: full.temporal?.fork_year
      },
      full_profile: full,
      persona
    };
  }

  async function post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function waitIntervention(prompt) {
    return new Promise((resolve) => {
      if (!prompt?.question) {
        resolve(null);
        return;
      }
      document.getElementById('iv-question').textContent = prompt.question;
      const opts = document.getElementById('iv-options');
      opts.innerHTML = '';
      (prompt.options || []).forEach((label, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-live';
        btn.textContent = label;
        btn.onclick = () => {
          ivBox.hidden = true;
          resolve({ year: null, choice: label, option_index: i });
        };
        opts.appendChild(btn);
      });
      document.getElementById('iv-skip').onclick = () => {
        ivBox.hidden = true;
        resolve(null);
      };
      ivBox.hidden = false;
    });
  }

  async function runPipeline() {
    const intake = profileFromIntake();
    if (!intake?.profile?.choice || intake.profile.choice.length < 10) {
      log('persona', '缺少 Intake — 请先完成 intake.html');
      document.getElementById('live-intro').innerHTML =
        '未检测到 Intake 数据。<a href="intake.html" style="color:#e8b25c">去采集 →</a>';
      return;
    }

    document.getElementById('btn-run').disabled = true;
    logEl.innerHTML = '';
    setProgress(5);

    try {
      await fetch('/api/health');
    } catch {
      log('persona', 'Live API 不可用 — 请运行 npm run demo:live');
      document.getElementById('btn-run').disabled = false;
      return;
    }

    log('persona', '启动 session…');
    const start = await post('/api/story/start', { profile: intake.profile });
    let session = start.session;
    log('persona', `${session.persona_card?.name || '影子'}：${(session.persona_card?.core_traits || []).join('、')}`);
    log('beats', `pivotal 年：${(session.pivotal_years || []).join(', ')}`);
    setProgress(15);

    const totalYears = (session.beats || []).length || 7;
    let pendingIntervention = null;

    for (let i = 0; i < totalYears; i++) {
      const beat = session.beats[i];
      log('year', `生成第 ${beat?.year} 年 (${beat?.type})…`);

      const result = await post('/api/story/year', {
        session,
        user_intervention: pendingIntervention
      });
      pendingIntervention = null;
      session = result.session;
      log('fate', (result.session?.last_fate_context?.era_line || '时代层已采样').slice(0, 56));
      log('year', `✓ ${result.year?.title || '年' + beat.year}`);

      if (result.year?.is_pivotal && result.year?.intervention_prompt && i < totalYears - 1) {
        const choice = await waitIntervention(result.year.intervention_prompt);
        if (choice) {
          pendingIntervention = { year: result.year.year, choice: choice.choice, option_index: choice.option_index };
          log('year', `介入记录：${choice.choice}`);
        }
      }

      setProgress(15 + ((i + 1) / totalYears) * 70);
    }

    log('final', '收尾…');
    const fin = await post('/api/story/final', { session });
    session = fin.session;
    log('final', fin.final?.title || '七年收束');

    sessionStorage.setItem(STORAGE_LIVE, JSON.stringify({
      session,
      final: fin.final,
      profile: intake.profile,
      full_profile: intake.full_profile,
      persona: intake.persona,
      generated_at: new Date().toISOString()
    }));

    if (session.persona_card) {
      sessionStorage.setItem('shadow_persona', JSON.stringify({
        shadow_name: session.persona_card.name,
        ...session.persona_card
      }));
    }
    sessionStorage.setItem('shadow_full_profile', JSON.stringify(intake.full_profile));

    setProgress(100);
    linkDemo.hidden = false;
    linkDemo.href = 'demo.html?live=1';
    log('final', '完成 — 可进入 Demo 浏览（Live 数据注入）');
  }

  document.getElementById('btn-run').addEventListener('click', runPipeline);

  const intake = profileFromIntake();
  if (intake?.profile?.choice) {
    document.getElementById('live-intro').textContent =
      `岔路口：${intake.profile.choice.slice(0, 60)}${intake.profile.choice.length > 60 ? '…' : ''}`;
  }
})();
