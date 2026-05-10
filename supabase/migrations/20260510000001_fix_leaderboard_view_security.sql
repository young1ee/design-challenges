-- Recreate season_leaderboard with security_invoker so RLS policies of the
-- querying user are enforced instead of the view owner's permissions.
create or replace view season_leaderboard
  with (security_invoker = on)
as
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
