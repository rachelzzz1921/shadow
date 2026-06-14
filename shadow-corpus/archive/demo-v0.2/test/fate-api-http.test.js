'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');
const path = require('node:path');

/**
 * Lightweight HTTP probe — requires archive demo server on PORT (optional in CI).
 * Skip when SHADOW_SKIP_HTTP=1
 */
test('POST /api/fate/context returns FateResult when server up', { skip: !process.env.SHADOW_HTTP_TEST }, async () => {
  const port = Number(process.env.PORT || 3000);
  const body = JSON.stringify({ profile: { age: 18 }, narrative_year: 1 });

  await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/api/fate/context',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const json = JSON.parse(data);
        assert.ok(json.hint);
        assert.equal(json.calendar_year, 2019);
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
});
