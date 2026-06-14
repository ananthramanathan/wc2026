-- Two things:
-- 1. Migration 002's `create or replace view v_leaderboard` silently failed in prod
--    because Postgres won't change column types via REPLACE. Drop + recreate.
-- 2. Daily rank snapshots so the leaderboard can show ↑/↓ movement.

drop view if exists v_leaderboard;
create view v_leaderboard as
select
  pr.id as user_id,
  pr.display_name,
  pr.avatar_url,
  pr.mode,
  coalesce((select sum(results_points) from v_scored_predictions s where s.user_id = pr.id), 0) as results_total,
  coalesce((select sum(scores_points)  from v_scored_predictions s where s.user_id = pr.id), 0) as scores_total,
  coalesce((select count(*) from v_scored_predictions s where s.user_id = pr.id and s.results_points > 0), 0) as correct_results,
  coalesce((select count(*) from v_scored_predictions s where s.user_id = pr.id and s.scores_points = 3),   0) as exact_scores
from profiles pr;
grant select on v_leaderboard to authenticated;

create table if not exists leaderboard_snapshots (
  snap_date date not null,
  user_id uuid not null references profiles(id) on delete cascade,
  results_rank integer not null,
  scores_rank integer not null,
  primary key (snap_date, user_id)
);
create index if not exists leaderboard_snapshots_date_idx
  on leaderboard_snapshots (snap_date desc);

alter table leaderboard_snapshots enable row level security;
drop policy if exists "snapshots readable by anyone signed in" on leaderboard_snapshots;
create policy "snapshots readable by anyone signed in"
  on leaderboard_snapshots for select to authenticated using (true);

grant select on leaderboard_snapshots to authenticated;
