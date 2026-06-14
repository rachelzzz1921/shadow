import { test } from 'node:test';
import assert from 'node:assert/strict';
import { embedLocalTexts, LOCAL_EMBED_DIMENSIONS } from '../lib/embed-local.mjs';

test('embedLocalTexts returns normalized vectors', async () => {
  const [vec] = await embedLocalTexts(['复读线 golden story 验收'], {
    instruction: '为 Shadow 检索'
  });
  assert.equal(vec.length, LOCAL_EMBED_DIMENSIONS);
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
  assert.ok(Math.abs(norm - 1) < 0.01);
});
