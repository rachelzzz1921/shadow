'use strict';

/**
 * Build local session candidates for hybrid retrieval (no Supabase required).
 */

/** @param {object} p */
export function buildSessionCandidates({ memory_stream = [], years = [], run_id = 'local' }) {
  const out = [];

  for (const m of memory_stream) {
    out.push({
      namespace: 'session',
      source_type: 'memory',
      source_id: m.id,
      chunk_index: 0,
      content: m.content,
      metadata: {
        run_id,
        year: m.year,
        type: m.type,
        weight: m.weight
      }
    });
  }

  for (const y of years) {
    const narrative = y.narrative || y.event || y.memory_summary || '';
    if (!narrative) continue;
    out.push({
      namespace: 'session',
      source_type: 'year_narrative',
      source_id: `year:${run_id}:${y.year}`,
      chunk_index: 0,
      content: narrative,
      metadata: {
        run_id,
        year: y.year,
        title: y.title,
        type: 'year_narrative'
      }
    });
  }

  return out;
}

/**
 * Rows for a single completed year (memory + year narrative).
 */
export function sessionChunksForYear({ memory, year, run_id, corpus_version }) {
  const rows = [];
  if (memory) {
    rows.push({
      namespace: 'session',
      source_type: 'memory',
      source_id: memory.id,
      chunk_index: 0,
      content: memory.content,
      metadata: {
        run_id,
        year: memory.year,
        type: memory.type,
        weight: memory.weight
      },
      corpus_version
    });
  }
  if (year) {
    const narrative = year.narrative || year.event || year.memory_summary || '';
    if (narrative) {
      rows.push({
        namespace: 'session',
        source_type: 'year_narrative',
        source_id: `year:${run_id}:${year.year}`,
        chunk_index: 0,
        content: narrative,
        metadata: {
          run_id,
          year: year.year,
          title: year.title,
          type: 'year_narrative'
        },
        corpus_version
      });
    }
  }
  return rows;
}

/**
 * Full session snapshot rows (legacy bulk upsert).
 */
export function sessionChunksForUpsert({ memory_stream = [], years = [], run_id, corpus_version }) {
  return buildSessionCandidates({ memory_stream, years, run_id }).map(row => ({
    namespace: 'session',
    source_type: row.source_type,
    source_id: row.source_id,
    chunk_index: row.chunk_index,
    content: row.content,
    metadata: row.metadata,
    corpus_version
  }));
}
