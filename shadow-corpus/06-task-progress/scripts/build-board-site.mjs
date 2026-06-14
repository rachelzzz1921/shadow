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
    quickLinks: [
      { label: '任务库 registry', path: githubUrl(repo, 'shadow-corpus/06-task-progress/tasks/registry.json') },
      { label: 'Visual 模块', path: githubUrl(repo, 'shadow-corpus/visual/README.md') },
      { label: 'Harness 框架图', path: githubUrl(repo, 'shadow-corpus/02-technical-design/00-harness-framework-diagram.md') },
      { label: 'MANIFEST', path: githubUrl(repo, 'shadow-corpus/MANIFEST.md') },
      { label: 'BOARD.md 源码', path: githubUrl(repo, 'shadow-corpus/06-task-progress/BOARD.md') },
    ].filter((l) => l.path),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'board-data.json'), JSON.stringify(payload, null, 2) + '\n');

  const html = fs.readFileSync(path.join(__dirname, 'board-site.template.html'), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);

  console.log(`Built → ${OUT_DIR}/`);
  console.log(`  index.html`);
  console.log(`  board-data.json (${payload.stats.total} tasks, ${payload.stats.ready} ready)`);
  if (!repo) {
    console.log('\n⚠  Set githubRepo in site.config.json or GITHUB_REPO=owner/repo for GitHub links');
  }
}

build();
