'use strict';

const { createRunTrace, persistTrace, finishRunTrace } = require('./run-trace');
const { readJob, writeJob, listJobFiles, createJob } = require('./job-store');

const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS || 1);
const TOTAL_YEARS = 7;

/** @type {import('./job-manager')} */
let singleton = null;

function yearStageName(i) {
  return `year_${i}`;
}

function stageOrder() {
  const order = ['start'];
  for (let i = 1; i <= TOTAL_YEARS; i += 1) order.push(yearStageName(i));
  order.push('final');
  return order;
}

class JobManager {
  constructor() {
    this.running_count = 0;
    this.pending_queue = [];
    /** @type {Map<string, { id: number, events: { id: number, event: string, data: object }[] }>} */
    this.streams = new Map();
    /** @type {Map<string, Promise<void>>} */
    this.activeRuns = new Map();
    this.storySession = null;
    this.booted = false;
  }

  setStorySession(storySession) {
    this.storySession = storySession;
  }

  getStorySession() {
    if (this.storySession) return this.storySession;
    this.storySession = require('./story-session');
    return this.storySession;
  }

  // ── A. 进程启动时,扫盘捞孤儿 ─────────────────────────────────────────
  boot() {
    if (this.booted) return;
    this.booted = true;
    for (const file of listJobFiles()) {
      const jobId = file.replace(/\.json$/, '');
      const job = readJob(jobId);
      if (!job) continue;

      if (job.status === 'done' || job.status === 'failed') {
        continue;
      }

      if (job.status === 'pending') {
        this.enqueue(job);
        continue;
      }

      if (job.status === 'running' || job.status === 'orphaned') {
        job.status = 'orphaned';
        writeJob(job);
        this.enqueue_for_resume(job);
      }
    }
  }

  enqueue(job) {
    if (!this.pending_queue.some((j) => j.job_id === job.job_id)) {
      this.pending_queue.push(job);
    }
    this.tryStartNext();
  }

  enqueue_for_resume(job) {
    this.enqueue(job);
  }

  // ── Concurrency 闸 ───────────────────────────────────────────────────
  submit(job) {
    if (this.running_count < MAX_CONCURRENT_JOBS) {
      this.start(job);
    } else {
      job.status = 'pending';
      writeJob(job);
      this.pending_queue.push(job);
      this.emitJobEvent(job.job_id, 'job:queued', { job_id: job.job_id, status: 'pending' });
    }
    return job;
  }

  start(job) {
    this.running_count += 1;
    job.status = 'running';
    job.owner_pid = process.pid;
    job.error = null;
    writeJob(job);
    this.emitJobEvent(job.job_id, 'job:started', { job_id: job.job_id, status: 'running' });

    const runPromise = this.run_async(job)
      .catch((err) => {
        console.error(`[JobManager] job ${job.job_id} failed:`, err.message);
      })
      .finally(() => {
        this.release(job);
      });
    this.activeRuns.set(job.job_id, runPromise);
  }

  release(job) {
    this.running_count = Math.max(0, this.running_count - 1);
    this.activeRuns.delete(job.job_id);
    if (this.pending_queue.length > 0) {
      const next = this.pending_queue.shift();
      this.start(next);
    }
  }

  tryStartNext() {
    while (this.running_count < MAX_CONCURRENT_JOBS && this.pending_queue.length > 0) {
      const next = this.pending_queue.shift();
      if (next.status === 'done' || next.status === 'failed') continue;
      this.start(next);
    }
  }

  createAndSubmit(input) {
    const job = createJob(input);
    return this.submit(job);
  }

  retryJob(jobId) {
    const job = readJob(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }
    job.status = 'pending';
    job.error = null;
    writeJob(job);
    return this.submit(job);
  }

  getJob(jobId) {
    return readJob(jobId);
  }

  mark_done(job, stageName, payload) {
    if (!job.completed_stages.includes(stageName)) {
      job.completed_stages.push(stageName);
    }

    if (stageName === 'start') {
      job.session = payload.session;
      job.stage = {
        current: 'year',
        year_index: 0,
        total_years: job.session?.beats?.length || TOTAL_YEARS
      };
    } else if (stageName.startsWith('year_')) {
      const i = Number(stageName.split('_')[1]);
      job.session = payload.session;
      while (job.result.years.length < i) job.result.years.push('');
      job.result.years[i - 1] = payload.year?.event || payload.year?.title || '';
      job.stage = {
        current: i >= TOTAL_YEARS ? 'final' : 'year',
        year_index: i,
        total_years: job.session?.beats?.length || TOTAL_YEARS
      };
      job.partial = {
        current_year_text: '',
        current_year_index: i
      };
    } else if (stageName === 'final') {
      job.session = payload.session;
      job.result.final = payload.final;
      job.stage = {
        current: 'done',
        year_index: TOTAL_YEARS,
        total_years: TOTAL_YEARS
      };
      job.partial = {
        current_year_text: '',
        current_year_index: TOTAL_YEARS
      };
    }

    writeJob(job);
    this.emitJobEvent(job.job_id, 'job:stage_done', {
      job_id: job.job_id,
      stage: stageName,
      completed_stages: [...job.completed_stages],
      stage_info: job.stage
    });
  }

