'use strict';

/**
 * Chunk a single world year JSON into rag_chunks rows (pre-embed).
 * @param {object} pack — era-year.json
 */
export function chunkWorldYear(pack) {
  const year = pack.calendar_year;
  const chunks = [];

  chunks.push({
    namespace: 'world',
    source_type: 'year_summary',
    source_id: `world:${year}:summary`,
    chunk_index: 0,
    content: [pack.summary, pack.social_mood].filter(Boolean).join('\n'),
    metadata: {
      calendar_year: year,
      source_type: 'year_summary'
    }
  });

  for (const [i, ev] of (pack.macro_events || []).entries()) {
    chunks.push({
      namespace: 'world',
      source_type: 'macro_event',
      source_id: `world:${year}:macro:${i}:${slug(ev.title)}`,
      chunk_index: 0,
      content: `${ev.title}\n${ev.detail}`,
      metadata: {
        calendar_year: year,
        category: ev.category,
        title: ev.title,
        source_url: ev.source_url,
        weight: ev.weight,
        sensitivity: ev.sensitivity,
        tags: ev.tags
      }
    });
  }

  for (const [i, ev] of (pack.micro_events || []).entries()) {
    chunks.push({
      namespace: 'world',
      source_type: 'micro_event',
      source_id: `world:${year}:micro:${i}:${slug(ev.text?.slice(0, 24))}`,
      chunk_index: 0,
      content: ev.text,
      metadata: {
        calendar_year: year,
        category: ev.category,
        scenario: ev.scenario,
        can_pivot: ev.can_pivot,
        weight: ev.weight,
        sensitivity: ev.sensitivity,
        tags: ev.tags
      }
    });
  }

  const atmo = pack.atmosphere;
  if (atmo && typeof atmo === 'object') {
    const lines = Object.entries(atmo).map(([k, v]) => `${k}: ${v}`);
    chunks.push({
      namespace: 'world',
      source_type: 'atmosphere',
      source_id: `world:${year}:atmosphere`,
      chunk_index: 0,
      content: lines.join('\n'),
      metadata: { calendar_year: year, source_type: 'atmosphere' }
    });
  }

  if (Array.isArray(pack.pop_culture) && pack.pop_culture.length) {
    chunks.push({
      namespace: 'world',
      source_type: 'pop_culture',
      source_id: `world:${year}:pop_culture`,
      chunk_index: 0,
      content: pack.pop_culture.join('\n'),
      metadata: { calendar_year: year, source_type: 'pop_culture' }
    });
  }

  return chunks;
}

function slug(s) {
  return String(s || 'x')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'x';
}
