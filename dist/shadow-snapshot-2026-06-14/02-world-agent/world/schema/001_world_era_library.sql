-- Shadow World Era Library — Supabase migration
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

create table if not exists world_years (
  calendar_year int primary key check (calendar_year between 2006 and 2026),
  summary text not null,
  social_mood text not null,
  atmosphere jsonb not null default '{}',
  pop_culture jsonb not null default '[]',
  sources jsonb not null default '[]',
  version text not null default '2026.06.14-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists world_macro_events (
  id uuid primary key default gen_random_uuid(),
  calendar_year int not null references world_years(calendar_year) on delete cascade,
  category text not null check (category in (
    'politics_policy', 'economy', 'education', 'tech_internet',
    'culture_entertainment', 'disaster_crisis', 'society', 'urban_life',
    'employment', 'housing'
  )),
  title text not null,
  detail text not null,
  source_url text not null,
  weight double precision not null default 1.0 check (weight > 0),
  sensitivity text not null default 'low' check (sensitivity in ('low', 'medium', 'high')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_world_macro_year on world_macro_events(calendar_year);
create index if not exists idx_world_macro_category on world_macro_events(category);

create table if not exists world_micro_events (
  id uuid primary key default gen_random_uuid(),
  calendar_year int not null references world_years(calendar_year) on delete cascade,
  category text not null check (category in (
    'family', 'school', 'work', 'romance', 'money', 'health',
    'neighborhood', 'digital', 'policy_touch'
  )),
  text text not null,
  weight double precision not null default 1.0 check (weight > 0),
  can_pivot boolean not null default false,
  sensitivity text not null default 'low' check (sensitivity in ('low', 'medium', 'high')),
  tags text[] not null default '{}',
  scenario text check (scenario in (
    'family', 'love', 'friendship', 'academic', 'career', 'self_growth'
  )),
  created_at timestamptz not null default now()
);

create index if not exists idx_world_micro_year on world_micro_events(calendar_year);
create index if not exists idx_world_micro_pivot on world_micro_events(can_pivot) where can_pivot = true;

-- Read-only for anon/authenticated clients
alter table world_years enable row level security;
alter table world_macro_events enable row level security;
alter table world_micro_events enable row level security;

create policy "world_years_read" on world_years for select using (true);
create policy "world_macro_read" on world_macro_events for select using (true);
create policy "world_micro_read" on world_micro_events for select using (true);

-- Service role bypasses RLS for seed scripts

comment on table world_years is 'Shadow fate agent: calendar year atmosphere packs 2006-2026';
comment on table world_macro_events is 'Macro real-world events with source_url';
comment on table world_micro_events is 'Personal-scale encounter pool for weighted sampling';