  buildOnStage(jobId, trace) {
    const ss = this.getStorySession();
    return (stage, payload) => {
      const job = readJob(jobId);
      if (!job) return;

      if (stage === 'year:partial') {
        job.partial = {
          current_year_text: payload?.event || payload?.title || '',
          current_year_index: payload?.year ?? job.partial?.current_year_index ?? 0
        };
        writeJob(job);
      }

      this.emitJobEvent(jobId, stage, payload || {});

      if (stage === 'beats:done' && job.session && !job.session.beats) {
        /* session updated in mark_done start */
      }

      if (trace) {
        const { appendEvent } = require('./run-trace');
        appendEvent(trace, { stage, payload });
      }
    };
  }

  // ── B. 续跑——从哪接着跑 ─────────────────────────────────────────────
  async resume_job(job) {
    const done = new Set(job.completed_stages);
    const ss = this.getStorySession();
    const { loadRunTrace } = require('./run-trace');

    let trace = job.session?.run_id ? loadRunTrace(job.session.run_id) : null;
    if (!trace) {
      trace = createRunTrace({ profile: job.session?.profile, mode: 'live' });
    }

    const onStage = this.buildOnStage(job.job_id, trace);
    const runtime = require('./llm-runtime').createLiveRuntime();

    if (!done.has('start')) {
      const bootstrap = job.session || {};
      const session = await ss.startStorySession({
        profile: bootstrap.profile,
        persona_card: bootstrap.persona_card || null,
        full_profile: bootstrap.full_profile || null,
        generation_mode: job.generation_mode,
        runtime,
        trace,
        onStage
      });
      session.run_id = trace.run_id;
      persistTrace(trace);
      this.mark_done(job, 'start', { session });
      job = readJob(job.job_id);
      done.add('start');
    }

    for (let i = 1; i <= TOTAL_YEARS; i += 1) {
      const stage = yearStageName(i);
      if (done.has(stage)) continue;

      job = readJob(job.job_id);
      job.stage = {
        current: 'year',
        year_index: i - 1,
        total_years: job.session?.beats?.length || TOTAL_YEARS
      };
      job.partial = {
        current_year_text: '',
        current_year_index: i
      };
      writeJob(job);

      const result = await ss.generateNextYear({
        session: job.session,
        user_intervention: null,
        runtime,
        trace,
        onStage
      });
      persistTrace(trace);
      this.mark_done(job, stage, result);
      job = readJob(job.job_id);
      done.add(stage);
    }

    if (!done.has('final')) {
      job = readJob(job.job_id);
      const fin = await ss.finishStorySession({
        session: job.session,
        runtime,
        trace
      });
      persistTrace(trace);
      finishRunTrace(trace, {
        stop_reason: 'completed',
        eval: fin.eval,
        session: fin.session
      });
      this.mark_done(job, 'final', fin);
      job = readJob(job.job_id);
    }

    job.status = 'done';
    writeJob(job);
    this.emitJobEvent(job.job_id, 'job:done', { job_id: job.job_id, status: 'done' });
    return job;
  }

  async run_async(job) {
    try {
      job = readJob(job.job_id);
      await this.resume_job(job);
    } catch (error) {
      job = readJob(job.job_id);
      if (job && job.status !== 'done') {
        job.status = 'failed';
        job.error = error.message || String(error);
        writeJob(job);
        this.emitJobEvent(job.job_id, 'job:failed', {
          job_id: job.job_id,
          status: 'failed',
          error: job.error,
          completed_stages: job.completed_stages,
          stage: job.stage
        });
      }
      throw error;
    }
  }

  // ── SSE subscribers ──────────────────────────────────────────────────
  _streamState(jobId) {
    if (!this.streams.has(jobId)) {
      this.streams.set(jobId, { id: 0, events: [] });
    }
    return this.streams.get(jobId);
  }

  emitJobEvent(jobId, event, data) {
    const state = this._streamState(jobId);
    state.id += 1;
    const entry = { id: state.id, event, data };
    state.events.push(entry);
    if (state.events.length > 500) state.events.shift();
    for (const sub of state.subscribers || []) {
      this._writeSse(sub.res, entry.id, entry.event, entry.data);
    }
  }

  subscribeSse(jobId, res, lastEventId = 0) {
    const state = this._streamState(jobId);
    if (!state.subscribers) state.subscribers = new Set();
    const sub = { res, lastEventId };
    state.subscribers.add(sub);

    const job = readJob(jobId);
    if (job) {
      this._writeSse(res, 0, 'job:snapshot', job);
    }

    for (const entry of state.events) {
      if (entry.id > lastEventId) {
        this._writeSse(res, entry.id, entry.event, entry.data);
      }
    }

    res.on('close', () => {
      state.subscribers.delete(sub);
    });
  }

  _writeSse(res, id, event, data) {
    if (res.writableEnded) return;
    res.write(`id: ${id}\n`);
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data ?? {})}\n\n`);
  }
}

function getJobManager() {
  if (!singleton) {
    singleton = new JobManager();
  }
  return singleton;
}

module.exports = {
  JobManager,
  getJobManager,
  MAX_CONCURRENT_JOBS,
  yearStageName,
  stageOrder
};
