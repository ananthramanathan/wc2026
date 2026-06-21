-- Single-column league mode. Default everyone to 'main'. New users land in
-- their league by visiting /join/<code> first; that sets a cookie which the
-- onboarding action persists onto their profile.

alter table profiles
  add column if not exists league text not null default 'main';
create index if not exists profiles_league_idx on profiles (league);

alter table leaderboard_snapshots
  add column if not exists league text not null default 'main';
alter table leaderboard_snapshots drop constraint if exists leaderboard_snapshots_pkey;
alter table leaderboard_snapshots add primary key (snap_date, league, user_id);
create index if not exists leaderboard_snapshots_league_date_idx
  on leaderboard_snapshots (league, snap_date desc);

drop view if exists v_leaderboard;
create view v_leaderboard as
select
  pr.id as user_id,
  pr.display_name,
  pr.avatar_url,
  pr.mode,
  pr.league,
  coalesce((select sum(results_points) from v_scored_predictions s where s.user_id = pr.id), 0) as results_total,
  coalesce((select sum(scores_points)  from v_scored_predictions s where s.user_id = pr.id), 0) as scores_total,
  coalesce((select count(*) from v_scored_predictions s where s.user_id = pr.id and s.results_points > 0), 0) as correct_results,
  coalesce((select count(*) from v_scored_predictions s where s.user_id = pr.id and s.scores_points = 3),   0) as exact_scores
from profiles pr;
grant select on v_leaderboard to authenticated;
