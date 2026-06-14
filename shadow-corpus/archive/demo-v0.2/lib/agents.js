'use strict';

/**
 * 5 agents wired to Vercel AI SDK + Anthropic / OpenAI providers.
 *
 * Provider selection precedence:
 *   1. ANTHROPIC_API_KEY -> Claude (recommended for narrative + strict JSON)
 *   2. OPENAI_API_KEY    -> GPT-4o fallback
 *   3. neither           -> throw "no provider"
 *
 * Override via env:
 *   SHADOW_PROVIDER=anthropic|openai
 *   SHADOW_MODEL=claude-sonnet-4-5-20250929 / gpt-4o / ...
 */

const {
  PersonaCardSchema,
  BeatsSchema,
  YearSchema,
  FinalSchema,
  DialogueSchema
} = require('./schemas');

const {
  buildPersonaPrompt,
  buildBeatsPrompt,
  buildYearPrompt,
  buildFinalPrompt,
  buildDialoguePrompt
} = require('./prompts');
const { createLiveRuntime, pickProvider } = require('./llm-runtime');
const { selectMemories } = require('./memory-retrieval');
const { memoryFromYear } = require('./story-contract');

// ------------------------------------------------------------
// Provider resolution
// ------------------------------------------------------------
function getModel() {
  const runtime = createLiveRuntime();
  return { model: runtime.model, provider: runtime.provider };
}

// ------------------------------------------------------------
// Generic call with retry on schema validation failure
// ------------------------------------------------------------
async function callAgent({ schema, system, prompt, temperature = 0.85, maxRetries = 1, runtime }) {
  const activeRuntime = runtime || createLiveRuntime();
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await activeRuntime.generateStructured({
        schema,
        system,
        prompt,
        temperature
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Inject a corrective hint on retry
        prompt = prompt + '\n\n# 注意：上一次输出未通过 schema 校验，请严格按照字段约束重新输出。';
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ------------------------------------------------------------
// Agent 1: persona card
// ------------------------------------------------------------
async function runPersona({ profile, runtime }) {
  const { system, prompt } = buildPersonaPrompt({ profile });
  return callAgent({ schema: PersonaCardSchema, system, prompt, temperature: 0.7, runtime });
}

// ------------------------------------------------------------
// Agent 2: beats / rhythm
// ------------------------------------------------------------
async function runBeats({ persona_card, profile, runtime }) {
  const { system, prompt } = buildBeatsPrompt({ persona_card, profile });
  const result = await callAgent({
    schema: BeatsSchema,
    system,
    prompt,
    temperature: 0.8,
    runtime
  });

  // Defensive consistency check: pivotal_years must match beats type=pivotal
  const declaredPivotal = new Set(result.pivotal_years);
  const actualPivotal = result.beats
    .filter(b => b.type === 'pivotal')
    .map(b => b.year);
  // If mismatch, trust the beats array and rebuild pivotal_years
  if (
    actualPivotal.length !== declaredPivotal.size ||
    !actualPivotal.every(y => declaredPivotal.has(y))
  ) {
    result.pivotal_years = actualPivotal;
  }
  return result;
}

// ------------------------------------------------------------
// Agent 3: one year
// ------------------------------------------------------------
async function runYear(input) {
  const { system, prompt } = buildYearPrompt(input);
  const result = await callAgent({
    schema: YearSchema,
    system,
    prompt,
    temperature: 0.9,
    runtime: input.runtime
  });
  // Enforce contract: quiet years must not have intervention_prompt
  if (input.beat_type === 'quiet') {
    result.is_pivotal = false;
    result.intervention_prompt = null;
  } else {
    result.is_pivotal = true;
    // If model forgot to provide intervention, synthesize a generic one
    if (!result.intervention_prompt) {
      result.intervention_prompt = {
        question: '让影子继续走下去，还是停下来？',
        options: ['继续', '停下']
      };
    }
  }
  return result;
}

// ------------------------------------------------------------
// Agent 4: final wrap
// ------------------------------------------------------------
async function runFinal(input) {
  const memory_stream = selectMemories(input.memory_stream || [], {
    limit: 5,
    at_year: 7
  });
  const { system, prompt } = buildFinalPrompt({ ...input, memory_stream });
  return callAgent({
    schema: FinalSchema,
    system,
    prompt,
    temperature: 0.85,
    runtime: input.runtime
  });
}

// ------------------------------------------------------------
// Agent 5: cross-time dialogue
// ------------------------------------------------------------
async function runDialogue(input) {
  const memory_stream = selectMemories(input.memory_stream || [], {
    limit: 3,
    at_year: input.at_year || 7,
    query: input.user_question || ''
  });
  const { system, prompt } = buildDialoguePrompt({ ...input, memory_stream });
  return callAgent({
    schema: DialogueSchema,
    system,
    prompt,
    temperature: 0.9,
    runtime: input.runtime
  });
}

// ------------------------------------------------------------
// Orchestrator: full story in one call (server-side convenience)
// ------------------------------------------------------------
async function runFullStory({ profile, onProgress, runtime }) {
  const emit = (stage, payload) => {
    if (typeof onProgress === 'function') onProgress(stage, payload);
  };

  emit('persona:start');
  const persona_card = await runPersona({ profile, runtime });
  emit('persona:done', persona_card);

  emit('beats:start');
  const beatsResult = await runBeats({ persona_card, profile, runtime });
  emit('beats:done', beatsResult);

  const years = [];
  const memory_stream = [];
  let mood = 5;
  let esteem = 5;

  for (let i = 0; i < beatsResult.beats.length; i++) {
    const beat = beatsResult.beats[i];
    const age = profile.age + beat.year;
    emit('year:start', { year: beat.year, type: beat.type });

    const yearObj = await runYear({
      persona_card,
      memory_stream,
      current_mood: mood,
      current_esteem: esteem,
      year_n: beat.year,
      age,
      beat_type: beat.type,
      beat_seed: beat.seed,
      user_intervention: null, // server-side full run skips intervention
      full_beats: beatsResult.beats,
      pivotal_years: beatsResult.pivotal_years,
      runtime
    });

    mood = yearObj.new_mood;
    esteem = yearObj.new_esteem;
    memory_stream.push(memoryFromYear(yearObj));
    years.push(yearObj);
    emit('year:done', yearObj);
  }

  emit('final:start');
  const final = await runFinal({
    persona_card,
    memory_stream,
    final_mood: mood,
    final_esteem: esteem,
    profile,
    runtime
  });
  emit('final:done', final);

  return {
    profile,
    persona_card,
    shadow: deriveShadow(persona_card),
    beats: beatsResult.beats,
    pivotal_years: beatsResult.pivotal_years,
    memory_stream,
    years,
    final
  };
}

// ------------------------------------------------------------
// Derive a visual shadow binding from the persona card
// (lightweight, deterministic, no extra LLM call)
// ------------------------------------------------------------
const CHARACTER_POOL = ['Adam', 'Alex', 'Amelia', 'Bob'];
const PALETTE_POOL = ['teal', 'amber', 'rose', 'violet', 'mint'];

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function deriveShadow(persona) {
  const seed = hashString(persona.name + persona.core_traits.join(''));
  return {
    character: CHARACTER_POOL[seed % CHARACTER_POOL.length],
    palette: PALETTE_POOL[(seed >> 3) % PALETTE_POOL.length],
    trait_tags: persona.core_traits.slice(0, 2)
  };
}

module.exports = {
  runPersona,
  runBeats,
  runYear,
  runFinal,
  runDialogue,
  runFullStory,
  deriveShadow,
  pickProvider,
  getModel
};
