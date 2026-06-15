'use strict';

const { FULL_PROFILE_SCHEMA_VERSION } = require('./schema.cjs');
const { buildFullProfile, normalizeScenarioWeights, SCENARIO_DOMAINS } = require('./build-full-profile.cjs');
const { buildShadowPreview } = require('./shadow-preview.cjs');
const { detectTensionFlags } = require('./tension-detectors.cjs');
const { applyMapsTo, reduceMapsFromAnswers } = require('./maps-to-reducer.cjs');

module.exports = {
  FULL_PROFILE_SCHEMA_VERSION,
  SCENARIO_DOMAINS,
  buildFullProfile,
  buildShadowPreview,
  detectTensionFlags,
  normalizeScenarioWeights,
  applyMapsTo,
  reduceMapsFromAnswers
};
