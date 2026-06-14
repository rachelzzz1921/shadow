'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const {
  RUNS_DIR,
  createRunTrace,
  appendEvent,
  recordIntervention,
  persistTrace,
  finishRunTrace,
  loadRunTrace
} = require('../lib/run-trace');

test('run trace persists events and interventions', () => {
  const trace = createRunTrace({ profile: { choice: '测试', age: 20 }, mode: 'test' });
  appendEvent(trace, { stage: 'persona:done', payload: { name: '测试' } });
  recordIntervention(trace, { from_year: 1, choice: '继续撑' });
  const { filePath } = finishRunTrace(trace, { stop_reason: 'completed' });

  assert.ok(fs.existsSync(filePath));
  const loaded = loadRunTrace(trace.run_id);
  assert.equal(loaded.events.length, 1);
  assert.equal(loaded.interventions.length, 1);
  assert.equal(loaded.stop_reason, 'completed');

  fs.unlinkSync(filePath);
});

test('persistTrace updates in-progress run', () => {
  const trace = createRunTrace({ mode: 'test' });
  appendEvent(trace, { stage: 'beats:done' });
  const filePath = persistTrace(trace);
  assert.ok(fs.existsSync(filePath));
  fs.unlinkSync(filePath);
});
