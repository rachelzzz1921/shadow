'use strict';

const agents = require('./agents');
const { createLiveRuntime } = require('./llm-runtime');
const { memoryFromYear, normalizeYear } = require('./story-contract');
const { replanBeatsAfterIntervention } = require('./beats-replan');
const { resolveFateContext } = require('./fate-bridge');
const { classifyProfile } = require('./scenario-classify');
const { indexSessionAfterYear, indexTraceAfterFinal } = require('./rag-service');
const {
  evaluateBeats,
  evaluateStory,
  evaluateYear,
  evaluateInterventionThread
} = require('./evaluator');

function wrapFindings(findings) {
  const errors = findings.filter(f => f.severity === 'error');
  const warnings = findings.filter(f => f.severity === 'warn');
  return { ok: errors.length === 0, errors, warnings, findings };
}
const {
  appendEvent,
  recordIntervention,
  finishRunTrace
} = require('./run-trace');

async function startStorySession({
  profile,
  persona_card: intakePersonaCard = null,
  full_profile = null,
  runtime = createLiveRuntime(),
  trace = null
}) {
  try {
    const scenario = await classifyProfile(profile);
    appendEvent(trace, {
      stage: 'scenario:classified',
      payload: {
        domain: scenario.domain,
        label: scenario.label,
        agent: scenario.agent,
        confidence: scenario.confidence
      }
    });

    const enrichedProfile = {
      ...profile,
      scenario_domain: scenario.domain,
      scenario_label: scenario.label,
      scenario_agent: scenario.agent
    };

    let persona_card = intakePersonaCard;
    if (persona_card?.name) {
      appendEvent(trace, {
        stage: 'persona:skipped',
        payload: { name: persona_card.name, from: 'intake' }
      });
    } else {
      appendEvent(trace, { stage: 'persona:start' });
      persona_card = await agents.runPersona({ profile: enrichedProfile, runtime });
      appendEvent(trace, { stage: 'persona:done', payload: { name: persona_card.name } });
    }

    appendEvent(trace, { stage: 'beats:start' });
    const beatsResult = await agents.runBeats({ persona_card, profile, runtime });
    const beatsEval = wrapFindings(evaluateBeats(beatsResult.beats, beatsResult.pivotal_years));
    appendEvent(trace, {
      stage: 'beats:done',
      payload: { pivotal_years: beatsResult.pivotal_years },
      eval: beatsEval
    });

    const session = {
      profile: enrichedProfile,
      full_profile: full_profile || null,
      scenario,
      persona_card,
      shadow: agents.deriveShadow(persona_card),
      beats: beatsResult.beats,
      pivotal_years: beatsResult.pivotal_years,
      memory_stream: [],
      years: [],
      mood: 5,
      esteem: 5,
      run_id: trace?.run_id || null,
      visual_character: full_profile?.visual_character || null
    };
    return session;
  } catch (error) {
    appendEvent(trace, { stage: 'start:error', status: 'error', error });
    throw error;
  }
}

