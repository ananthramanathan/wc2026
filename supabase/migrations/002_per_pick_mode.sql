-- Drop the one-way-door mode gate. Mode becomes a profile preference, not a constraint.
-- Per-prediction: pred_home/pred_away nullable already; null = results-only pick.

alter table profiles alter column mode drop not null;

-- Expand the leaderboard view: include correct_results and exact_scores tallies.
-- Scores league now eligible for anyone with score-mode picks (not gated on profile.mode).
create or replace view v_leaderboard as
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
