#!/usr/bin/env node
/**
 * build-board-site.mjs — 从 registry.json 生成 GitHub Pages 静态看板
 * 输出：docs/index.html + docs/board-data.json
 *
 * GITHUB_REPO=chenzhiwei/shadow node build-board-site.mjs
 */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '../..');
const REGISTRY = path.join(ROOT, 'tasks', 'registry.json');
const OUT_DIR = path.join(REPO_ROOT, 'docs');
const CONFIG_FILE = path.join(ROOT, 'site.config.json');
const BOARD_CONFIG = path.join(ROOT, 'site.board.json');
const CORPUS_ROOT = path.join(REPO_ROOT, 'shadow-corpus');

const STATUS = { done: '✅', in_progress: '🟡', todo: '⬜', blocked: '🔴', cancelled: '⛔' };
const EXEC = { human: '👤', cc: '🤖CC', cx: '🤖CX', 'human+cx': '👤+🤖', 'human+cc': '👤+🤖' };
const PHASE_LABEL = {
  '01-requirements': '01 需求',
  '02-design': '02 方案',
  '03-coding': '03 编码',
  '04-dev-testing': '04 自测',
  '05-qa': '05 QA',
  '06-progress': '06 进度',
  '07-debug': '07 纠错',
 done: 'Done',
  backlog: 'Backlog',
};

function loadConfig() {
  const defaults = { githubRepo: process.env.GITHUB_REPO || '', siteTitle: 'Shadow 团队看板' };
  if (fs.existsSync(CONFIG_FILE)) {
    return { ...defaults, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
  }
  return defaults;
}

function buildChangeMap() {
  const map = {};
  const dir = path.join(ROOT, 'changes');
  if (!fs.existsSync(dir)) return map;
  for (const name of fs.readdirSync(dir)) {
    const m = name.match(/^(CHG-V\d+|CHG-\d+|INFRA-\d+)/);
    if (m) map[m[1]] = `changes/${name}/progress.md`;
  }
  return map;
}

function corpusPath(relative) {
  if (!relative) return null;
  if (relative.startsWith('changes/')) {
    return `shadow-corpus/06-task-progress/${relative}`;
  }
  if (relative.startsWith('../')) {
    return `shadow-corpus/${relative.slice(3)}`;
  }
  if (relative.startsWith('./')) {
    return `shadow-corpus/06-task-progress/${relative.slice(2)}`;
  }
  return `shadow-corpus/06-task-progress/${relative}`;
}

function githubUrl(repo, filePath) {
  if (!repo || !filePath) return null;
  return `https://github.com/${repo}/blob/main/${filePath}`;
}

function depsDone(tasks, task) {
  return (task.depends_on || []).every((id) => {
    const d = tasks.find((x) => x.id === id);
    return d && d.status === 'done';
  });
}

function isReady(tasks, task) {
  return task.status === 'todo' && depsDone(tasks, task);
}

function enrichTask(task, tasks, changeMap, repo) {
  const changePath = task.change_id && changeMap[task.change_id];
  const artifactPath = corpusPath(task.artifact);
  return {
    ...task,
    statusIcon: STATUS[task.status] || task.status,
    execIcon: EXEC[task.executor] || task.executor,
    optionalBadge: task.optional ? '◇' : '',
    ready: isReady(tasks, task),
    phaseLabel: PHASE_LABEL[task.phase] || task.phase,
    github: {
      artifact: githubUrl(repo, artifactPath),
      change: githubUrl(repo, changePath && corpusPath(changePath)),
      registry: githubUrl(repo, 'shadow-corpus/06-task-progress/tasks/registry.json'),
    },
  };
}

function sortTasks(a, b) {
  const wa = a.wave ?? 99;
  const wb = b.wave ?? 99;
  return wa - wb || a.id.localeCompare(b.id);
}

function buildByChange(data, changeMap, repo) {
  const catalog = data.catalog || {};
  const order = [...(catalog.change_order || []), '_pool', '_misc'];
  const active = data.tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const groups = {};

  for (const t of active) {
    const key = t.change_id || ((t.tags || []).includes('waiting-pool') ? '_pool' : '_misc');
    if (!groups[key]) groups[key] = [];
    groups[key].push(enrichTask(t, data.tasks, changeMap, repo));
  }

  return order
    .filter((id) => groups[id]?.length)
    .map((id) => ({
      id,
      title: catalog.changes?.[id]?.title || (id === '_pool' ? '等待池 ◇' : id === '_misc' ? '其他 backlog ◇' : id),
      summary: catalog.changes?.[id]?.summary || '',
      url: githubUrl(repo, changeMap[id] && corpusPath(changeMap[id])),
      tasks: groups[id].sort(sortTasks),
    }));
}

function buildCriticalPath(data, changeMap, repo) {
  const ids = ['T-004', 'T-010', 'T-011', 'T-012', 'T-013', 'T-014', 'T-015', 'T-016', 'T-017', 'T-018', 'T-019', 'T-020', 'T-022'];
  return ids
    .map((id) => data.tasks.find((x) => x.id === id))
    .filter(Boolean)
    .map((t) => enrichTask(t, data.tasks, changeMap, repo));
}

function loadSiteBoard() {
  if (fs.existsSync(BOARD_CONFIG)) {
    return JSON.parse(fs.readFileSync(BOARD_CONFIG, 'utf8'));
  }
  return {};
}

function corpusFileUrl(repo, relative) {
  return githubUrl(repo, `shadow-corpus/${relative}`);
}

function parseMdTableRows(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let header = null;
  const rows = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('---')) continue;
    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (!header) {
      header = cells;
      continue;
    }
    if (cells.length >= 2) {
      const row = {};
      header.forEach((h, i) => {
        row[h] = cells[i] ?? '';
      });
      rows.push(row);
    }
  }
  return rows;
}

