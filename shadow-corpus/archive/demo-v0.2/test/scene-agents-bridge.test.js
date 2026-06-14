'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const bridge = require('../lib/scene-agents-bridge');

describe('scene-agents-bridge', () => {
  it('loads all six scene prompts', () => {
    for (const scene of Object.keys(bridge.SCENE_FILES)) {
      const text = bridge.loadScenePrompt(scene);
      assert.ok(text.length > 100, `${scene} prompt too short`);
      assert.match(text, /Shadow Agent/i);
    }
  });

  it('buildSceneAgentSystem concatenates base + scene', () => {
    const system = bridge.buildSceneAgentSystem('academic');
    assert.match(system, /不要写成爽文/);
    assert.match(system, /Academic Shadow Agent/);
  });

  it('resolveSceneFromProfile picks academic for 复读', async () => {
    const scene = await bridge.resolveSceneFromProfile({
      choice: '高考后是否复读',
      keywords: ['不甘', '迷茫']
    });
    assert.equal(scene, 'academic');
  });

  it('buildSceneYearSystem returns system string', async () => {
    const { scene, system } = await bridge.buildSceneYearSystem({
      choice: '要不要离开家乡去大城市',
      keywords: ['迷茫', '逃离']
    });
    assert.ok(['career', 'self_growth', 'family'].includes(scene));
    assert.ok(system.includes('Shadow'));
  });
});
