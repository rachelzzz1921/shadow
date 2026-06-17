'use strict';

const MAX_JOBS = 20;
const MAX_SAMPLES_PER_STAGE = 200;

/** @type {Map<string, number[]>} */
const samples = new Map();

function recordStageTiming(stage, ms) {
  if (!stage || typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return;
  if (!samples.has(stage)) samples.set(stage, []);
  const list = samples.get(stage);
  list.push(ms);
  while (list.length > MAX_SAMPLES_PER_STAGE) list.shift();
}

function recordJobTimings(stageTimings = []) {
  for (const entry of stageTimings) {
    if (entry?.stage && typeof entry.ms === 'number') {
      recordStageTiming(entry.stage, entry.ms);
    }
  }
}

function p50(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function getStageP50Summary() {
  const out = {};
  for (const [stage, list] of samples.entries()) {
    const val = p50(list);
    if (val != null) out[stage] = val;
  }
  return out;
}

function resetStageTimingStats() {
  samples.clear();
}

module.exports = {
  MAX_JOBS,
  recordStageTiming,
  recordJobTimings,
  getStageP50Summary,
  resetStageTimingStats,
  p50
};
