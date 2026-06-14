#!/usr/bin/env node
/**
 * shadow-tasks — Shadow 任务管理 CLI
 * 数据源：tasks/registry.json（唯一真相）
 * 用法：node scripts/shadow-tasks.js <command> [options]
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'tasks', 'registry.json');
const BOARD = path.join(ROOT, 'BOARD.md');
const AUTO_START = '<!-- TASK-AUTO:START -->';
const AUTO_END = '<!-- TASK-AUTO:END -->';

const STATUS_ICON = {
  done: '✅',
  in_progress: '🟡',
  todo: '⬜',
  blocked: '🔴',
  cancelled: '⛔',
};

const EXEC_ICON = {
  human: '👤',
  cc: '🤖CC',
  cx: '🤖CX',
  'human+cx': '👤+🤖',
  'human+cc': '👤+🤖',
};

const PHASE_LINKS = {
  '01-requirements': '../01-requirements/index.md',
  '02-design': '../02-technical-design/index.md',
  '03-coding': '../03-coding/index.md',
  '04-dev-testing': '../04-dev-testing/index.md',
  '05-qa': '../05-qa-testing/index.md',
  '06-progress': './index.md',
  '07-debug': '../07-debug-and-correction/index.md',
  done: '../MANIFEST.md',
  backlog: './tasks/registry.json',
};

const QUICK_LINKS = [
  ['任务库', './tasks/registry.json'],
  ['任务系统说明', './05-task-system.md'],
  ['五人排期', './04-team-execution-plan.md'],
  ['Visual 模块', '../visual/README.md'],
  ['复读线 golden', '../fixtures/golden-stories/复读线.md'],
  ['叙事待改清单', '../visual/stories/fuxduxian/narrative-gaps.md'],
  ['场景 brief', '../visual/stories/fuxduxian/scene-briefs.md'],
  ['素材 CSV', '../visual/registry/assets.csv'],
  ['MANIFEST', '../MANIFEST.md'],
  ['AGENTS 入口', '../AGENTS.md'],
];

const TASK_LIBRARY = path.join(ROOT, 'tasks', 'TASK-LIBRARY.md');

const DEFAULT_CATALOG = {
  team_roles: {
    P1: '产品 / PM',
    P2: '叙事 / 内容',
    P3: '工程 Lead',
    P4: 'QA / 评测',
    P5: '工具 / 集成',
  },
  changes: {
    'INFRA-001': { title: '团队 Onboarding', summary: 'Kickoff、花名册、Agent 分工' },
    'CHG-000': { title: 'Corpus 整合', summary: '唯一入口、gap 扫描、skills' },
    'CHG-001': { title: 'P0 三项迁移', summary: 'memory / reflection / re-plan' },
    'CHG-V001': { title: 'Visual 复读线', summary: '叙事 v2 · 像素 · Phaser' },
    'CHG-002': { title: '第二条 Golden', summary: 'Wave 5 可选' },
    'CHG-003': { title: '多 Run 对比', summary: 'Wave 5 可选' },
  },
  waves: {
    0: 'Kickoff & P0 scope 签字',
    1: '基线 & 并行准备',
    2: '需求/方案锁定',
    3: '编码 & Visual 实现',
    4: '自测 · QA · 发布',
    5: '可选 backlog',
  },
  change_order: ['INFRA-001', 'CHG-000', 'CHG-001', 'CHG-V001', 'CHG-002', 'CHG-003'],
};

function getCatalog(data) {
  return { ...DEFAULT_CATALOG, ...(data.catalog || {}) };
}

function buildChangeMap() {
  const map = {};
  const dir = path.join(ROOT, 'changes');
  if (!fs.existsSync(dir)) return map;
  for (const name of fs.readdirSync(dir)) {
    const m = name.match(/^(CHG-V\d+|CHG-\d+|INFRA-\d+)/);
    if (m) map[m[1]] = `./changes/${name}/progress.md`;
  }
  return map;
}

function resolveArtifactLink(artifact) {
  if (!artifact) return null;
  if (artifact.startsWith('changes/')) return `./${artifact}`;
  if (
    artifact.startsWith('visual/') ||
    artifact.startsWith('fixtures/') ||
    artifact.startsWith('archive/') ||
    artifact.startsWith('skills/') ||
    artifact.startsWith('docs/') ||
    artifact.startsWith('01-') ||
    artifact.startsWith('02-') ||
    artifact.startsWith('03-') ||
    artifact.startsWith('04-') ||
    artifact.startsWith('05-') ||
    artifact.startsWith('06-') ||
    artifact.startsWith('07-')
  ) {
    return `../${artifact}`;
  }
  if (!artifact.includes('/')) return `./${artifact}`;
  return `../${artifact}`;
}

function taskHref(t, changeMap) {
  const art = resolveArtifactLink(t.artifact);
  if (art) return art;
  if (t.change_id && changeMap[t.change_id]) return changeMap[t.change_id];
  return `#task-${t.id.toLowerCase()}`;
}

function link(label, href) {
  return `[${label}](${href})`;
}

function taskBadge(t) {
  return t.optional ? '◇ ' : '';
}

function adjustLink(href, linkBase) {
  if (!href || href.startsWith('#')) return href;
  if (linkBase === '..' && href.startsWith('./')) return '../' + href.slice(2);
  return href;
}

function taskIdLink(t, changeMap, linkBase = '.') {
  return link(t.id, adjustLink(taskHref(t, changeMap), linkBase));
}

function phaseHeader(p) {
  const label = shortPhase(p);
  const href = PHASE_LINKS[p];
  return href ? link(label, href) : label;
}

function load() {
  return JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
}

function save(data) {
  data.updated_at = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(REGISTRY, JSON.stringify(data, null, 2) + '\n');
}

function findTask(data, id) {
  const t = data.tasks.find((x) => x.id === id);
  if (!t) throw new Error(`Task not found: ${id}`);
  return t;
}

function depsDone(data, task) {
  return (task.depends_on || []).every((depId) => {
    const dep = data.tasks.find((x) => x.id === depId);
    return dep && dep.status === 'done';
  });
}

function isReady(data, task) {
  if (task.status !== 'todo') return false;
  if (task.status === 'blocked') return false;
  return depsDone(data, task);
}

function filterTasks(data, opts) {
  return data.tasks.filter((t) => {
    if (opts.status && t.status !== opts.status) return false;
    if (opts.assignee && t.assignee !== opts.assignee) return false;
    if (opts.phase && t.phase !== opts.phase) return false;
    if (opts.change && t.change_id !== opts.change) return false;
    if (opts.wave != null && String(t.wave) !== String(opts.wave)) return false;
    if (opts.tag && !(t.tags || []).includes(opts.tag)) return false;
    if (opts.priority && t.priority !== opts.priority) return false;
    return true;
  });
}

function parseArgs(argv) {
  const args = [...argv];
  const cmd = args.shift() || 'help';
  const positional = [];
  const flags = {};
  while (args.length) {
    const a = args[0];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (args[1] && !args[1].startsWith('--')) {
        flags[key] = args[1];
        args.splice(0, 2);
      } else {
        flags[key] = true;
        args.shift();
      }
    } else {
      positional.push(args.shift());
    }
  }
  return { cmd, positional, flags };
}

function printTable(rows, headers) {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length))
  );
  const line = widths.map((w) => '-'.repeat(w)).join('-+-');
  const fmt = (row) => row.map((c, i) => String(c ?? '').padEnd(widths[i])).join(' | ');
  console.log(fmt(headers));
  console.log(line);
  rows.forEach((r) => console.log(fmt(r)));
}

function cmdList(data, flags) {
  const changeMap = buildChangeMap();
  const tasks = filterTasks(data, flags).sort((a, b) => {
    const po = { P0: 0, P1: 1, P2: 2 };
    const wa = a.wave ?? 99;
    const wb = b.wave ?? 99;
    return (po[a.priority] ?? 9) - (po[b.priority] ?? 9) || wa - wb || a.id.localeCompare(b.id);
  });
  if (flags.json) {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }
  const rows = tasks.map((t) => [
    STATUS_ICON[t.status] || t.status,
    t.id,
    t.priority || '—',
    t.change_id || '—',
    t.wave ?? '—',
    t.title,
    t.assignee || '—',
    EXEC_ICON[t.executor] || t.executor,
    shortPhase(t.phase),
    (t.depends_on || []).join(',') || '—',
  ]);
  printTable(rows, ['', 'ID', 'Pri', 'Change', 'Wave', '任务', '负责', '执行', '阶段', '依赖']);
  console.log(`\n${tasks.length} task(s)`);
}

function cmdShow(data, id) {
  const t = findTask(data, id);
  const ready = isReady(data, t);
  console.log(`# ${t.id} — ${t.title}\n`);
  console.log(`Status:     ${STATUS_ICON[t.status]} ${t.status}`);
  console.log(`Assignee:   ${t.assignee || '—'}`);
  console.log(`Executor:   ${EXEC_ICON[t.executor] || t.executor}`);
  console.log(`Phase:      ${t.phase}`);
  console.log(`Change:     ${t.change_id || '—'}`);
  console.log(`Wave:       ${t.wave ?? '—'}`);
  console.log(`Priority:   ${t.priority}`);
  console.log(`Skill:      ${t.skill || '—'}`);
  console.log(`Artifact:   ${t.artifact || '—'}`);
  console.log(`Estimate:   ${t.estimate_h ? t.estimate_h + 'h' : '—'}`);
  console.log(`Depends:    ${(t.depends_on || []).join(', ') || '—'}`);
  console.log(`Gates:      ${(t.gates || []).join(', ') || '—'}`);
  console.log(`Tags:       ${(t.tags || []).join(', ') || '—'}`);
  console.log(`Ready:      ${ready ? 'YES — deps satisfied' : 'NO'}`);
  if (t.blocked_reason) console.log(`Blocked:    ${t.blocked_reason}`);
  if (t.completed_at) console.log(`Completed:  ${t.completed_at}`);
  if (t.notes) console.log(`Notes:      ${t.notes}`);
}

function cmdReady(data) {
  const ready = data.tasks.filter((t) => isReady(data, t));
  if (!ready.length) {
    console.log('No ready tasks (all todo items blocked by deps or none in todo).');
    return;
  }
  cmdList({ ...data, tasks: ready }, {});
  console.log('\n→ 这些任务依赖已满足，可立即开始。');
}

function cmdMine(data, assignee) {
  const mine = data.tasks.filter(
    (t) => t.assignee === assignee && t.status !== 'done' && t.status !== 'cancelled'
  );
  const ready = mine.filter((t) => isReady(data, t) || t.status === 'in_progress');
  const waiting = mine.filter((t) => t.status === 'todo' && !isReady(data, t));
  console.log(`## ${assignee} — 可执行 (${ready.length})\n`);
  ready.forEach((t) => {
    const mark = t.status === 'in_progress' ? '🟡' : '⬜';
    console.log(`${mark} ${t.id}  ${t.title}  [${EXEC_ICON[t.executor] || t.executor}]`);
  });
  if (waiting.length) {
    console.log(`\n## ${assignee} — 等待依赖 (${waiting.length})\n`);
    waiting.forEach((t) => {
      const unmet = (t.depends_on || []).filter((d) => {
        const dep = data.tasks.find((x) => x.id === d);
        return !dep || dep.status !== 'done';
      });
      console.log(`⏸ ${t.id}  ${t.title}  ← 等 ${unmet.join(', ')}`);
    });
  }
  const pool = data.tasks.filter(
    (t) =>
      t.assignee === assignee &&
      (t.tags || []).includes('waiting-pool') &&
      t.status === 'todo'
  );
  if (pool.length) {
    console.log(`\n## ${assignee} — 等待池（Agent 长跑时可做）\n`);
    pool.forEach((t) => console.log(`⏳ ${t.id}  ${t.title}`));
  }
}

function cmdCritical(data) {
  const todo = data.tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const blockedByHuman = todo.filter(
    (t) => t.executor === 'human' && (t.gates || []).length > 0 && t.status === 'todo'
  );
  const onPath = ['T-004', 'T-010', 'T-011', 'T-012', 'T-013', 'T-014', 'T-015', 'T-016', 'T-017', 'T-018', 'T-019', 'T-020', 'T-022'];
  console.log('## 关键路径（CHG-001 P0）\n');
  onPath.forEach((id) => {
    const t = data.tasks.find((x) => x.id === id);
    if (!t) return;
    const depOk = depsDone(data, t);
    console.log(`${STATUS_ICON[t.status]} ${t.id}  ${t.title}${depOk || t.status === 'done' ? '' : '  ⚠ deps未满足'}`);
  });
  console.log('\n## 人工 Gate 待办\n');
  blockedByHuman.forEach((t) => {
    console.log(`👤 ${t.id}  ${t.title}  gates=[${(t.gates || []).join(',')}]`);
  });
}

function setStatus(data, id, status, extra = {}) {
  const t = findTask(data, id);
  t.status = status;
  if (status === 'done') t.completed_at = new Date().toISOString().slice(0, 10);
  if (status === 'blocked' && extra.reason) t.blocked_reason = extra.reason;
  if (status !== 'blocked') t.blocked_reason = extra.clearBlock ? '' : t.blocked_reason || '';
  Object.assign(t, extra.fields || {});
  save(data);
  console.log(`${id} → ${status}`);
}

function cmdAdd(data, flags, title) {
  if (!title) throw new Error('Usage: add "<title>" --assignee P1 [--phase ...]');
  const ids = data.tasks.map((t) => t.id);
  let num = ids.filter((id) => /^T-\d+$/.test(id)).length + 1;
  let id = `T-${String(num).padStart(3, '0')}`;
  while (ids.includes(id)) {
    num++;
    id = `T-${String(num).padStart(3, '0')}`;
  }
  const task = {
    id,
    title,
    change_id: flags.change || null,
    phase: flags.phase || 'backlog',
    status: 'todo',
    priority: flags.priority || 'P2',
    wave: flags.wave ? Number(flags.wave) : null,
    assignee: flags.assignee || null,
    executor: flags.executor || 'human',
    skill: flags.skill || null,
    depends_on: flags.depends ? flags.depends.split(',') : [],
    gates: flags.gates ? flags.gates.split(',') : [],
    artifact: flags.artifact || null,
    estimate_h: flags.estimate ? Number(flags.estimate) : null,
    due: flags.due || null,
    tags: flags.tag ? flags.tag.split(',') : [],
    parallel_ok: true,
  };
  data.tasks.push(task);
  save(data);
  console.log(`Created ${id}: ${title}`);
}

function taskTableHeader() {
  return '| 状态 | ID | 任务 | 波次 | 阶段 | 负责 | 执行 | 依赖 | 产物 |\n|------|-----|------|------|------|------|------|------|------|\n';
}

function depsLabel(data, task) {
  const deps = task.depends_on || [];
  if (!deps.length) return '—';
  return deps
    .map((id) => {
      const d = data.tasks.find((x) => x.id === id);
      const ok = d && d.status === 'done';
      return ok ? `~~${id}~~` : id;
    })
    .join(', ');
}

function artifactCell(t, changeMap, linkBase = '.') {
  const art = resolveArtifactLink(t.artifact);
  if (art) return link(path.basename(art.split('#')[0]), adjustLink(art, linkBase));
  if (t.change_id && changeMap[t.change_id]) return link('change', adjustLink(changeMap[t.change_id], linkBase));
  return '—';
}

function taskTableRow(data, t, changeMap, linkBase = '.') {
  const icon = STATUS_ICON[t.status] || '';
  const ready = isReady(data, t) ? ' **✓**' : '';
  const gates = (t.gates || []).length ? ` · Gate ${(t.gates || []).join(',')}` : '';
  const opt = t.optional ? '◇ ' : '';
  const idLink = link(t.id, adjustLink(taskHref(t, changeMap), linkBase));
  return `| ${icon}${ready} | ${opt}${idLink} | ${t.title}${gates} | W${t.wave ?? '—'} | ${shortPhase(t.phase)} | ${t.assignee || '—'} | ${EXEC_ICON[t.executor] || t.executor} | ${depsLabel(data, t)} | ${artifactCell(t, changeMap, linkBase)} |\n`;
}

function sortTasksForDisplay(a, b) {
  const wa = a.wave ?? 99;
  const wb = b.wave ?? 99;
  if (wa !== wb) return wa - wb;
  return a.id.localeCompare(b.id);
}

function renderAutoSection(data) {
  const catalog = getCatalog(data);
  const changeMap = buildChangeMap();
  const phases = data.phases.filter((p) => p !== 'backlog' && p !== 'done');
  const active = data.tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');

  const stats = {
    total: data.tasks.length,
    done: data.tasks.filter((t) => t.status === 'done').length,
    in_progress: data.tasks.filter((t) => t.status === 'in_progress').length,
    blocked: data.tasks.filter((t) => t.status === 'blocked').length,
    ready: data.tasks.filter((t) => isReady(data, t)).length,
  };

  let md = '';
  md += `> **自动生成** \`${new Date().toISOString().slice(0, 16).replace('T', ' ')}\` · 源 ${link('registry.json', './tasks/registry.json')} · 可读版 ${link('TASK-LIBRARY.md', './tasks/TASK-LIBRARY.md')} · 刷新 \`npm run board\`\n\n`;

  md += `### 图例\n\n`;
  md += `| 符号 | 含义 |\n|------|------|\n`;
  md += `| ● | 必做，挡主线 |\n`;
  md += `| ◇ | 可选，不挡发布 |\n`;
  md += `| 👤 / 🤖 | 人工 / Agent（CC·Codex） |\n`;
  md += `| **✓** | 依赖已满足，可立即开始 |\n`;
  md += `| ~~T-xxx~~ | 已完成的前置依赖 |\n\n`;

  md += `### 团队\n\n`;
  md += `| 代号 | 角色 |\n|------|------|\n`;
  for (const p of data.team) {
    md += `| **${p}** | ${catalog.team_roles[p] || '—'} |\n`;
  }
  md += '\n';

  md += `### 快速跳转\n\n`;
  md += `| 模块 | 链接 | 模块 | 链接 |\n|------|------|------|------|\n`;
  for (let i = 0; i < QUICK_LINKS.length; i += 2) {
    const a = QUICK_LINKS[i];
    const b = QUICK_LINKS[i + 1];
    md += `| ${a[0]} | ${link(a[0], a[1])} | ${b ? b[0] : ''} | ${b ? link(b[0], b[1]) : ''} |\n`;
  }
  md += '\n';

  md += `**Changes：** `;
  md += Object.entries(changeMap)
    .map(([id, href]) => link(id, href))
    .join(' · ');
  md += `\n\n**Visual：** ${link('CHG-V001', changeMap['CHG-V001'] || '../visual/README.md')} · ${link('pipeline', '../visual/01-pipeline.md')} · ${link('UX 流程', '../visual/04-ux-flow.md')}\n\n`;

  md += `### 统计\n\n`;
  md += `| 总计 | 完成 | 进行中 | 阻塞 | **可开干** |\n|------|------|--------|------|------------|\n`;
  md += `| ${stats.total} | ${stats.done} | ${stats.in_progress} | ${stats.blocked} | **${stats.ready}** |\n\n`;

  md += `### 阶段概览（任务数）\n\n`;
  md += `| ${[...phases, 'backlog'].map(phaseHeader).join(' | ')} |\n`;
  md += `|${[...phases, 'backlog'].map(() => '---').join('|')}|\n`;
  const phaseCounts = [...phases, 'backlog'].map((p) => {
    const n = active.filter((t) => (byPhaseId(t, phases) === p)).length;
    return String(n);
  });
  md += `| ${phaseCounts.join(' | ')} |\n\n`;

  md += `### 按 Change 分组（主视图）\n\n`;
  const byChange = {};
  for (const t of active) {
    const key = t.change_id || ((t.tags || []).includes('waiting-pool') ? '_pool' : '_misc');
    if (!byChange[key]) byChange[key] = [];
    byChange[key].push(t);
  }
  const changeOrder = [...catalog.change_order, '_pool', '_misc'];
  for (const cid of changeOrder) {
    const tasks = (byChange[cid] || []).sort(sortTasksForDisplay);
    if (!tasks.length) continue;
    const info = catalog.changes[cid];
    const chLink = changeMap[cid] ? link(cid, changeMap[cid]) : cid === '_pool' ? '等待池 ◇' : cid === '_misc' ? '其他 backlog ◇' : cid;
    md += `#### ${chLink}`;
    if (info) md += ` — ${info.title}：${info.summary}`;
    md += `\n\n${taskTableHeader()}`;
    for (const t of tasks) md += taskTableRow(data, t, changeMap);
    md += '\n';
  }

  md += `### 关键路径 Wave（CHG-001 P0）\n\n`;
  const criticalIds = ['T-004', 'T-010', 'T-011', 'T-012', 'T-013', 'T-014', 'T-015', 'T-016', 'T-017', 'T-018', 'T-019', 'T-020', 'T-022'];
  md += taskTableHeader();
  for (const id of criticalIds) {
    const t = data.tasks.find((x) => x.id === id);
    if (t && t.status !== 'cancelled') md += taskTableRow(data, t, changeMap);
  }
  md += '\n';

  md += `### 立即可执行（${stats.ready} 项 · deps 已满足）\n\n`;
  const ready = data.tasks.filter((t) => isReady(data, t)).sort(sortTasksForDisplay);
  if (!ready.length) md += `_无_\n\n`;
  else {
    md += taskTableHeader();
    ready.forEach((t) => { md += taskTableRow(data, t, changeMap); });
    md += '\n';
  }

  md += `### 进行中\n\n`;
  const ip = data.tasks.filter((t) => t.status === 'in_progress');
  if (!ip.length) md += `_无_\n\n`;
  else {
    ip.forEach((t) => {
      md += `- 🟡 ${taskIdLink(t, changeMap)} **${t.title}**（${t.assignee} · ${catalog.team_roles[t.assignee] || ''}）`;
      const art = resolveArtifactLink(t.artifact);
      if (art) md += ` → ${link('产物', art)}`;
      md += '\n';
    });
    md += '\n';
  }

  md += `### 阻塞\n\n`;
  const bl = data.tasks.filter((t) => t.status === 'blocked');
  if (!bl.length) md += `_无_\n\n`;
  else {
    bl.forEach((t) => {
      md += `- 🔴 ${taskIdLink(t, changeMap)} ${t.title} — ${t.blocked_reason || '未注明原因'}\n`;
    });
    md += '\n';
  }

  md += `### 按人负载\n\n`;
  md += `| 成员 | 角色 | todo | 进行中 | 可开干 | 等待池 | CLI |\n|------|------|------|--------|--------|--------|-----|\n`;
  for (const p of data.team) {
    const ts = data.tasks.filter((t) => t.assignee === p && t.status !== 'done' && t.status !== 'cancelled');
    md += `| **${p}** | ${catalog.team_roles[p] || '—'} | ${ts.filter((t) => t.status === 'todo').length} | ${ts.filter((t) => t.status === 'in_progress').length} | ${ts.filter((t) => isReady(data, t)).length} | ${ts.filter((t) => (t.tags || []).includes('waiting-pool') && t.status === 'todo').length} | \`mine ${p}\` |\n`;
  }
  md += '\n';

  md += `### Gates（人工签字点）\n\n`;
  md += `| Gate | 名称 | 负责人 | 解锁 |\n|------|------|--------|------|\n`;
  for (const [gid, g] of Object.entries(data.gates || {})) {
    md += `| **${gid}** | ${g.name} | ${g.owner} | ${(g.unlocks || []).join('；')} |\n`;
  }
  md += '\n';

  md += `### CLI 速查\n\n`;
  md += '```bash\n';
  md += 'npm run tasks -- ready              # 可立即开始的任务\n';
  md += 'npm run tasks -- mine P2            # 某成员任务 + 等待池\n';
  md += 'npm run tasks -- list --change CHG-001   # 按 Change 筛选\n';
  md += 'npm run tasks -- critical           # 关键路径\n';
  md += 'npm run tasks -- show T-007         # 单任务详情\n';
  md += 'npm run board                       # 刷新看板 + 任务库\n';
  md += '```\n';

  return md;
}

function byPhaseId(t, phases) {
  return phases.includes(t.phase) ? t.phase : 'backlog';
}

function renderTaskLibrary(data) {
  const catalog = getCatalog(data);
  const changeMap = buildChangeMap();
  const tasks = [...data.tasks].sort((a, b) => {
    const ca = a.change_id || 'zzz';
    const cb = b.change_id || 'zzz';
    const oa = catalog.change_order.indexOf(ca);
    const ob = catalog.change_order.indexOf(cb);
    const ra = oa >= 0 ? oa : 99;
    const rb = ob >= 0 ? ob : 99;
    return ra - rb || sortTasksForDisplay(a, b);
  });

  let md = `# 任务库（可读版）\n\n`;
  md += `> **计划** \`${data.plan_id}\` · **更新** ${data.updated_at}  \n`;
  md += `> 机器源文件 → [registry.json](./registry.json) · 看板 → [BOARD.md](../BOARD.md)  \n`;
  md += `> 刷新：\`npm run board\`\n\n`;

  md += `## 图例\n\n`;
  md += `- **●** 必做 · **◇** 可选\n`;
  md += `- 状态：✅ 完成 · 🟡 进行中 · ⬜ 待办 · 🔴 阻塞\n`;
  md += `- 执行：👤 人工 · 🤖CC Claude Code · 🤖CX Codex\n\n`;

  md += `## 团队\n\n`;
  for (const p of data.team) {
    md += `- **${p}** — ${catalog.team_roles[p] || '—'}\n`;
  }
  md += '\n';

  md += `## Change 目录\n\n`;
  md += `| ID | 名称 | 说明 | 进度 |\n|----|------|------|------|\n`;
  for (const cid of catalog.change_order) {
    const info = catalog.changes[cid];
    const ts = data.tasks.filter((t) => t.change_id === cid);
    const done = ts.filter((t) => t.status === 'done').length;
    const ch = changeMap[cid] ? link(cid, adjustLink(changeMap[cid], '..')) : cid;
    md += `| ${ch} | ${info?.title || cid} | ${info?.summary || '—'} | ${done}/${ts.length} |\n`;
  }
  md += '\n';

  md += `## 全部任务\n\n`;
  md += taskTableHeader();
  for (const t of tasks) {
    if (t.status === 'cancelled') continue;
    md += taskTableRow(data, t, changeMap, '..');
  }
  md += '\n';

  md += `## Wave 说明\n\n`;
  for (const [w, desc] of Object.entries(catalog.waves)) {
    md += `- **Wave ${w}** — ${desc}\n`;
  }
  md += '\n';

  md += `## Gates\n\n`;
  md += `| Gate | 名称 | 负责人 | 解锁内容 |\n|------|------|--------|----------|\n`;
  for (const [gid, g] of Object.entries(data.gates || {})) {
    md += `| ${gid} | ${g.name} | ${g.owner} | ${(g.unlocks || []).join('；')} |\n`;
  }
  md += '\n';

  return md;
}

function shortPhase(p) {
  const m = {
    '01-requirements': '01 需求',
    '02-design': '02 方案',
    '03-coding': '03 编码',
    '04-dev-testing': '04 自测',
    '05-qa': '05 QA',
    '06-progress': '06 进度',
    '07-debug': '07 纠错',
    done: 'Done',
    backlog: 'backlog',
  };
  return m[p] || p;
}

function cmdSync(data) {
  const section = renderAutoSection(data);
  let board = fs.readFileSync(BOARD, 'utf8');
  if (!board.includes(AUTO_START)) {
    board = board.replace(
      '---\n\n## 0. 全链路一图',
      `---\n\n${AUTO_START}\n${section}\n${AUTO_END}\n\n## 0. 全链路一图`
    );
  } else {
    const re = new RegExp(`${AUTO_START}[\\s\\S]*?${AUTO_END}`);
    board = board.replace(re, `${AUTO_START}\n${section}${AUTO_END}`);
  }
  fs.writeFileSync(BOARD, board);
  fs.writeFileSync(TASK_LIBRARY, renderTaskLibrary(data));
  console.log(`Synced auto section → ${BOARD}`);
  console.log(`Synced task library → ${TASK_LIBRARY}`);
}

function cmdBoard(data) {
  console.log(renderAutoSection(data));
}

function cmdHelp() {
  console.log(`
shadow-tasks — Shadow 任务管理

Commands:
  list [--status todo|in_progress|done|blocked] [--assignee P1] [--phase ...] [--change CHG-001] [--wave N] [--tag waiting-pool] [--json]
  show <ID>
  ready                    依赖已满足、可立即开始的 todo
  mine <P1|P2|P3|P4|P5>    成员任务 + 等待池
  critical                 关键路径 + 人工 Gate
  board                    打印看板（不写文件）
  sync                     刷新 BOARD.md 自动生成区

  start <ID>               → in_progress
  done <ID>                → done
  block <ID> <reason>      → blocked
  unblock <ID>             → todo
  assign <ID> <P1>         改负责人

  add "<title>" --assignee P1 [--phase 01-requirements] [--priority P0] [--executor human|cc|cx]
       [--depends T-001,T-002] [--change CHG-001] [--skill tdd]

Examples:
  npm run tasks -- ready
  npm run tasks -- mine P2
  npm run tasks -- start T-007
  npm run tasks -- done T-005
  npm run tasks -- sync
`);
}

function main() {
  const { cmd, positional, flags } = parseArgs(process.argv.slice(2));
  const data = load();

  switch (cmd) {
    case 'list':
      return cmdList(data, flags);
    case 'show':
      return cmdShow(data, positional[0]);
    case 'ready':
      return cmdReady(data);
    case 'mine':
      return cmdMine(data, positional[0] || 'P1');
    case 'critical':
      return cmdCritical(data);
    case 'board':
      return cmdBoard(data);
    case 'sync':
      cmdSync(data);
      return;
    case 'start':
      return setStatus(data, positional[0], 'in_progress');
    case 'done':
      return setStatus(data, positional[0], 'done');
    case 'block':
      return setStatus(data, positional[0], 'blocked', { reason: positional.slice(1).join(' ') });
    case 'unblock':
      return setStatus(data, positional[0], 'todo', { clearBlock: true });
    case 'assign': {
      const t = findTask(data, positional[0]);
      t.assignee = positional[1];
      save(data);
      console.log(`${positional[0]} assignee → ${positional[1]}`);
      return;
    }
    case 'add':
      return cmdAdd(data, flags, positional.join(' '));
    case 'help':
    default:
      return cmdHelp();
  }
}

try {
  main();
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