function parseProgressFile(changeDir) {
  const file = path.join(ROOT, 'changes', changeDir, 'progress.md');
  if (!fs.existsSync(file)) return { meta: {}, checklist: [] };
  const raw = fs.readFileSync(file, 'utf8');
  const meta = {};
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m) meta[m[1]] = m[2].replace(/^"|"$/g, '');
    }
  }
  const checklist = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^- \[([ x])\]\s*(.+)$/);
    if (m) checklist.push({ done: m[1] === 'x', text: m[2].trim() });
  }
  return { meta, checklist };
}

function buildChangeDetails(data, changeMap, repo) {
  const catalog = data.catalog || {};
  const order = catalog.change_order || [];
  const changesDir = path.join(ROOT, 'changes');
  const dirs = fs.existsSync(changesDir) ? fs.readdirSync(changesDir) : [];

  return order.map((id) => {
    const dir = dirs.find((d) => d.startsWith(id));
    const progress = dir ? parseProgressFile(dir) : { meta: {}, checklist: [] };
    const tasks = data.tasks.filter((t) => t.change_id === id);
    const done = tasks.filter((t) => t.status === 'done').length;
    const info = catalog.changes?.[id] || {};
    const rel = changeMap[id];
    return {
      id,
      title: info.title || id,
      summary: info.summary || '',
      url: githubUrl(repo, rel && corpusPath(rel)),
      phase: progress.meta.phase || '—',
      assignee: progress.meta.assignee || '—',
      blocked: progress.meta.blocked === 'true',
      taskProgress: `${done}/${tasks.length}`,
      tasks: tasks.map((t) => enrichTask(t, data.tasks, changeMap, repo)),
      checklist: progress.checklist,
    };
  });
}

function buildTaskLibrary(data, changeMap, repo) {
  const catalog = data.catalog || {};
  const changeCatalog = (catalog.change_order || []).map((id) => {
    const tasks = data.tasks.filter((t) => t.change_id === id);
    const done = tasks.filter((t) => t.status === 'done').length;
    const info = catalog.changes?.[id] || {};
    return {
      id,
      title: info.title || id,
      summary: info.summary || '',
      done,
      total: tasks.length,
      url: githubUrl(repo, changeMap[id] && corpusPath(changeMap[id])),
    };
  });

  const allTasks = [...data.tasks]
    .filter((t) => t.status !== 'cancelled')
    .sort((a, b) => {
      const oa = (catalog.change_order || []).indexOf(a.change_id ?? '');
      const ob = (catalog.change_order || []).indexOf(b.change_id ?? '');
      return (oa >= 0 ? oa : 99) - (ob >= 0 ? ob : 99) || sortTasks(a, b);
    })
    .map((t) => enrichTask(t, data.tasks, changeMap, repo));

  const waves = Object.entries(catalog.waves || {}).map(([w, desc]) => ({ wave: w, desc }));

  const gates = Object.entries(data.gates || {}).map(([id, g]) => ({
    id,
    name: g.name,
    owner: g.owner,
    unlocks: g.unlocks || [],
  }));

  return { changeCatalog, allTasks, waves, gates };
}

