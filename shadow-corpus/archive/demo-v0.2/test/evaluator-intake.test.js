'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateIntakeConsistency } = require('../lib/evaluator');

test('evaluateIntakeConsistency flags missing schema_version', () => {
  const findings = evaluateIntakeConsistency({ meta: {}, tension_flags: [{}] }, {});
  assert.ok(findings.some((f) => f.code === 'intake.schema_version'));
});

test('evaluateIntakeConsistency passes v1 structured profile', () => {
  const findings = evaluateIntakeConsistency({
    meta: { schema_version: 1 },
    raw: { selected_tags: [{ label: '要强', category_id: 'trait' }] },
    tension_flags: [{ type: 'self_report_vs_behavior', detail: '独立与依赖' }],
    scenario_weights: { academic: 0.4, love: 0.1, family: 0.1, friendship: 0.1, career: 0.1, self_growth: 0.2 }
  }, {
    core_tension: '独立与依赖之间的裂缝'
  });
  assert.equal(findings.filter((f) => f.severity === 'error').length, 0);
});
