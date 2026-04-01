-- ─── Designers ────────────────────────────────────────────────────────────────

insert into designers (slug, name, location, joined_at, is_active, left_at) values
  ('hiep',      'Hiep',      'Helsinki, Finland',  '2021-07-01', true,  null),
  ('martin',    'Martin',    'Tallinn, Estonia',   '2021-06-01', true,  null),
  ('mari-liis', 'Mari-Liis', 'Tartu, Estonia',     '2016-11-01', true,  null),
  ('raul',      'Raul',      'Tallinn, Estonia',   '2020-11-01', true,  null),
  ('oskar',     'Oskar',     'Tallinn, Estonia',   '2025-08-01', true,  null),
  ('saara',     'Saara',     'Tallinn, Estonia',   '2023-09-01', true,  null),
  ('derin',     'Derin',     'Berlin, Germany',    '2022-10-01', true,  null),
  ('anisa',     'Anisa',     'Muscat, Oman',       '2023-11-01', true,  null),
  ('greta',     'Greta',     'Berlin, Germany',    '2018-04-01', true,  null),
  ('natalie',   'Natalie',   'Dresden, Germany',   '2023-03-01', true,  null),
  ('sebastian', 'Sebastian', 'Potsdam, Germany',   '2025-05-01', true,  null),
  ('mikko',     'Mikko',     null,                 null,         false, '2024-12-01'),
  ('taha',      'Taha',      null,                 null,         false, '2025-08-01');

-- ─── Season 1 (2023) ─────────────────────────────────────────────────────────

insert into seasons (number, name, starts_at, ends_at, format, point_system) values
  (1, 'Season 1', '2023-11-01', '2023-11-01', 'single',
   '{"first": 10, "second": 6, "third": 4, "entry": 2}');

-- Challenge
insert into challenges (season_id, challenge_date, prompt, master_of_ceremony_id)
select s.id, '2023-11-01',
  'Create a Winamp skin based on a song randomly assigned from our team''s song pool.',
  d.id
from seasons s, designers d
where s.number = 1 and d.slug = 'martin';

-- Entries
insert into entries (challenge_id, designer_id, title)
select c.id, d.id, v.title
from challenges c
join seasons s on s.id = c.season_id and s.number = 1
cross join (values
  ('martin',    'Baha Men – Who Let The Dogs Out'),
  ('hiep',      'Ghost – Square Hammer'),
  ('mari-liis', 'Käärijä – Cha Cha Cha'),
  ('greta',     'Wu-Tang Clan – Gravel Pit'),
  ('saara',     'Nicki Minaj & Ice Spice – Barbie World (with Aqua)')
) as v(slug, title)
join designers d on d.slug = v.slug;

-- Podium results
insert into results (challenge_id, entry_id, position, points_awarded)
select c.id, e.id, v.pos, v.pts
from challenges c
join seasons s on s.id = c.season_id and s.number = 1
cross join (values
  ('martin',    1, 10),
  ('hiep',      2, 6),
  ('mari-liis', 3, 4)
) as v(slug, pos, pts)
join designers d on d.slug = v.slug
join entries e on e.challenge_id = c.id and e.designer_id = d.id;

-- Entry points (submitted but outside podium)
insert into participations (challenge_id, designer_id, points_awarded)
select c.id, d.id, 2
from challenges c
join seasons s on s.id = c.season_id and s.number = 1
cross join (values ('greta'), ('saara')) as v(slug)
join designers d on d.slug = v.slug;

-- ─── Season 2 (2024) ─────────────────────────────────────────────────────────

insert into seasons (number, name, starts_at, ends_at, format, point_system) values
  (2, 'Season 2', '2024-03-15', '2024-03-15', 'single',
   '{"first": 10, "second": 6, "third": 4, "entry": 2}');

-- Challenge
insert into challenges (season_id, challenge_date, prompt, master_of_ceremony_id)
select s.id, '2024-03-15',
  'Device Design Challenge: Mix & Match Madness — combine a device with an unexpected category.',
  d.id
