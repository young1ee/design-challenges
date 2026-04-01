-- Move email off the public designers table into a private sidecar table

alter table designers drop column if exists email;

create table designer_emails (
  designer_id  uuid primary key references designers (id) on delete cascade,
  email        text unique not null,
  created_at   timestamptz not null default now()
);

alter table designer_emails enable row level security;

-- No public read — authenticated only
create policy "auth read designer_emails"  on designer_emails for select using (auth.role() = 'authenticated');
create policy "auth write designer_emails" on designer_emails for all    using (auth.role() = 'authenticated');