async function generateNextYear({ session, user_intervention = null, runtime = createLiveRuntime(), trace = null }) {
  if (!session || !Array.isArray(session.beats)) {
    throw new Error('Missing story session');
  }
  const nextIndex = Array.isArray(session.years) ? session.years.length : 0;
  const beat = session.beats[nextIndex];
  if (!beat) {
    throw new Error('Story session has no remaining years');
  }

  if (user_intervention) {
    recordIntervention(trace, user_intervention);
  }

  let beats = session.beats;
  let pivotal_years = session.pivotal_years;
  const replanLog = session.replan_log || [];

  if (user_intervention) {
    const replanned = replanBeatsAfterIntervention({
      beats,
      pivotal_years,
      intervention: user_intervention
    });
    if (replanned.replanned) {
      beats = replanned.beats;
      replanLog.push({
        at_year: beat.year,
        intervention: user_intervention,
        placeholder: replanned.placeholder,
        note: replanned.note
      });
    }
  }

  try {
    appendEvent(trace, { stage: 'year:start', payload: { year: beat.year, type: beat.type } });

    const fate_context = await resolveFateContext({
      runId: session.run_id || trace?.run_id || 'local',
      profile: session.profile,
      persona_card: session.persona_card,
      narrativeYear: beat.year,
      beatType: beat.type,
      priorInterventions: replanLog.map(r => r.intervention)
    });
    appendEvent(trace, {
      stage: 'fate:sampled',
      payload: { year: beat.year, era_line: fate_context?.era_line, placeholder: fate_context?.placeholder }
    });

    const rawYear = await agents.runYear({
      persona_card: session.persona_card,
      memory_stream: session.memory_stream || [],
      current_mood: session.mood ?? 5,
      current_esteem: session.esteem ?? 5,
      year_n: beat.year,
      age: session.profile.age + beat.year,
      beat_type: beat.type,
      beat_seed: beat.seed,
      user_intervention,
      full_beats: beats,
      pivotal_years,
      fate_context,
      runtime
    });
    const year = normalizeYear(
      { ...rawYear, user_intervention },
      {
        index: nextIndex,
        startAge: session.profile.age,
        beats: session.beats,
        pivotalYears: session.pivotal_years || []
      }
    );
    const memory = memoryFromYear(year);
    const yearFindings = evaluateYear(year, beat);
    if (nextIndex > 0 && session.years[nextIndex - 1]) {
      yearFindings.push(...evaluateInterventionThread(session.years[nextIndex - 1], year));
    }
    const yearEval = wrapFindings(yearFindings);
    appendEvent(trace, {
      stage: 'year:done',
      payload: { year: year.year, title: year.title },
      eval: yearEval
    });

    const nextSession = {
      ...session,
      beats,
      pivotal_years,
      replan_log: replanLog,
      years: [...(session.years || []), year],
      memory_stream: [...(session.memory_stream || []), memory],
      mood: year.new_mood,
      esteem: year.new_esteem,
      last_fate_context: fate_context
    };

    indexSessionAfterYear({
      run_id: session.run_id || trace?.run_id,
      memory,
      year
    });

    return { session: nextSession, year, memory, eval: yearEval };
  } catch (error) {
    appendEvent(trace, { stage: 'year:error', status: 'error', payload: { year: beat.year }, error });
    throw error;
  }
}

async function finishStorySession({ session, runtime = createLiveRuntime(), trace = null, stop_reason = 'completed' }) {
  if (!session || !session.persona_card) {
    throw new Error('Missing story session');
  }
  try {
    appendEvent(trace, { stage: 'final:start' });
    const final = await agents.runFinal({
      persona_card: session.persona_card,
      memory_stream: session.memory_stream || [],
      final_mood: session.mood ?? 5,
      final_esteem: session.esteem ?? 5,
      profile: session.profile,
      runtime
    });
    const story = {
      profile: session.profile,
      persona_card: session.persona_card,
      shadow: session.shadow,
      beats: session.beats,
      pivotal_years: session.pivotal_years,
      memory_stream: session.memory_stream,
      years: session.years,
      final
    };
    const storyEval = evaluateStory(story);
    appendEvent(trace, { stage: 'final:done', payload: { title: final.title }, eval: storyEval });

    const finishedSession = { ...session, final };
    let traceResult = null;
    if (trace) {
      traceResult = finishRunTrace(trace, {
        stop_reason,
        eval: storyEval,
        session: finishedSession
      });
      indexTraceAfterFinal({
        trace: traceResult?.trace || trace,
        session: finishedSession,
        storyEval
      });
    }

    return {
      session: finishedSession,
      final,
      story,
      eval: storyEval,
      trace: traceResult?.trace || trace,
      trace_path: traceResult?.filePath || null
    };
  } catch (error) {
    appendEvent(trace, { stage: 'final:error', status: 'error', error });
    if (trace) {
      finishRunTrace(trace, { stop_reason: 'final_failed', session });
    }
    throw error;
  }
}

module.exports = {
  startStorySession,
  generateNextYear,
  finishStorySession
};