from seasons s, designers d
where s.number = 2 and d.slug = 'martin';

-- Entries
insert into entries (challenge_id, designer_id, title)
select c.id, d.id, v.title
from challenges c
join seasons s on s.id = c.season_id and s.number = 2
cross join (values
  ('hiep',      'Polar Vantage V3 + Food'),
  ('martin',    'Peloton Indoor Bike + Public Transport'),
  ('derin',     'Nintendo DS + Money/Crypto'),
  ('mikko',     'Gaming slot machine + Fitness'),
  ('raul',      'Sony Model KV-4000 + Government'),
  ('taha',      'Apple VisionPro + Weather'),
  ('natalie',   '9999 in 1 gaming console + Love/Dating'),
  ('anisa',     'Sony Ericsson Z300 + Zen/Meditation'),
  ('mari-liis', 'iPod Classic + Social Media')
) as v(slug, title)
join designers d on d.slug = v.slug;

-- Podium results
insert into results (challenge_id, entry_id, position, points_awarded)
select c.id, e.id, v.pos, v.pts
from challenges c
join seasons s on s.id = c.season_id and s.number = 2
cross join (values
  ('hiep',   1, 10),
  ('martin', 2, 6),
  ('derin',  3, 4)
) as v(slug, pos, pts)
join designers d on d.slug = v.slug
join entries e on e.challenge_id = c.id and e.designer_id = d.id;

-- Entry points (submitted but outside podium)
insert into participations (challenge_id, designer_id, points_awarded)
select c.id, d.id, 2
from challenges c
join seasons s on s.id = c.season_id and s.number = 2
cross join (values
  ('mikko'), ('raul'), ('taha'), ('natalie'), ('anisa'), ('mari-liis')
) as v(slug)
join designers d on d.slug = v.slug;

-- ─── Season 3 (2025) ─────────────────────────────────────────────────────────
-- Point system: winner=10, entry=5, no 2nd/3rd distinction

insert into seasons (number, name, starts_at, ends_at, format, point_system) values
  (3, 'Season 3', '2025-02-27', '2025-12-18', 'multi',
   '{"first": 10, "entry": 5}');

-- Helper: insert all 12 challenges at once
with s as (select id from seasons where number = 3)
insert into challenges (season_id, challenge_date, prompt, master_of_ceremony_id)
select s.id, v.dt, v.prompt, d.id
from s
cross join (values
  ('2025-02-27'::date, 'Craft something cool and maybe useful with a plugin - preferably less known one',           'raul'),
  ('2025-03-27'::date, 'Make a chart (any type) that will represent something about you and will be super cool to interact with', 'hiep'),
  ('2025-04-24'::date, 'Wau the rest of the team with a prototype using variables - build anything you want',      'anisa'),
  ('2025-05-15'::date, 'Create a skeuomorphism icon for the app that you designed in the last challenge',         'martin'),
  ('2025-06-05'::date, 'Make a stunning "connecting to Wi-Fi" animation using Figma',                             'raul'),
  ('2025-06-26'::date, 'Create a glassmorphism weather widget in light and dark mode',                            'saara'),
  ('2025-08-14'::date, 'Make a proper sexy screen for a smart watch of your choice',                              'raul'),
  ('2025-09-04'::date, 'Take some old UI/UX design of yours and fix it!',                                        'hiep'),
  ('2025-10-09'::date, 'Make something cool using as many AI tools as possible',                                  'martin'),
  ('2025-10-30'::date, 'Create a radial menu for a digital tool that you love',                                   'oskar'),
  ('2025-11-27'::date, 'Create a very simple CV page in Figma Sites for a professional Rakoon Chaser',           'mari-liis'),
  ('2025-12-18'::date, 'Make a loading screen for a game of your choice',                                         'hiep')
) as v(dt, prompt, mc_slug)
join designers d on d.slug = v.mc_slug;

