'use strict';

const path = require('node:path');
const fs = require('node:fs');

const CATALOG_PATH = path.join(__dirname, '../public/data/shadow-characters-v1.json');

let _catalog = null;

function loadCatalog() {
  if (_catalog) return _catalog;
  _catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  return _catalog;
}

function normalizeGender(g) {
  if (g === 'female' || g === 'male' || g === 'neutral') return g;
  return 'neutral';
}

function ageVibeFromFork(age) {
  const a = Number(age);
  if (!a || Number.isNaN(a)) return 'young_adult';
  if (a <= 17) return 'youth';
  if (a >= 28) return 'mature';
  return 'young_adult';
}

function collectTags(input) {
  const tags = new Set();
  for (const t of input.selectedTags || []) {
    const label = typeof t === 'string' ? t : t.label;
    if (label) tags.add(label);
  }
  for (const k of input.keywords || []) tags.add(k);
  const text = [input.choice_text, input.self_description, input.choice, input.description, input.one_liner]
    .filter(Boolean)
    .join(' ');
  return { tags: [...tags], text };
}

function topDomain(scenarioWeights, scenarioPrimary) {
  if (scenarioPrimary) return scenarioPrimary;
  if (!scenarioWeights) return null;
  let best = null;
  let bestW = -1;
  for (const [d, w] of Object.entries(scenarioWeights)) {
    if (w > bestW) { bestW = w; best = d; }
  }
  return best;
}

/**
 * @param {object} input layerA + tags + optional full_profile fields
 * @returns {{ asset_id, character, score, reasons, alternatives }}
 */
function matchCharacter(input = {}) {
  const catalog = loadCatalog();
  const gender = normalizeGender(input.gender || input.raw?.gender);
  const ageVibe = ageVibeFromFork(input.age_at_fork ?? input.age);
  const { tags, text } = collectTags({
    selectedTags: input.selectedTags || input.raw?.selected_tags?.map(l => ({ label: l })),
    keywords: input.keywords,
    choice_text: input.choice_text || input.choice,
    self_description: input.self_description || input.description,
    one_liner: input.one_liner || input.quote
  });
  const domain = topDomain(input.scenario_weights, input.scenario_domain || input.scenario_primary);
  const archetype = input.archetype || input.persona_archetype || null;

  const scored = catalog.characters.map((ch) => {
    let score = 0;
    const reasons = [];

    if (gender === 'neutral') {
      score += 2;
      reasons.push('gender:neutral');
    } else if (ch.gender_presentation === gender) {
      score += 12;
      reasons.push(`gender:${gender}`);
    } else if (ch.gender_presentation === 'neutral') {
      score += 4;
      reasons.push('gender:neutral_fallback');
    } else {
      score -= 6;
    }

    if (ch.age_vibe === ageVibe) {
      score += 3;
      reasons.push(`age:${ageVibe}`);
    } else if (ch.age_vibe === 'young_adult' && ageVibe === 'youth') {
      score += 1;
    }

    if (domain && (ch.domain_affinity || []).includes(domain)) {
      score += 4;
      reasons.push(`domain:${domain}`);
    }

    if (archetype && (ch.archetype_fit || []).includes(archetype)) {
      score += 5;
      reasons.push(`archetype:${archetype}`);
    } else if ((ch.archetype_fit || []).includes('any')) {
      score += 1;
    }

    for (const hint of ch.intake_tag_hints || []) {
      if (tags.some(t => t.includes(hint) || hint.includes(t))) {
        score += 3;
        reasons.push(`tag:${hint}`);
      }
      if (text.includes(hint)) {
        score += 2;
        reasons.push(`text:${hint}`);
      }
    }

    for (const mood of ch.mood_fit || []) {
      if (text.includes(mood) || tags.some(t => t.includes(mood))) {
        score += 1;
      }
    }

    return { character: ch, score, reasons };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const pick = best?.character || catalog.characters[0];

  return {
    asset_id: pick.asset_id,
    file: pick.file,
    label_zh: pick.label_zh,
    demo_path: pick.demo_path || `visual-characters/${pick.file}`,
    image_url: `/visual-characters/${pick.file}`,
    score: best?.score ?? 0,
    reasons: best?.reasons ?? [],
    alternatives: scored.slice(1, 4).map(s => ({
      asset_id: s.character.asset_id,
      label_zh: s.character.label_zh,
      score: s.score
    }))
  };
}

function matchFromIntakeBody(body) {
  const layerA = body.layerA || {};
  return matchCharacter({
    gender: layerA.gender,
    age_at_fork: layerA.age_at_fork,
    choice_text: layerA.choice_text,
    self_description: layerA.self_description,
    one_liner: layerA.one_liner,
    selectedTags: body.selectedTags,
    scenario_primary: body.scenarioFromText?.scenario_primary,
    scenario_weights: body.scenarioFromText?.scenario_weights
  });
}

module.exports = { loadCatalog, matchCharacter, matchFromIntakeBody };
