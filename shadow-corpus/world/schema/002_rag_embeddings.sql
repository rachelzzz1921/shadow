-- Shadow RAG — pgvector embeddings (run after 001_world_era_library.sql)
-- Requires: Supabase project with vector extension enabled

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- rag_chunks — unified retrieval index for world / session / harness / trace
-- ---------------------------------------------------------------------------
create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  namespace text not null check (namespace in ('world', 'session', 'harness', 'trace')),
  source_type text not null,
  source_id text not null,
  chunk_index int not null default 0,
  content text not null,
  metadata jsonb not null default '{}',
  embedding vector(1024),
  corpus_version text not null default '2026.06.14-rag-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (namespace, source_id, chunk_index, corpus_version)
);

create index if not exists idx_rag_chunks_namespace on rag_chunks (namespace);
create index if not exists idx_rag_chunks_source on rag_chunks (namespace, source_type);
create index if not exists idx_rag_chunks_run_id on rag_chunks ((metadata->>'run_id'))
  where namespace in ('session', 'trace');
create index if not exists idx_rag_chunks_calendar_year on rag_chunks ((metadata->>'calendar_year'))
  where namespace = 'world';
create index if not exists idx_rag_chunks_file_path on rag_chunks ((metadata->>'file_path'))
  where namespace = 'harness';

-- IVFFlat index — build after initial embed seed (lists ≈ sqrt(row_count))
-- Run manually post-seed, e.g.:
-- create index idx_rag_chunks_embedding on rag_chunks
--   using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table rag_chunks enable row level security;

-- world + harness: public read (corpus is non-sensitive design docs + era facts)
create policy "rag_world_harness_read" on rag_chunks
  for select using (namespace in ('world', 'harness'));

-- trace: public read for team tooling (no PII in run summaries by design)
create policy "rag_trace_read" on rag_chunks
  for select using (namespace = 'trace');

-- session: intended filter at app layer by run_id; anon can read if RLS open
-- Tighten in production: auth.uid() = metadata->>'user_id'
create policy "rag_session_read" on rag_chunks
  for select using (namespace = 'session');

-- Writes: service_role only (embed scripts, demo server)
-- No insert policy for anon/authenticated — service_role bypasses RLS

comment on table rag_chunks is 'Shadow hybrid RAG index: world era, per-run session, full-repo harness docs, run traces';
comment on column rag_chunks.namespace is 'world | session | harness | trace';
comment on column rag_chunks.source_type is 'macro_event | micro_event | memory | year_narrative | harness_doc | run_summary';
comment on column rag_chunks.embedding is 'DashScope text-embedding-v3 default: 1024 dims';

-- ---------------------------------------------------------------------------
-- Helper: cosine search (optional SQL function for debugging)
-- ---------------------------------------------------------------------------
create or replace function rag_match(
  query_embedding vector(1024),
  match_namespace text,
  match_count int default 8,
  filter jsonb default '{}'
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from rag_chunks c
  where c.namespace = match_namespace
    and c.embedding is not null
    and (filter = '{}'::jsonb or c.metadata @> filter)
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

comment on function rag_match is 'Debug/helper: vector similarity search with optional metadata containment filter';
