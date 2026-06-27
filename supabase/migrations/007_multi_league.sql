-- Multi-league per user, gated by joined_at.
-- A user's points in a league = points from picks for matches that kicked off
-- after they joined that league. Existing users keep counting everything they
-- ever did (joined_at = profile.created_at, pre-tournament). Arjun joining
-- abacus mid-tournament starts at zero — only matches after now() count.

create table if not exists profile_leagues (
  user_id uuid not null references profiles(id) on delete cascade,
  league text not null,
  joined_at timestamptz not null default now(),
  primary key (user_id, league)
);
create index if not exists profile_leagues_league_idx on profile_leagues (league);

alter table profile_leagues enable row level security;
drop policy if exists "league membership readable by anyone signed in" on profile_leagues;
create policy "league membership readable by anyone signed in"
  on profile_leagues for select to authenticated using (true);
grant select on profile_leagues to authenticated;

-- Backfill every existing profile into their current single league, dated to
-- their signup. on conflict do nothing so re-runs are idempotent.
insert into profile_leagues (user_id, league, joined_at)
select id, league, created_at from profiles
on conflict do nothing;

-- Add Arjun to abacus with joined_at = now().
-- 04073bca-7574-4d78-acbb-bef1cdcfe783 = Arjun Narayanan.
insert into profile_leagues (user_id, league, joined_at)
values ('04073bca-7574-4d78-acbb-bef1cdcfe783', 'abacus', now())
on conflict do nothing;

-- Rewrite v_leaderboard to source league from profile_leagues and gate scoring
-- by kickoff_utc >= joined_at. Shape unchanged so the snapshot cron + page
-- keep working without further coordination.
drop view if exists v_leaderboard;
create view v_leaderboard as
select
  pl.user_id,
  p.display_name,
  p.avatar_url,
  p.mode,
  pl.league,
  coalesce(sum(case when m.kickoff_utc >= pl.joined_at then s.results_points end), 0) as results_total,
  coalesce(sum(case when m.kickoff_utc >= pl.joined_at then s.scores_points  end), 0) as scores_total,
  coalesce(count(*) filter (where m.kickoff_utc >= pl.joined_at and s.results_points > 0), 0) as correct_results,
  coalesce(count(*) filter (where m.kickoff_utc >= pl.joined_at and s.scores_points = 3),  0) as exact_scores
from profile_leagues pl
join profiles p on p.id = pl.user_id
left join v_scored_predictions s on s.user_id = pl.user_id
left join matches m on m.id = s.match_id
group by pl.user_id, p.display_name, p.avatar_url, p.mode, pl.league;
grant select on v_leaderboard to authenticated;

-- reversal (if anything looks wrong):
--   delete from profile_leagues where league = 'abacus';
--   drop view v_leaderboard;
--   create view v_leaderboard as ... (006 definition with profiles.league join);
