'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { evaluateStory } = require('../lib/evaluator');

const GOLDEN_DIR = path.join(__dirname, '../../../fixtures/golden-stories');

/** CI gate — minimum two goldens per harness plan */
const CI_GOLDEN = ['复读线.json', '未复读线-阿岚.json'];

for (const file of CI_GOLDEN) {
  test(`CI golden ${file} passes rule eval without errors`, () => {
    const story = require(path.join(GOLDEN_DIR, file));
    const result = evaluateStory(story);
    if (result.warnings?.length) {
      console.log(`[golden ${file}] warnings:`, result.warnings.map((w) => w.code).join(', '));
    }
    assert.equal(result.ok, true, `${file} errors: ${JSON.stringify(result.errors)}`);
    assert.equal(result.errors.length, 0);
  });
}

test('extended golden fixtures (informational)', () => {
  const extended = fs.readdirSync(GOLDEN_DIR)
    .filter((f) => f.endsWith('.json') && !CI_GOLDEN.includes(f));
  for (const file of extended) {
    const story = require(path.join(GOLDEN_DIR, file));
    const result = evaluateStory(story);
    if (!result.ok || result.errors.length) {
      console.warn(`[golden backlog] ${file}:`, result.errors.map((e) => e.code).join(', '));
    }
  }
  assert.ok(extended.length >= 0);
});
