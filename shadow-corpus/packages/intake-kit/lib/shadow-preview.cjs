'use strict';

const { tagsByCategory } = require('./utils.cjs');

/**
 * Rule-based「影子初读」预览（非最终 Persona）
 */
function buildShadowPreview(layerA, selectedTags) {
  const tagMap = tagsByCategory(selectedTags);
  const traits = tagMap.trait || [];
  const fears = tagMap.fear || [];
  const values = tagMap.value || [];
  const relations = tagMap.relation_pressure || [];

  const lines = [];
  if (traits.length) {
    lines.push(`你像是那种${traits.slice(0, 2).join('、')}的人。`);
  } else if (layerA.self_description) {
    lines.push('你在文字里已经露出一点轮廓了。');
  }

  if (fears.includes('怕被看穿') || values.includes('面子')) {
    lines.push('被看见对你不是小事——你可能更习惯先撑住，再慢慢消化。');
  }

  if (relations.includes('父母期待')) {
    lines.push(
      '父母的期待你扛着——但我们还不确定，那到底是你的目标，还是你以为是自己的目标。'
    );
  } else if (fears.includes('怕自己其实不想要')) {
    lines.push('靠近目标时，你有时会怀疑：这到底是我想要的，还是我应该想要的。');
  }

  if (!lines.length) {
    lines.push('影子还在听你说话——再多选几个词，或把岔路口说具体一点。');
  }

  return lines.join('\n');
}

module.exports = {
  buildShadowPreview
};
