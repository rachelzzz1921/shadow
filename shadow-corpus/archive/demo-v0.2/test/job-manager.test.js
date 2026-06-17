'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const jobStore = require('../lib/job-store');
const { createQueueRuntime } = require('../lib/llm-runtime');
const { JobManager, yearStageName } = require('../lib/job-manager');

const noopRuntime = createQueueRuntime([]);

function tmpJobsDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'shadow-jobs-'));
}

test('resume_job skips completed stages and continues session', async () => {
  const jobsDir = tmpJobsDir();
  const originalDir = jobStore.JOBS_DIR;
  Object.defineProperty(jobStore, 'JOBS_DIR', { value: jobsDir, configurable: true });

  const calls = [];
  const beats = Array.from({ length: 7 }, (_, i) => ({
    year: i + 1,
    type: i === 0 ? 'pivotal' : 'quiet'
  }));

  const mockSession = {
    startStorySession: async ({ profile }) => {
      calls.push('start');
      return {
        profile,
        beats,
        pivotal_years: [1],
        years: [],
        memory_stream: [],
        persona_card: { name: '测试' },
        generation_mode: 'fast'
      };
    },
    generateNextYear: async ({ session }) => {
      const next = session.years.length + 1;
      calls.push(`year_${next}`);
      return {
        session: {
          ...session,
          years: [...session.years, { year: next, event: `第${next}年内容`, title: `第${next}年` }],
          memory_stream: [...(session.memory_stream || []), { id: `m${next}`, content: `mem${next}` }]
        },
        year: { year: next, event: `第${next}年内容`, title: `第${next}年` }
      };
    },
    finishStorySession: async ({ session }) => {
      calls.push('final');
      return {
        session: { ...session, final: { title: '终局', message: '收束' } },
        final: { title: '终局', message: '收束' }
      };
    }
  };

  const jm = new JobManager({ runtime: noopRuntime });
  jm.setStorySession(mockSession);

  const job = jobStore.createJob({
    profile: { choice: '测试岔路', age: 18 },
    generation_mode: 'fast'
  });
  job.completed_stages = ['start', 'year_1'];
  job.session = {
    profile: { choice: '测试岔路', age: 18 },
    beats,
    pivotal_years: [1],
    years: [{ year: 1, event: '第一年', title: '第1年' }],
    memory_stream: [{ id: 'm1', content: 'mem1' }],
    persona_card: { name: '测试' },
    generation_mode: 'fast'
  };
  job.result.years = ['第一年'];
  job.status = 'orphaned';
  jobStore.writeJob(job);

  await jm.resume_job(job);

  assert.deepEqual(calls, ['year_2', 'year_3', 'year_4', 'year_5', 'year_6', 'year_7', 'final']);
  assert.equal(calls.includes('start'), false);

  const saved = jobStore.readJob(job.job_id);
  assert.equal(saved.status, 'done');
  assert.ok(saved.completed_stages.includes('year_2'));
  assert.ok(saved.completed_stages.includes('final'));
  assert.equal(saved.session.years.length, 7);
  assert.equal(saved.session.memory_stream.length, 7);

  Object.defineProperty(jobStore, 'JOBS_DIR', { value: originalDir, configurable: true });
  fs.rmSync(jobsDir, { recursive: true, force: true });
});

test('boot marks running jobs as orphaned and enqueues resume', async () => {
  const jobsDir = tmpJobsDir();
  const originalDir = jobStore.JOBS_DIR;
  Object.defineProperty(jobStore, 'JOBS_DIR', { value: jobsDir, configurable: true });

  const job = jobStore.createJob({
    profile: { choice: '孤儿测试', age: 20 },
    generation_mode: 'fast'
  });
  job.status = 'running';
  job.owner_pid = 99999;
  jobStore.writeJob(job);

  const jm = new JobManager({ runtime: noopRuntime });
  let resumeCalled = false;
  jm.resume_job = async (j) => {
    resumeCalled = true;
    j.status = 'done';
    jobStore.writeJob(j);
    return j;
  };
  jm.run_async = async (j) => {
    try {
      await jm.resume_job(j);
    } finally {
      jm.release(j);
    }
  };

  jm.boot();
  await new Promise((r) => setTimeout(r, 80));

  const saved = jobStore.readJob(job.job_id);
  assert.ok(resumeCalled);
  assert.equal(saved.status, 'done');

  Object.defineProperty(jobStore, 'JOBS_DIR', { value: originalDir, configurable: true });
  fs.rmSync(jobsDir, { recursive: true, force: true });
});

