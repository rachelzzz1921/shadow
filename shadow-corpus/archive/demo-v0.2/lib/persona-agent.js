'use strict';

/**
 * Persona Agent — full_profile → persona JSON
 * System prompt: repo 根 persona_agent_prompt.md（与 docs/demo-persona-agent.js 规则版互补）
 */

const fs = require('node:fs');
const path = require('node:path');
const { PersonaAgentSchema } = require('./schemas');
const { createLiveRuntime } = require('./llm-runtime');

const PROMPT_CANDIDATES = [
  path.join(__dirname, '../../../../persona_agent_prompt.md'),
  path.join(__dirname, '../../../persona_agent_prompt.md'),
  path.join(process.cwd(), 'persona_agent_prompt.md')
];

let cachedSystem = null;

function loadPersonaSystemPrompt() {
  if (cachedSystem) return cachedSystem;
  for (const p of PROMPT_CANDIDATES) {
    try {
      cachedSystem = fs.readFileSync(p, 'utf8').trim();
      return cachedSystem;
    } catch {
      /* try next */
    }
  }
  cachedSystem = `你是 Shadow Persona Agent。输入 full_profile JSON，只输出 persona JSON。
行为题 > 标签 > 自我叙述。禁止照抄标签。禁止鸡汤。`;
  return cachedSystem;
}

function buildPersonaAnalyzePrompt(fullProfile) {
  return [
    '# 输入 full_profile',
    '```json',
    JSON.stringify(fullProfile, null, 2),
    '```',
    '',
    '请严格按 system prompt 第八节输出 persona JSON。只输出 JSON，不要 markdown 代码块，不要解释。'
  ].join('\n');
}

function personaToPersonaCard(persona) {
  if (!persona) return null;
  return {
    name: persona.shadow_name,
    core_traits: persona.core_traits || [],
    soft_spots: persona.soft_spots || [],
    decision_tendency: persona.decision_tendency || '',
    growth_seed: persona.growth_seed || '',
    core_tension: persona.core_tension,
    defense_mechanism: persona.defense_mechanism,
    value_hierarchy: persona.value_hierarchy,
    voice_notes: persona.voice_notes,
    narrative_warnings: persona.narrative_warnings,
    _from_persona_agent: true
  };
}

function fullProfileToLegacyProfile(fullProfile) {
  const raw = fullProfile?.raw || {};
  const temporal = fullProfile?.temporal || {};
  return {
    choice: raw.choice_text || '',
    age: temporal.age_at_fork ?? 18,
    keywords: (raw.selected_tags || []).slice(0, 5),
    quote: raw.one_liner || undefined,
    description: raw.self_description || undefined
  };
}

async function callStructured({ schema, system, prompt, temperature, runtime, maxRetries = 1 }) {
  const activeRuntime = runtime || createLiveRuntime();
  let userPrompt = prompt;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await activeRuntime.generateStructured({
        schema,
        system,
        prompt: userPrompt,
        temperature
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        userPrompt += '\n\n# 注意：上一次输出未通过 schema，请重新输出合法 JSON。';
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

async function runPersonaAnalyze({ full_profile, runtime, fallbackRuleBased = true }) {
  if (!full_profile?.raw) {
    throw new Error('runPersonaAnalyze: missing full_profile');
  }

  try {
    const persona = await callStructured({
      schema: PersonaAgentSchema,
      system: loadPersonaSystemPrompt(),
      prompt: buildPersonaAnalyzePrompt(full_profile),
      temperature: 0.65,
      runtime,
      maxRetries: 1
    });
    const provider = runtime?.provider || (() => {
      try {
        return require('./llm-runtime').pickProvider();
      } catch {
        return 'unknown';
      }
    })();
    return {
      persona,
      persona_card: personaToPersonaCard(persona),
      profile: fullProfileToLegacyProfile(full_profile),
      source: 'llm',
      provider
    };
  } catch (error) {
    if (!fallbackRuleBased) throw error;
    let rulePersona = null;
    try {
      const rulePath = path.join(__dirname, '../../../../docs/demo-persona-agent.js');
      const ruleMod = require(rulePath);
      rulePersona = ruleMod.ShadowPersonaAgent?.analyze?.(full_profile) || null;
    } catch {
      /* docs rule agent optional in prod */
    }
    if (!rulePersona) {
      throw error;
    }
    return {
      persona: rulePersona,
      persona_card: personaToPersonaCard(rulePersona),
      profile: fullProfileToLegacyProfile(full_profile),
      source: 'rule_fallback',
      llm_error: error.message
    };
  }
}

module.exports = {
  loadPersonaSystemPrompt,
  buildPersonaAnalyzePrompt,
  personaToPersonaCard,
  fullProfileToLegacyProfile,
  runPersonaAnalyze
};
