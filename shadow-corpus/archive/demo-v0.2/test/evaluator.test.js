'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const { evaluateStory, evaluateYear, evaluateBeats, evaluateVisualConsistency } = require('../lib/evaluator');
const golden = require('../../../04-dev-testing/golden-stories/复读线.json');

test('golden story 复读线 passes rule eval without errors', () => {
  const result = evaluateStory(golden);
  assert.equal(result.errors.length, 0, result.errors.map(e => e.message).join('; '));
  assert.ok(result.score >= 70);
});

test('evaluateBeats flags too many pivotal years', () => {
  const beats = Array.from({ length: 7 }, (_, i) => ({
    year: i + 1,
    type: 'pivotal',
    seed: '大事'
  }));
  const findings = evaluateBeats(beats, [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(findings.some(f => f.code === 'beats.pivotal_count'));
});

test('evaluateYear rejects quiet year with intervention', () => {
  const findings = evaluateYear(
    {
      year: 2,
      is_pivotal: false,
      event: '短句。',
      intervention_prompt: { question: '选什么？', options: ['A', 'B'] },
      memory_summary: '年2：撕了准考证',
      shadow_dialogue: '轻。'
    },
    { type: 'quiet' }
  );
  assert.ok(findings.some(f => f.code === 'year.quiet_intervention'));
});

test('evaluateVisualConsistency warns when only some years have visual_anchor', () => {
  const years = [
    { year: 1, visual_anchor: '雨窗', key_props: ['书包', '课桌'] },
    { year: 2 },
    { year: 3 }
  ];
  const findings = evaluateVisualConsistency(years);
  assert.ok(findings.some(f => f.code === 'visual.partial'));
});

test('未复读线标杆 JSON passes v2 rule eval without errors', () => {
  const benchmarkPath = path.join(__dirname, '../../../../docs/stories/未复读线-阿岚.json');
  const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
  const result = evaluateStory(benchmark, { lengthStandard: 'v2' });
  assert.equal(result.errors.length, 0, result.errors.map((e) => e.message).join('; '));
});

test('fast evaluateYear accepts ~100 char event on live path', () => {
  const event = '春'.repeat(100);
  const findings = evaluateYear(
    {
      year: 2,
      is_pivotal: true,
      event,
      visual_anchor: '教室窗边',
      key_props: ['课桌', '阳光'],
      intervention_prompt: { question: '继续吗', options: ['继续', '停下'] }
    },
    { type: 'pivotal' },
    { lengthStandard: 'fast', isLive: true }
  );
  assert.ok(!findings.some((f) => f.code === 'year.event_volume' && f.severity === 'error'));
});
