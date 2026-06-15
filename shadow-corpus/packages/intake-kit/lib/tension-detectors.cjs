'use strict';

const { findQuestionAnswer } = require('./utils.cjs');

function detectTensionFlags(layerA, tagMap, answers) {
  const flags = [];
  const selfDesc = layerA.self_description || '';
  const claimsIndependent =
    /独立|自己扛|不太在乎别人|自己说了算/.test(selfDesc) ||
    (tagMap.trait || []).some((t) => /独立/.test(t));

  const q04 = findQuestionAnswer(answers, 'SH-Q04');
  const q09 = findQuestionAnswer(answers, 'SH-Q09');
  const relationHeavy = q04?.answer?.optionKey !== 'D';
  const seeksReassurance = q09?.answer?.optionKey === 'B';

  if (claimsIndependent && (relationHeavy || seeksReassurance)) {
    flags.push({
      type: 'self_report_vs_behavior',
      detail: '自述强调独立，但关系题与前夜行为指向外部依赖',
      note:
        '可能存在「我应该独立」的自我要求与真实需要之间的裂缝——Persona 应将此作为核心冲突。'
    });
  }

  const q06 = findQuestionAnswer(answers, 'SH-Q06');
  const q10 = findQuestionAnswer(answers, 'SH-Q10');
  if (q06?.answer?.value >= 76 && q10?.answer?.optionKey === 'D') {
    flags.push({
      type: 'persistence_vs_detachment',
      detail: '「再试一次」倾向很高，但自我形容选「随便吧」',
      note: '「假装无所谓」可能盖住真实的不甘心——叙事里应保留这层张力。'
    });
  }

  if ((tagMap.value || []).includes('面子') && findQuestionAnswer(answers, 'SH-Q07')?.answer?.optionKey === 'B') {
    flags.push({
      type: 'value_conflict',
      detail: '标签与自述护住面子，但行为题选了「难看也要真实」',
      note: '面子与真实之间的裂缝——pivotal 年可用一次丢脸但真实的选择试探。'
    });
  }

  if ((tagMap.value || []).includes('真实') && findQuestionAnswer(answers, 'SH-Q07')?.answer?.optionKey === 'A') {
    flags.push({
      type: 'value_conflict',
      detail: '你说重视真实，但取舍时会先护住体面',
      note: '自我叙述与行为取舍不一致——Persona 应写出这层自我欺骗。'
    });
  }

  return flags;
}

module.exports = {
  detectTensionFlags
};