test('submit queues when at MAX concurrency', () => {
  const jobsDir = tmpJobsDir();
  const originalDir = jobStore.JOBS_DIR;
  Object.defineProperty(jobStore, 'JOBS_DIR', { value: jobsDir, configurable: true });

  const jm = new JobManager({ runtime: noopRuntime });
  jm.running_count = 1;
  const job = jobStore.createJob({
    profile: { choice: '排队测试', age: 18 },
    generation_mode: 'fast'
  });
  jm.submit(job);
  assert.equal(job.status, 'pending');
  assert.equal(jm.pending_queue.length, 1);

  Object.defineProperty(jobStore, 'JOBS_DIR', { value: originalDir, configurable: true });
  fs.rmSync(jobsDir, { recursive: true, force: true });
});

test('submitIntervention resumes job after pivotal pause', async () => {
  const jobsDir = tmpJobsDir();
  const originalDir = jobStore.JOBS_DIR;
  Object.defineProperty(jobStore, 'JOBS_DIR', { value: jobsDir, configurable: true });

  const beats = Array.from({ length: 7 }, (_, i) => ({
    year: i + 1,
    type: i === 0 ? 'pivotal' : 'quiet'
  }));

  let generateCalls = 0;
  const mockSession = {
    startStorySession: async ({ profile }) => ({
      profile,
      beats,
      pivotal_years: [1],
      years: [],
      memory_stream: [],
      persona_card: { name: '测试' },
      generation_mode: 'fast',
      run_id: 'trace-test'
    }),
    generateNextYear: async ({ session, user_intervention }) => {
      generateCalls += 1;
      const next = session.years.length + 1;
      const year = {
        year: next,
        event: user_intervention
          ? `第${next}年·${user_intervention.choice}`
          : `第${next}年内容`,
        title: `第${next}年`,
        intervention_prompt: next === 1
          ? { question: '告诉父母吗？', options: ['告诉', '不说'] }
          : null
      };
      return {
        session: {
          ...session,
          years: [...session.years, year],
          memory_stream: [...(session.memory_stream || []), { id: `m${next}`, content: `mem${next}` }]
        },
        year
      };
    },
    finishStorySession: async ({ session }) => ({
      session: { ...session, final: { title: '终局', message: '收束' } },
      final: { title: '终局', message: '收束' }
    })
  };

  const jm = new JobManager({ runtime: noopRuntime });
  jm.setStorySession(mockSession);

  const job = jobStore.createJob({
    profile: { choice: '测试岔路', age: 18 },
    generation_mode: 'fast'
  });
  jm.start(job);
  await new Promise((r) => setTimeout(r, 50));

  let saved = jobStore.readJob(job.job_id);
  assert.equal(saved.status, 'awaiting_intervention');
  assert.equal(saved.session.years.length, 1);
  assert.equal(generateCalls, 1);

  jm.submitIntervention(job.job_id, {
    from_year: 1,
    question: '告诉父母吗？',
    choice: '告诉',
    option_index: 0
  });

  await new Promise((r) => setTimeout(r, 120));

  saved = jobStore.readJob(job.job_id);
  assert.equal(saved.status, 'done');
  assert.equal(saved.session.years.length, 7);
  assert.ok(saved.session.years[1].event.includes('告诉'));

  Object.defineProperty(jobStore, 'JOBS_DIR', { value: originalDir, configurable: true });
  fs.rmSync(jobsDir, { recursive: true, force: true });
});

test('yearStageName follows fixed naming', () => {
  assert.equal(yearStageName(1), 'year_1');
  assert.equal(yearStageName(7), 'year_7');
});
