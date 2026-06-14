-- Shadow intake tag library + session storage (Supabase)
-- Run via Supabase migration or SQL editor

create table if not exists intake_tag_categories (
  id            text primary key,
  label_zh      text not null,
  description   text,
  max_select    int  not null default 5,
  min_select    int  not null default 0,
  display_order int  not null,
  maps_to_agent text[] default '{}'
);

create table if not exists intake_tags (
  id            uuid primary key default gen_random_uuid(),
  category_id   text not null references intake_tag_categories(id) on delete cascade,
  label         text not null,
  synonyms      text[] default '{}',
  weight_hint   jsonb default '{}',
  moderation_status text not null default 'approved',
  is_custom     boolean default false,
  usage_count   int default 0,
  created_at    timestamptz default now()
);

create index if not exists idx_intake_tags_category on intake_tags(category_id);
create index if not exists idx_intake_tags_synonyms on intake_tags using gin(synonyms);

create table if not exists user_intake_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,
  status          text not null default 'in_progress',
  choice_text     text,
  self_description text,
  one_liner       text,
  birth_year      int,
  fork_year       int,
  age_at_fork     int,
  scenario_detected text,
  scenario_corrected text,
  scenario_confidence float,
  selected_tags   jsonb default '[]',
  question_answers jsonb default '[]',
  computed_signals jsonb default '{}',
  full_profile    jsonb,
  total_duration_ms int,
  created_at      timestamptz default now(),
  completed_at    timestamptz
);

create index if not exists idx_intake_sessions_user on user_intake_sessions(user_id);
create index if not exists idx_intake_sessions_status on user_intake_sessions(status);
