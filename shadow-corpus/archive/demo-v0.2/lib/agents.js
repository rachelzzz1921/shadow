'use strict';

/**
 * 5 agents wired to Vercel AI SDK + Anthropic / OpenAI providers.
 *
 * Provider selection precedence:
 *   1. SHADOW_PROVIDER=anthropic|openai|stepfun (when matching key set)
 *   2. ANTHROPIC_API_KEY -> Claude
 *   3. OPENAI_API_KEY    -> GPT-4o
 *   4. STEPFUN_API_KEY / STEP_API_KEY -> 阶跃星辰 (OpenAI-compatible)
 */

const {
  PersonaCardSchema,
  BeatsSchema,
  YearSchema,
  RelaxedYearSchema,
  FinalSchema,
  RelaxedFinalSchema,
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
const { runPersonaAnalyze, personaToPersonaCard } = require('./persona-agent');
const { enums: schemaEnums } = require('./schemas');

function clip(s, max, fallback = '') {
  const t = String(s || fallback).trim();
  return t.length <= max ? t : t.slice(0, max);
}

function pickEnum(value, list, fallback) {
  return list.includes(value) ? value : fallback;
}

function sanitizeYearFromLlm(raw, input) {
  const yearN = Number(raw?.year) || input.year_n;
  const beatType = input.beat_type;
  let emotion = raw?.emotion;
  if (typeof emotion === 'string') emotion = { label: clip(emotion, 4, '平'), value: input.current_mood ?? 5 };
  if (typeof emotion === 'number') emotion = { label: '平', value: emotion };
  if (!emotion || typeof emotion !== 'object') {
    emotion = { label: '平', value: input.current_mood ?? 5 };
  }

  let intervention = raw?.intervention_prompt ?? null;
  if (beatType === 'quiet') {
    intervention = null;
  } else if (intervention && typeof intervention === 'object') {
    const opts = Array.isArray(intervention.options) ? intervention.options : ['继续', '停下'];
    intervention = {
      question: clip(intervention.question, 40, '让影子继续走下去，还是停下来？'),
      options: [clip(opts[0], 12, '继续'), clip(opts[1] ?? opts[0], 12, '停下')]
    };
  }

  return {
    year: yearN,
    age: Number(raw?.age) || input.age,
    is_pivotal: beatType === 'pivotal',
    title: clip(raw?.title, 8, `第${yearN}年`),
    scene: pickEnum(raw?.scene, schemaEnums.SCENES, 'city'),
    environment: pickEnum(raw?.environment, schemaEnums.ENVIRONMENTS, 'office'),
    pose: pickEnum(raw?.pose, schemaEnums.POSES, 'idle'),
    prop: pickEnum(raw?.prop, schemaEnums.PROPS, 'desk'),
    city: pickEnum(raw?.city, schemaEnums.CITIES, 'city1'),
    event: String(raw?.event || input.beat_seed || '这一年在另一条路上继续往前走。'),
    decision_made: clip(raw?.decision_made, 40, '在岔路口选了更稳妥的那一步'),
    intervention_prompt: intervention,
    emotion: {
      label: clip(emotion.label, 4, '平'),
      value: Math.max(1, Math.min(10, Math.round(Number(emotion.value) || 5)))
    },
    new_mood: Math.max(1, Math.min(10, Math.round(Number(raw?.new_mood ?? emotion.value) || 5))),
    new_esteem: Math.max(1, Math.min(10, Math.round(Number(raw?.new_esteem) || (input.current_esteem ?? 5)))),
    reflection: clip(raw?.reflection, 45, '原来有些路只能自己走完'),
    shadow_dialogue: clip(raw?.shadow_dialogue, 35, '如果重来，我会更早对自己诚实'),
    memory_summary: clip(raw?.memory_summary, 30, clip(raw?.event, 30, `第${yearN}年的转折`))
  };
}

function sanitizeFinalFromLlm(raw) {
  return {
    title: clip(raw?.title, 12, '七年后的回信'),
    message: clip(raw?.message, 80, String(raw?.message || '七年过去，影子在平行路上走完了你曾犹豫的那一步。')),
    regret: clip(raw?.regret, 30, '有些选择没有回头路'),
    scene: pickEnum(raw?.scene, schemaEnums.SCENES, 'night'),
    emotion_arc: clip(raw?.emotion_arc, 40, '从紧绷到松动，再到与自己和解')
  };
}

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
  let temp = temperature;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await activeRuntime.generateStructured({
        schema,
        system,
        prompt,
        temperature: temp
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        prompt += '\n\n# 注意：上一次输出未通过 schema 校验。请严格按字段长度与 enum 约束重新输出（title≤8字、reflection≤45字、memory_summary≤30字、intervention 仅 pivotal 年）。';
        temp = Math.max(0.55, temp - 0.12);
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
  const raw = await callAgent({
    schema: RelaxedYearSchema,
    system,
    prompt,
    temperature: 0.9,
    maxRetries: 3,
    runtime: input.runtime
  });
  const result = sanitizeYearFromLlm(raw, input);
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
  const raw = await callAgent({
    schema: RelaxedFinalSchema,
    system,
    prompt,
    temperature: 0.85,
    maxRetries: 3,
    runtime: input.runtime
  });
  return sanitizeFinalFromLlm(raw);
}

// ------------------------------------------------------------
// Agent 5: cross-time dialogue
// ------------------------------------------------------------
async function runDialogue(input) {
  const rag = require('./rag-service');
  const ctx = await rag.buildDialogueContext({
    memory_stream: input.memory_stream || [],
    years: input.years || [],
    user_question: input.user_question || '',
    at_year: input.at_year || 7,
    run_id: input.run_id || 'local',
    profile: input.profile || {},
    persona_card: input.persona_card,
    last_fate_context: input.last_fate_context || null
  });

  const { system, prompt } = buildDialoguePrompt({
    ...input,
    memory_stream: ctx.memory_stream,
    year_snippets: ctx.year_snippets,
    era_citations: ctx.era_citations
  });
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
  runPersonaAnalyze,
  personaToPersonaCard,
  runBeats,
  runYear,
  runFinal,
  runDialogue,
  runFullStory,
  deriveShadow,
  pickProvider,
  getModel
};
