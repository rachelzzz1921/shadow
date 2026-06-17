'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const { buildE2eJobPayload } = require('../lib/e2e-fixture');

const port = Number(process.env.PORT || 3000);
const skip = !process.env.SHADOW_HTTP_TEST;

function request(method, pathname, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathname,
      method,
      headers: payload
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        : {}
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let json = {};
        try { json = data ? JSON.parse(data) : {}; } catch { /* ignore */ }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForJobStatus(jobId, targetStatus, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { status, json } = await request('GET', `/api/story/jobs/${encodeURIComponent(jobId)}`);
    assert.equal(status, 200);
    if (json.status === targetStatus) return json;
    if (json.status === 'failed') {
      throw new Error(`Job failed: ${json.error || 'unknown'}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timeout waiting for job ${jobId} → ${targetStatus}`);
}

test('POST /api/story/jobs lifecycle with intervention (E2E server)', { skip }, async () => {
  const health = await request('GET', '/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.json.e2e, true);

  const created = await request('POST', '/api/story/jobs', buildE2eJobPayload());
  assert.equal(created.status, 202);
  const jobId = created.json.job_id;
  assert.ok(jobId);

  const paused = await waitForJobStatus(jobId, 'awaiting_intervention');
  assert.equal(paused.stage?.intervention_from_year, 1);

  const submitted = await request('POST', `/api/story/jobs/${encodeURIComponent(jobId)}/intervention`, {
    from_year: 1,
    question: paused.stage?.prompt?.question || 'E2E',
    choice: '告诉',
    option_index: 0
  });
  assert.equal(submitted.status, 200);

  const done = await waitForJobStatus(jobId, 'done');
  assert.equal(done.session?.years?.length, 7);
  assert.ok(done.result?.final || done.session?.final);
  assert.ok(Array.isArray(done.stage_timings));
  assert.ok(done.stage_timings.length >= 3);
});