-- ── Entries per challenge ─────────────────────────────────────────────────────

-- 27 Feb
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-02-27'
cross join (values ('anisa'),('hiep'),('martin'),('raul'),('saara')) as v(slug) join designers d on d.slug = v.slug;

-- 27 Mar
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-03-27'
cross join (values ('anisa'),('greta'),('hiep'),('mari-liis'),('martin'),('natalie'),('raul'),('saara')) as v(slug) join designers d on d.slug = v.slug;

-- 24 Apr
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-04-24'
cross join (values ('anisa'),('hiep'),('martin'),('raul')) as v(slug) join designers d on d.slug = v.slug;

-- 15 May
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-05-15'
cross join (values ('hiep'),('martin'),('raul')) as v(slug) join designers d on d.slug = v.slug;

-- 5 Jun
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-06-05'
cross join (values ('hiep'),('martin'),('raul'),('saara')) as v(slug) join designers d on d.slug = v.slug;

-- 26 Jun
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-06-26'
cross join (values ('greta'),('hiep'),('martin'),('natalie'),('raul')) as v(slug) join designers d on d.slug = v.slug;

-- 14 Aug
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-08-14'
cross join (values ('greta'),('hiep'),('martin'),('raul')) as v(slug) join designers d on d.slug = v.slug;

-- 4 Sep
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-09-04'
cross join (values ('martin'),('raul'),('saara')) as v(slug) join designers d on d.slug = v.slug;

-- 9 Oct
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-10-09'
cross join (values ('greta'),('mari-liis'),('martin'),('oskar'),('raul'),('sebastian')) as v(slug) join designers d on d.slug = v.slug;

-- 30 Oct
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-10-30'
cross join (values ('derin'),('greta'),('hiep'),('mari-liis'),('martin'),('natalie'),('oskar'),('raul')) as v(slug) join designers d on d.slug = v.slug;

-- 27 Nov (Hiep won but not listed in entries — adding them)
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-11-27'
cross join (values ('hiep'),('mari-liis'),('martin'),('oskar'),('raul')) as v(slug) join designers d on d.slug = v.slug;

-- 18 Dec
insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 3 and c.challenge_date = '2025-12-18'
cross join (values ('greta'),('hiep'),('martin'),('oskar'),('raul'),('saara'),('sebastian')) as v(slug) join designers d on d.slug = v.slug;

-- ── Results (winners only, position = 1) ─────────────────────────────────────

insert into results (challenge_id, entry_id, position, points_awarded)
select c.id, e.id, 1, 10
from challenges c
join seasons s on s.id = c.season_id and s.number = 3
join (values
  ('2025-02-27'::date, 'hiep'),
  ('2025-03-27'::date, 'anisa'),
  ('2025-04-24'::date, 'martin'),
  ('2025-05-15'::date, 'raul'),
  ('2025-06-05'::date, 'saara'),
  ('2025-06-26'::date, 'raul'),
  ('2025-08-14'::date, 'hiep'),
  ('2025-09-04'::date, 'martin'),
  ('2025-10-09'::date, 'oskar'),
  ('2025-10-30'::date, 'mari-liis'),
  ('2025-11-27'::date, 'hiep'),
  ('2025-12-18'::date, 'martin')
) as v(dt, winner_slug)
on c.challenge_date = v.dt
join designers d on d.slug = v.winner_slug
join entries e on e.challenge_id = c.id and e.designer_id = d.id;

-- ── Entry points (non-winners who submitted, 5 pts each) ─────────────────────

insert into participations (challenge_id, designer_id, points_awarded)
select c.id, e.designer_id, 5
from challenges c
join seasons s on s.id = c.season_id and s.number = 3
join entries e on e.challenge_id = c.id
where not exists (
  select 1 from results r where r.challenge_id = c.id and r.entry_id = e.id
);

