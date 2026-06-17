'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const RUNS_DIR = path.join(__dirname, '..', 'runs');

function ensureRunsDir() {
  if (!fs.existsSync(RUNS_DIR)) {
    fs.mkdirSync(RUNS_DIR, { recursive: true });
  }
}

function createRunId() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${stamp}-${suffix}`;
}

function createRunTrace({ profile, mode = 'live' } = {}) {
  ensureRunsDir();
  const run_id = createRunId();
  const trace = {
    run_id,
    mode,
    started_at: new Date().toISOString(),
    profile: profile ? {
      choice: profile.choice,
      age: profile.age,
      keywords: profile.keywords
    } : null,
    events: [],
    interventions: [],
    errors: [],
    stop_reason: null,
    finished_at: null,
    eval: null
  };
  return trace;
}

function appendEvent(trace, {
  stage,
  status = 'ok',
  payload = null,
  error = null,
  eval: evalResult = null,
  duration_ms = null
}) {
  if (!trace) return trace;
  const event = {
    at: new Date().toISOString(),
    stage,
    status,
    payload,
    error: error ? String(error.message || error) : null
  };
  if (duration_ms != null && Number.isFinite(duration_ms)) {
    event.duration_ms = duration_ms;
  }
  trace.events.push(event);
  if (error) {
    trace.errors.push({ stage, message: event.error, at: event.at });
  }
  if (evalResult) {
    trace.eval = evalResult;
  }
  return trace;
}

function recordIntervention(trace, intervention) {
  if (!trace || !intervention) return trace;
  trace.interventions.push({
    at: new Date().toISOString(),
    ...intervention
  });
  return trace;
}

function persistTrace(trace) {
  if (!trace?.run_id) return null;
  ensureRunsDir();
  const filePath = path.join(RUNS_DIR, `${trace.run_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(trace, null, 2), 'utf8');
  return filePath;
}

function finishRunTrace(trace, { stop_reason, eval: evalResult, session = null } = {}) {
  if (!trace) return null;
  trace.stop_reason = stop_reason || 'unknown';
  trace.finished_at = new Date().toISOString();
  if (evalResult) trace.eval = evalResult;
  if (session) {
    trace.summary = {
      shadow_name: session.persona_card?.name,
      years_completed: session.years?.length || 0,
      pivotal_years: session.pivotal_years,
      final_title: session.final?.title || null
    };
  }
  const filePath = persistTrace(trace);
  return { trace, filePath };
}

function loadRunTrace(runId) {
  const filePath = path.join(RUNS_DIR, `${runId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = {
  RUNS_DIR,
  createRunTrace,
  appendEvent,
  recordIntervention,
  persistTrace,
  finishRunTrace,
  loadRunTrace
};
