alter table challenges drop constraint if exists challenges_status_check;
alter table challenges add constraint challenges_status_check
  check (status in ('open', 'closed'));

update challenges set status = 'closed' where status = 'done';
