'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { selectMemories, scoreMemory } = require('../lib/memory-retrieval');
const { memoryFromYear } = require('../lib/story-contract');
const golden = require('../../../fixtures/golden-stories/复读线.json');

test('selectMemories returns top-weight entries up to limit', () => {
  const stream = golden.memory_stream;
  const picked = selectMemories(stream, { limit: 3, at_year: 7 });
  assert.equal(picked.length, 3);
  assert.ok(picked.some(m => m.id === 'm6'));
});

test('selectMemories prefers query overlap for dialogue', () => {
  const stream = golden.memory_stream;
  const picked = selectMemories(stream, { limit: 2, at_year: 6, query: '撕了准考证' });
  assert.ok(picked.some(m => m.id === 'm2'));
});

test('memoryFromYear types align with golden 复读线', () => {
  for (const year of golden.years) {
    const mem = memoryFromYear(year);
    const goldenMem = golden.memory_stream.find(m => m.id === mem.id);
    assert.ok(goldenMem, `missing golden memory ${mem.id}`);
    assert.equal(mem.type, goldenMem.type, `year ${year.year} type`);
  }
});

test('scoreMemory increases with weight', () => {
  const low = scoreMemory({ year: 1, weight: 0.3, content: 'a' }, { at_year: 7 });
  const high = scoreMemory({ year: 1, weight: 0.9, content: 'a' }, { at_year: 7 });
  assert.ok(high > low);
});