function buildVisualModule(data, changeMap, repo, siteBoard) {
  const visualTasks = data.tasks
    .filter((t) => t.id.startsWith('V-') || (t.tags || []).includes('visual'))
    .map((t) => enrichTask(t, data.tasks, changeMap, repo));

  const vStats = {
    total: visualTasks.length,
    done: visualTasks.filter((t) => t.status === 'done').length,
    ready: visualTasks.filter((t) => t.ready).length,
  };

  const sceneBriefs = parseMdTableRows(path.join(CORPUS_ROOT, 'visual/stories/fuxduxian/scene-briefs.md')).map(
    (r) => ({
      year: r['年'] || r.year,
      sceneB: r['B 特殊场景 visual_anchor'] || r['B 特殊场景'] || '',
      props: r['key_props'] || '',
      dailyA: r['A daily_micro'] || '',
      sequenceC: r['C sequence 要点'] || '',
    })
  );

  const narrativeGaps = parseMdTableRows(
    path.join(CORPUS_ROOT, 'visual/stories/fuxduxian/narrative-gaps.md')
  ).map((r) => ({
    num: r['#'] || r.num,
    issue: r['问题'] || '',
    example: r['举例'] || '',
    impact: r['视觉影响'] || '',
  }));

  const uxScenes = parseMdTableRows(path.join(CORPUS_ROOT, 'visual/04-ux-flow.md'))
    .filter((r) => r['年'] && /^\d/.test(String(r['年'])))
    .map((r) => ({
      year: r['年'],
      type: r['类型'] || '',
      sceneB: r['B 特殊场景'] || '',
      dailyA: r['A 日常动画'] || '',
      sequenceC: r['C 短片'] || '',
    }));

  const assetsPath = path.join(CORPUS_ROOT, 'visual/registry/assets.csv');
  let assetCount = 0;
  if (fs.existsSync(assetsPath)) {
    assetCount = fs.readFileSync(assetsPath, 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('asset_id')).length;
  }

  const chgProgress = parseProgressFile('CHG-V001-visual-fuxduxian');

  const pipeline = (siteBoard.visualPipeline || []).map((step) => ({
    ...step,
    url: corpusFileUrl(repo, step.artifact),
    task: visualTasks.find((t) => t.artifact && step.artifact.includes(t.artifact.replace(/^visual\//, ''))),
  }));

  return {
    changeId: 'CHG-V001',
    status: 'draft',
    gate: 'G-N1',
    gateNote: '叙事 v2 签字前 layout 均为 draft',
    stats: vStats,
    tasks: visualTasks,
    pipeline,
    deliverables: siteBoard.visualDeliverables || [],
    assetCount,
    sceneBriefs,
    narrativeGaps,
    uxScenes,
    uxTypes: siteBoard.uxTypes || [],
    checklist: chgProgress.checklist,
    links: [
      { label: 'Visual README', path: corpusFileUrl(repo, 'visual/README.md') },
      { label: '流水线', path: corpusFileUrl(repo, 'visual/01-pipeline.md') },
      { label: 'UX 流程', path: corpusFileUrl(repo, 'visual/04-ux-flow.md') },
      { label: 'scene-briefs', path: corpusFileUrl(repo, 'visual/stories/fuxduxian/scene-briefs.md') },
      { label: 'narrative-gaps', path: corpusFileUrl(repo, 'visual/stories/fuxduxian/narrative-gaps.md') },
      { label: 'assets.csv', path: corpusFileUrl(repo, 'visual/registry/assets.csv') },
    ].filter((l) => l.path),
  };
}

function buildCorpusModules(siteBoard, repo) {
  const phases = (siteBoard.harnessPhases || []).map((p) => ({
    ...p,
    url: corpusFileUrl(repo, p.path),
  }));
  const knowledge = (siteBoard.knowledgeLinks || []).map((k) => ({
    ...k,
    url: corpusFileUrl(repo, k.path),
  }));
  const demo = siteBoard.demo
    ? { ...siteBoard.demo, url: corpusFileUrl(repo, siteBoard.demo.path) }
    : null;
  const staticDemo = siteBoard.staticDemo
    ? { ...siteBoard.staticDemo, url: siteBoard.staticDemo.path.startsWith('docs/') ? siteBoard.staticDemo.path.replace(/^docs\//, './') : corpusFileUrl(repo, siteBoard.staticDemo.path) }
    : null;
  return {
    phases,
    knowledge,
    demo,
    staticDemo,
    manifestUrl: corpusFileUrl(repo, 'MANIFEST.md'),
    agentsUrl: corpusFileUrl(repo, 'AGENTS.md'),
  };
}

function build() {
  const config = loadConfig();
  const repo = config.githubRepo;
  const data = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const changeMap = buildChangeMap();
  const phases = data.phases.filter((p) => p !== 'backlog' && p !== 'done');
  const allPhases = [...phases, 'backlog'];

  const active = data.tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const byPhase = {};
  for (const p of allPhases) byPhase[p] = [];
  for (const t of active) {
    const p = byPhase[t.phase] ? t.phase : 'backlog';
    byPhase[p].push(enrichTask(t, data.tasks, changeMap, repo));
  }

  const stats = {
    total: data.tasks.length,
    done: data.tasks.filter((t) => t.status === 'done').length,
    in_progress: data.tasks.filter((t) => t.status === 'in_progress').length,
    blocked: data.tasks.filter((t) => t.status === 'blocked').length,
    ready: data.tasks.filter((t) => isReady(data.tasks, t)).length,
  };

  const teamLoad = data.team.map((p) => {
    const ts = data.tasks.filter((t) => t.assignee === p && t.status !== 'done' && t.status !== 'cancelled');
    return {
      member: p,
      todo: ts.filter((t) => t.status === 'todo').length,
      in_progress: ts.filter((t) => t.status === 'in_progress').length,
      ready: ts.filter((t) => isReady(data.tasks, t)).length,
      waiting: ts.filter((t) => (t.tags || []).includes('waiting-pool') && t.status === 'todo').length,
    };
  });

  const changes = Object.entries(changeMap).map(([id, relPath]) => ({
    id,
    url: githubUrl(repo, corpusPath(relPath)),
  }));

  const siteBoard = loadSiteBoard();
  const taskLibrary = buildTaskLibrary(data, changeMap, repo);
  const changeDetails = buildChangeDetails(data, changeMap, repo);
  const visual = buildVisualModule(data, changeMap, repo, siteBoard);
  const corpus = buildCorpusModules(siteBoard, repo);

  const payload = {
    builtAt: new Date().toISOString(),
    siteTitle: config.siteTitle,
    githubRepo: repo,
    githubRepoUrl: repo ? `https://github.com/${repo}` : null,
    planId: data.plan_id,
    updatedAt: data.updated_at,
    catalog: data.catalog || {},
    phases: allPhases.map((p) => ({ id: p, label: PHASE_LABEL[p] || p })),
    stats,
    byPhase,
    byChange: buildByChange(data, changeMap, repo),
    criticalPath: buildCriticalPath(data, changeMap, repo),
    ready: data.tasks.filter((t) => isReady(data.tasks, t)).map((t) => enrichTask(t, data.tasks, changeMap, repo)),
    inProgress: data.tasks.filter((t) => t.status === 'in_progress').map((t) => enrichTask(t, data.tasks, changeMap, repo)),
    blocked: data.tasks.filter((t) => t.status === 'blocked').map((t) => enrichTask(t, data.tasks, changeMap, repo)),
    teamLoad,
    changes,
    gates: data.gates || {},
    taskLibrary,
    changeDetails,
    visual,
    corpus,
    quickLinks: [
      { label: 'registry.json', path: githubUrl(repo, 'shadow-corpus/06-task-progress/tasks/registry.json') },
      { label: 'TASK-LIBRARY', path: githubUrl(repo, 'shadow-corpus/06-task-progress/tasks/TASK-LIBRARY.md') },
      { label: 'BOARD.md', path: githubUrl(repo, 'shadow-corpus/06-task-progress/BOARD.md') },
      { label: 'MANIFEST', path: corpus.manifestUrl },
    ].filter((l) => l.path),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'board-data.json'), JSON.stringify(payload, null, 2) + '\n');

  const html = fs.readFileSync(path.join(__dirname, 'board-site.template.html'), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);

  console.log(`Built → ${OUT_DIR}/`);
  console.log(`  index.html`);
  console.log(`  board-data.json (${payload.stats.total} tasks, ${payload.stats.ready} ready, visual ${visual.stats.done}/${visual.stats.total})`);
  if (!repo) {
    console.log('\n⚠  Set githubRepo in site.config.json or GITHUB_REPO=owner/repo for GitHub links');
  }
}

build();
