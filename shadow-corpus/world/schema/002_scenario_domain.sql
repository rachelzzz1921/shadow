-- Add scenario domain to micro events (六类场景 Agent 对齐)
alter table world_micro_events
  add column if not exists scenario text check (scenario in (
    'family', 'love', 'friendship', 'academic', 'career', 'self_growth'
  ));

create index if not exists idx_world_micro_scenario on world_micro_events(scenario);

comment on column world_micro_events.scenario is 'Fate weight domain: family|love|friendship|academic|career|self_growth';