-- ─── Season 4 (2026) ─────────────────────────────────────────────────────────
-- Point system: 1st=10, 2nd=6, 3rd=4, entry=2

insert into seasons (number, name, starts_at, ends_at, format, point_system) values
  (4, 'Season 4', '2026-02-05', null, 'multi',
   '{"first": 10, "second": 6, "third": 4, "entry": 2}');

insert into challenges (season_id, challenge_date, prompt, master_of_ceremony_id)
select s.id, v.dt, v.prompt, d.id
from seasons s
cross join (values
  ('2026-02-05'::date, 'Create a landing illustration for a lifestyle app that represents your idea of work-life balance', 'raul'),
  ('2026-03-05'::date, 'Create an "out of the box" Save icon',                                                            'mari-liis'),
  ('2026-04-02'::date, 'Create a simple dating app screen with a design system used in Nortal but never by yourself',     'hiep')
) as v(dt, prompt, mc_slug)
join designers d on d.slug = v.mc_slug
where s.number = 4;

-- ── Challenge 1 (5 Feb) — full results ───────────────────────────────────────

insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 4 and c.challenge_date = '2026-02-05'
cross join (values ('hiep'),('martin'),('mari-liis'),('oskar'),('raul'),('saara')) as v(slug) join designers d on d.slug = v.slug;

insert into results (challenge_id, entry_id, position, points_awarded)
select c.id, e.id, v.pos, v.pts
from challenges c join seasons s on s.id = c.season_id and s.number = 4 and c.challenge_date = '2026-02-05'
cross join (values ('mari-liis', 1, 10), ('martin', 2, 6), ('hiep', 3, 4)) as v(slug, pos, pts)
join designers d on d.slug = v.slug
join entries e on e.challenge_id = c.id and e.designer_id = d.id;

-- Entry points for non-podium (Raul, Oskar, Saara)
insert into participations (challenge_id, designer_id, points_awarded)
select c.id, e.designer_id, 2
from challenges c join seasons s on s.id = c.season_id and s.number = 4 and c.challenge_date = '2026-02-05'
join entries e on e.challenge_id = c.id
where not exists (select 1 from results r where r.challenge_id = c.id and r.entry_id = e.id);

-- ── Challenge 2 (5 Mar) — 2nd/3rd missing, entry points as placeholder ───────

insert into entries (challenge_id, designer_id)
select c.id, d.id from challenges c join seasons s on s.id = c.season_id and s.number = 4 and c.challenge_date = '2026-03-05'
cross join (values ('hiep'),('martin'),('oskar'),('raul'),('saara')) as v(slug) join designers d on d.slug = v.slug;

-- Only Hiep's win recorded — add 2nd/3rd via admin once known
insert into results (challenge_id, entry_id, position, points_awarded)
select c.id, e.id, 1, 10
from challenges c join seasons s on s.id = c.season_id and s.number = 4 and c.challenge_date = '2026-03-05'
join designers d on d.slug = 'hiep'
join entries e on e.challenge_id = c.id and e.designer_id = d.id;

-- Entry points (2 pts) for non-podium as placeholder — update when 2nd/3rd confirmed
insert into participations (challenge_id, designer_id, points_awarded)
select c.id, e.designer_id, 2
from challenges c join seasons s on s.id = c.season_id and s.number = 4 and c.challenge_date = '2026-03-05'
join entries e on e.challenge_id = c.id
where not exists (select 1 from results r where r.challenge_id = c.id and r.entry_id = e.id);

-- ── Challenge 3 (2 Apr) — current, no results yet ────────────────────────────
-- No entries or results inserted — ongoing challenge

-- ─── Emails (private — authenticated only) ────────────────────────────────────

insert into designer_emails (designer_id, email)
select id, 'hiep.le@nortal.com'    from designers where slug = 'hiep'
union all
select id, 'martin.babic@nortal.com' from designers where slug = 'martin';
