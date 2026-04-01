alter table challenges
  add column if not exists status text not null default 'closed'
    check (status in ('open', 'closed'));

-- Backfill: past challenges are done, current one is open
update challenges set status = 'open'
where challenge_date = '2026-04-02';
