'use strict';

/**
 * Build run trace summary chunk for rag_chunks (namespace=trace).
 */

export function buildTraceSummary({ trace, session, storyEval }) {
  const run_id = trace?.run_id || session?.run_id || 'unknown';
  const warnings = (storyEval?.warnings || storyEval?.findings || [])
    .filter(f => f.severity === 'warn' || f.level === 'warn')
    .map(f => f.message || f.code)
    .slice(0, 8);

  const errors = (storyEval?.errors || [])
    .map(f => f.message || f.code)
    .slice(0, 5);

  const content = [
    `run_id: ${run_id}`,
    `choice: ${session?.profile?.choice || trace?.profile?.choice || '—'}`,
    `years: ${session?.years?.length || 0}`,
    `pivotal: ${(session?.pivotal_years || []).join(',')}`,
    `final: ${session?.final?.title || '—'}`,
    session?.final?.message ? `message: ${session.final.message.slice(0, 200)}` : null,
    errors.length ? `errors: ${errors.join('; ')}` : null,
    warnings.length ? `warnings: ${warnings.join('; ')}` : null,
    `stop: ${trace?.stop_reason || '—'}`
  ].filter(Boolean).join('\n');

  return {
    namespace: 'trace',
    source_type: 'run_summary',
    source_id: `trace:${run_id}`,
    chunk_index: 0,
    content,
    metadata: {
      run_id,
      story_id: session?.profile?.story_id || 'live',
      eval_ok: storyEval?.ok ?? true,
      eval_score: storyEval?.score,
      warnings_count: warnings.length,
      errors_count: errors.length,
      pivotal_years: session?.pivotal_years || [],
      finished_at: trace?.finished_at || new Date().toISOString()
    }
  };
}
