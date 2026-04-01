-- ─── Drop old schema ──────────────────────────────────────────────────────────

drop view  if exists designer_stats cascade;
drop table if exists point_rules   cascade;
drop table if exists results       cascade;
drop table if exists entries       cascade;
drop table if exists challenges    cascade;
drop table if exists designers     cascade;

-- ─── Extensions ───────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Designers ────────────────────────────────────────────────────────────────

create table designers (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,          -- url-safe id, e.g. "mari-liis"
  name        text not null,
  role        text,
  location    text,
  joined_at   date,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── Seasons ──────────────────────────────────────────────────────────────────

-- point_system JSON shape: { "first": 10, "second": 5, "third": 3, "participation": 2 }
-- null = no point tracking (single-challenge seasons)

create table seasons (
  id            uuid primary key default gen_random_uuid(),
  number        int unique not null,
  name          text not null,
  starts_at     date not null,
  ends_at       date,
  format        text not null check (format in ('multi', 'single')),
  point_system  jsonb,
  note          text,
  created_at    timestamptz not null default now()
);

-- ─── Challenges ───────────────────────────────────────────────────────────────

create table challenges (
  id                    uuid primary key default gen_random_uuid(),
  season_id             uuid not null references seasons (id) on delete cascade,
  challenge_date        date not null,
  prompt                text not null,
  master_of_ceremony_id uuid references designers (id) on delete set null,
  created_at            timestamptz not null default now()
);

create index challenges_season_idx on challenges (season_id);

-- ─── Entries ──────────────────────────────────────────────────────────────────

create table entries (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references challenges (id) on delete cascade,
  designer_id   uuid not null references designers (id) on delete cascade,
  title         text,
  figma_url     text,
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  unique (challenge_id, designer_id)
);

create index entries_challenge_idx on entries (challenge_id);
create index entries_designer_idx  on entries (designer_id);

-- ─── Results (podium) ─────────────────────────────────────────────────────────

-- position: 1 = first, 2 = second, 3 = third
-- points_awarded is denormalised at write time so history stays correct

create table results (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references challenges (id) on delete cascade,
  entry_id        uuid not null references entries (id) on delete cascade,
  position        int not null check (position in (1, 2, 3)),
  points_awarded  int not null default 0,
  created_at      timestamptz not null default now(),
  unique (challenge_id, position)
);

create index results_challenge_idx on results (challenge_id);
create index results_entry_idx     on results (entry_id);

-- ─── Participations ───────────────────────────────────────────────────────────

create table participations (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    uuid not null references challenges (id) on delete cascade,
  designer_id     uuid not null references designers (id) on delete cascade,
  points_awarded  int not null default 0,
  created_at      timestamptz not null default now(),
  unique (challenge_id, designer_id)
);

create index participations_challenge_idx on participations (challenge_id);
create index participations_designer_idx  on participations (designer_id);

-- ─── Leaderboard view ─────────────────────────────────────────────────────────

create view season_leaderboard as
select
  s.id                                                         as season_id,
  s.number                                                     as season_number,
  d.id                                                         as designer_id,
  d.slug,
  d.name,
  d.role,
  coalesce(sum(distinct_r.pts), 0) +
  coalesce(sum(distinct_p.pts), 0)                             as total_points,
  count(distinct e.id)                                         as total_entries,
  count(distinct case when res.position = 1 then res.id end)  as first_place,
  count(distinct case when res.position = 2 then res.id end)  as second_place,
  count(distinct case when res.position = 3 then res.id end)  as third_place
from seasons s
cross join designers d
left join challenges c
       on c.season_id = s.id
left join entries e
       on e.challenge_id = c.id and e.designer_id = d.id
left join results res
       on res.entry_id = e.id
left join lateral (
  select coalesce(sum(r2.points_awarded), 0) as pts
  from results r2
  where r2.entry_id = e.id
) distinct_r on true
left join lateral (
  select coalesce(sum(p2.points_awarded), 0) as pts
  from participations p2
  where p2.challenge_id = c.id and p2.designer_id = d.id
) distinct_p on true
group by s.id, s.number, d.id, d.slug, d.name, d.role;

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table designers      enable row level security;
alter table seasons        enable row level security;
alter table challenges     enable row level security;
alter table entries        enable row level security;
alter table results        enable row level security;
alter table participations enable row level security;

-- Public read
create policy "public read designers"      on designers      for select using (true);
create policy "public read seasons"        on seasons        for select using (true);
create policy "public read challenges"     on challenges     for select using (true);
create policy "public read entries"        on entries        for select using (true);
create policy "public read results"        on results        for select using (true);
create policy "public read participations" on participations for select using (true);

-- Authenticated write
create policy "auth write designers"      on designers      for all using (auth.role() = 'authenticated');
create policy "auth write seasons"        on seasons        for all using (auth.role() = 'authenticated');
create policy "auth write challenges"     on challenges     for all using (auth.role() = 'authenticated');
create policy "auth write entries"        on entries        for all using (auth.role() = 'authenticated');
create policy "auth write results"        on results        for all using (auth.role() = 'authenticated');
create policy "auth write participations" on participations for all using (auth.role() = 'authenticated');
