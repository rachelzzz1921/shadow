'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

let _jobsDirOverride = null;

function getJobsDir() {
  if (_jobsDirOverride) return _jobsDirOverride;
  const fromEnv = process.env.SHADOW_JOBS_DIR;
  if (fromEnv) {
    return path.isAbsolute(fromEnv)
      ? fromEnv
      : path.join(__dirname, '..', fromEnv);
  }
  return path.join(__dirname, '..', 'runs', 'jobs');
}

const VALID_STATUS = new Set([
  'pending',
  'running',
  'done',
  'failed',
  'orphaned',
  'awaiting_intervention'
]);

function ensureJobsDir() {
  const dir = getJobsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createJobId() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(2).toString('hex');
  return `job_${stamp}_${suffix}`;
}

function jobFilePath(jobId) {
  return path.join(getJobsDir(), `${jobId}.json`);
}

function readJob(jobId) {
  const filePath = jobFilePath(jobId);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJob(job) {
  if (!job?.job_id) throw new Error('writeJob: missing job_id');
  if (!VALID_STATUS.has(job.status)) {
    throw new Error(`writeJob: invalid status ${job.status}`);
  }
  ensureJobsDir();
  job.updated_at = Date.now();
  job.heartbeat_at = Date.now();
  fs.writeFileSync(jobFilePath(job.job_id), JSON.stringify(job, null, 2), 'utf8');
  return job;
}

function listJobFiles() {
  ensureJobsDir();
  return fs.readdirSync(getJobsDir()).filter((f) => f.endsWith('.json'));
}

function createJob({
  profile,
  persona_card = null,
  full_profile = null,
  generation_mode = 'fast',
  intake_snapshot = null
}) {
  const job_id = createJobId();
  const now = Date.now();
  const job = {
    job_id,
    status: 'pending',
    generation_mode: generation_mode === 'full' ? 'full' : 'fast',
    created_at: now,
    updated_at: now,
    stage: {
      current: 'start',
      year_index: 0,
      total_years: 7
    },
    completed_stages: [],
    session: {
      profile,
      persona_card,
      full_profile
    },
    partial: {
      current_year_text: '',
      current_year_index: 0
    },
    result: {
      years: [],
      final: null
    },
    error: null,
    owner_pid: null,
    heartbeat_at: now,
    intake_snapshot: intake_snapshot || null,
    stage_timings: [],
    resolved_interventions: [],
    pending_intervention: null
  };
  writeJob(job);
  return job;
}

module.exports = {
  get JOBS_DIR() { return getJobsDir(); },
  set JOBS_DIR(v) { _jobsDirOverride = v; },
  getJobsDir,
  VALID_STATUS,
  createJobId,
  readJob,
  writeJob,
  listJobFiles,
  createJob
};
