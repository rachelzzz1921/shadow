-- Visual assets + generated layouts for Shadow layout agent
-- Apply via Supabase Dashboard SQL or: supabase db push (if linked)

create table if not exists public.visual_assets (
  asset_id text primary key,
  pack_id text not null default 'extended-scenes-v1',
  category_id text not null,
  category_label text,
  name text not null,
  source_url text,
  asset_type text not null check (asset_type in ('background', 'prop', 'fx', 'ui', 'character')),
  size text,
  frames text,
  style_tags text[] default '{}',
  mood_tags text[] default '{}',
  story_tags text[] default '{}',
  scene_use text check (scene_use in ('special', 'daily', 'both')),
  usage_case text not null,
  notes text,
  license_tier text not null check (license_tier in (
    'cc0_ready', 'mana_seed_license', 'paid_commercial',
    'review_required', 'attribution_required', 'candidate_only'
  )),
  ui_ready text not null default 'candidate_only' check (ui_ready in (
    'prototype_ready', 'ready_after_purchase', 'candidate_only', 'approved'
  )),
  layout_role text,
  season_kit text,
  pairs_with text[] default '{}',
  visual_anchor_template text,
  default_layer_stack text,
  parallax_suggest text,
  animation_keys text,
  domain_fit text,
  year_phase_fit text,
  combo_id text,
  reject_if_mood text,
  demo_path text,
  local_raw_path text,
  version text not null default '2026.06.14-ext-v1',
  updated_at timestamptz not null default now()
);

create index if not exists visual_assets_pack_idx on public.visual_assets (pack_id);
create index if not exists visual_assets_category_idx on public.visual_assets (category_id);
create index if not exists visual_assets_story_tags_gin on public.visual_assets using gin (story_tags);
create index if not exists visual_assets_ui_ready_idx on public.visual_assets (ui_ready);

create table if not exists public.visual_layouts (
  id uuid primary key default gen_random_uuid(),
  story_id text not null,
  year integer not null check (year between 1 and 7),
  session_id text,
  narrative_input jsonb not null,
  layout jsonb not null,
  visual_anchor text,
  mood text,
  asset_ids text[] default '{}',
  transition_fx_id text default 'PX-EXT-033',
  status text not null default 'draft' check (status in ('draft', 'review', 'approved')),
  pack_ids text[] default '{extended-scenes-v1,universal-life-scenes-v1}',
  version text not null default '2026.06.14-ext-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, year, session_id)
);

create index if not exists visual_layouts_story_year_idx on public.visual_layouts (story_id, year);

comment on table public.visual_assets is 'Pixel asset registry; seeded from extended-scenes-v1-enriched.csv + universal pack';
comment on table public.visual_layouts is 'Year layout outputs from visual-layout-generator agent';
