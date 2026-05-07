-- Create settings table if it doesn't exist (singleton pattern with bool PK)
create table if not exists settings (
  id bool primary key default true,
  photo_order text[] not null default '{}',
  constraint settings_singleton check (id)
);

-- Add photo_descriptions column
alter table settings
  add column if not exists photo_descriptions jsonb not null default '{}'::jsonb;

-- RLS
alter table settings enable row level security;

create policy "public read settings" on settings for select using (true);
create policy "auth write settings"  on settings for all    using (auth.role() = 'authenticated');
