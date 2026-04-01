-- Designers
create table designers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  bio text,
  social_links jsonb,
  joined_year int not null,
  created_at timestamptz default now()
);

-- Challenges
create table challenges (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  title text not null,
  prompt text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'voting', 'completed')),
  winner_id uuid references designers(id),
  next_prompt text,
  next_prompt_set_by uuid references designers(id),
  created_at timestamptz default now()
);

-- Entries
create table entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  designer_id uuid not null references designers(id) on delete cascade,
  image_url text not null,
  title text,
  description text,
  submitted_at timestamptz default now(),
  unique(challenge_id, designer_id)
);

-- Results (rankings per challenge)
create table results (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  designer_id uuid not null references designers(id) on delete cascade,
  rank int not null,
  points_awarded int not null default 0,
  created_at timestamptz default now(),
  unique(challenge_id, designer_id)
);

-- Point rules per year range
create table point_rules (
  id uuid primary key default gen_random_uuid(),
  year_from int not null,
  year_to int, -- null means "onwards"
  rank_1_points int not null,
  rank_2_points int not null,
  rank_3_points int not null,
  participation_points int not null default 0
);

-- Seed point rules
insert into point_rules (year_from, year_to, rank_1_points, rank_2_points, rank_3_points, participation_points)
values
  (2023, 2024, 10, 0, 0, 0),  -- 2023-2024: only winner mattered
  (2025, 2025, 10, 7, 5, 2),  -- 2025: introduced point system
  (2026, null, 15, 10, 7, 3); -- 2026: updated rules (adjust as needed)

-- Useful view: total points per designer
create view designer_stats as
select
  d.id,
  d.name,
  d.avatar_url,
  coalesce(sum(r.points_awarded), 0) as total_points,
  count(distinct e.challenge_id) as challenges_participated,
  count(distinct case when r.rank = 1 then r.challenge_id end) as wins
from designers d
left join entries e on e.designer_id = d.id
left join results r on r.designer_id = d.id
group by d.id, d.name, d.avatar_url;
