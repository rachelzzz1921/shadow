'use strict';

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sampleFateContext } from '../lib/sample-fate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const profile = {
  choice: '如果当年我去复读了',
  birth_year: 2000,
  fork_year: 2018,
  age: 18,
  keywords: ['要强', '怕被看穿', '不甘']
};

const persona_card = {
  name: '阿岚',
  soft_spots: ['把父母期待当成自己想要', '被否定就加倍努力'],
  decision_tendency: '遇到岔路时倾向再努力一次，而不是承认不想要',
  growth_seed: '学会区分「别人期待的我」和「我真正想要的」'
};

const pool = JSON.parse(
  readFileSync(join(__dirname, '../data/years/2019.json'), 'utf8')
);

console.log('=== 复读线 · 叙事第1年 (2019) quiet ===');
const quiet = await sampleFateContext({
  runId: 'demo-fuxu',
  calendarYear: 2019,
  narrativeYear: 1,
  beatType: 'quiet',
  pool,
  profile,
  persona_card
});
console.log(quiet.emphasis_line);
console.log('weights:', quiet.scenario_weights);
console.log('micro:', quiet.micro_sample.map((m) => `[${m.scenario}] ${m.text}`));

console.log('\n=== 叙事第4年 pivotal ===');
const pivotal = await sampleFateContext({
  runId: 'demo-fuxu',
  calendarYear: 2022,
  narrativeYear: 4,
  beatType: 'pivotal',
  pool: JSON.parse(readFileSync(join(__dirname, '../data/years/2022.json'), 'utf8')),
  profile,
  persona_card
});
console.log(pivotal.emphasis_line);
console.log('weights:', pivotal.scenario_weights);
