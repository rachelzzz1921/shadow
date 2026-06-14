#!/usr/bin/env node
/**
 * harness-live-smoke.mjs — mock runtime 跑通 start → year×N → final
 *
 * Usage:
 *   node harness-live-smoke.mjs          # 2 年快速 smoke
 *   node harness-live-smoke.mjs --full   # 7 年 + 1 intervention
 */
'use strict';

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(__dirname, '../../archive/demo-v0.2');

const { createQueueRuntime } = require(path.join(demoRoot, 'lib/llm-runtime'));
const { createRunTrace } = require(path.join(demoRoot, 'lib/run-trace'));
const {
  startStorySession,
  generateNextYear,
  finishStorySession
} = require(path.join(demoRoot, 'lib/story-session'));

const FULL = process.argv.includes('--full');
const YEAR_COUNT = FULL ? 7 : 2;

function year(n) {
  const pivotal = [1, 4, 6].includes(n);
  return {
    year: n,
    age: 18 + n,
    is_pivotal: pivotal,
    title: `Y${n}`,
    scene: n >= 5 ? 'night' : 'rain',
    environment: n === 4 ? 'stage' : 'classroom',
    pose: 'wait',
    prop: 'desk',
    city: 'city2',
    event: pivotal
      ? `第${n}年，你站在岔路口，雨或灯都还在，你选了继续撑下去。`
      : `第${n}年，安静像一层灰。`,
    decision_made: '继续撑',
    intervention_prompt: pivotal
      ? { question: `年${n}选择？`, options: ['告诉', '不说'] }
      : null,
    emotion: { label: '低', value: 4 },
    new_mood: 4,
    new_esteem: 5,
    reflection: '怕被看见。',
    shadow_dialogue: '还在这里。',
    memory_summary: `年${n}：记忆片段`
  };
}

function buildQueue() {
  const queue = [
    { name: '阿岚', core_traits: ['要强'], soft_spots: ['期待'], decision_tendency: '撑', growth_seed: '够了' },
    {
      beats: Array.from({ length: 7 }, (_, i) => ({
        year: i + 1,
        type: [1, 4, 6].includes(i + 1) ? 'pivotal' : 'quiet',
        seed: `s${i + 1}`
      })),
      pivotal_years: [1, 4, 6]
    }
  ];
  for (let n = 1; n <= YEAR_COUNT; n += 1) queue.push(year(n));
  queue.push({
    title: '收束',
    message: '我后来知道，有些路走一遍就够了，不必每条都走到黑。',
    regret: '没早点说不想。',
    scene: 'home',
    emotion_arc: '从紧绷到平稳'
  });
  return createQueueRuntime(queue);
}

async function main() {
  const runtime = buildQueue();
  const trace = createRunTrace({ profile: { choice: '复读', age: 18 }, mode: FULL ? 'smoke-full' : 'smoke-cli' });
  let session = await startStorySession({
    profile: { choice: '复读', age: 18 },
    runtime,
    trace
  });

  for (let i = 0; i < YEAR_COUNT; i += 1) {
    const intervention = i === 1
      ? { from_year: 1, choice: '告诉' }
      : null;
    const result = await generateNextYear({
      session,
      runtime,
      trace,
      user_intervention: intervention
    });
    session = result.session;
  }

  const final = await finishStorySession({ session, runtime, trace });
  const out = {
    mode: FULL ? 'full' : 'quick',
    years: session.years.length,
    ok: final.eval.ok,
    score: final.eval.score,
    run_id: trace.run_id,
    stages: trace.events.map(e => e.stage),
    interventions: trace.interventions.length
  };
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.ok ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
