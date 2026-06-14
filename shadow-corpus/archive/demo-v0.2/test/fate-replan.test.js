'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { replanBeatsAfterIntervention } = require('../lib/beats-replan');
const { resolveFateContext, calendarYearForNarrative } = require('../lib/fate-bridge');

const beats = [
  { year: 1, type: 'pivotal', seed: '复读班开学，雨天' },
  { year: 2, type: 'quiet', seed: '二战低7分' },
  { year: 3, type: 'quiet', seed: '二本' }
];

test('replanBeatsAfterIntervention updates future seeds only', () => {
  const out = replanBeatsAfterIntervention({
    beats,
    pivotal_years: [1],
    intervention: { from_year: 1, choice: '告诉父母' }
  });
  assert.equal(out.beats[0].seed, beats[0].seed);
  assert.match(out.beats[1].seed, /告诉父母/);
  assert.ok(out.replanned);
});

test('calendarYearForNarrative defaults to 2019 start', () => {
  assert.equal(calendarYearForNarrative({ age: 18 }, 1), 2019);
  assert.equal(calendarYearForNarrative({ age: 18 }, 7), 2025);
});

test('resolveFateContext returns era_line from world corpus', async () => {
  const ctx = await resolveFateContext({
    runId: 'test',
    profile: { choice: '复读', age: 18 },
    narrativeYear: 1,
    beatType: 'pivotal'
  });
  assert.ok(ctx.era_line);
  assert.equal(ctx.calendar_year, 2019);
});
