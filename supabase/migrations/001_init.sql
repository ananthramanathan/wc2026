-- WC2026 Predictor schema. Run in Supabase SQL editor.

create type mode_t as enum ('results', 'scores');
create type stage_t as enum ('group', 'r32', 'r16', 'qf', 'sf', 'final');
create type status_t as enum ('scheduled', 'live', 'finished', 'tbd');
create type outcome_t as enum ('H', 'D', 'A');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  mode mode_t not null,
  champion_team text,
  created_at timestamptz not null default now()
);

create table matches (
  id integer primary key,
  stage stage_t not null,
  group_label text,
  home_team text,
  away_team text,
  kickoff_utc timestamptz not null,
  status status_t not null default 'scheduled',
  home_score integer,
  away_score integer,
  home_odds numeric,
  draw_odds numeric,
  away_odds numeric,
  odds_updated_at timestamptz
);
create index matches_kickoff_idx on matches (kickoff_utc);
create index matches_status_idx on matches (status);

create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id integer not null references matches(id) on delete cascade,
  pred_home integer,
  pred_away integer,
  pred_outcome outcome_t not null,
  locked boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);
create index predictions_match_idx on predictions (match_id);
create index predictions_user_idx on predictions (user_id);

-- Server-side lock guard: reject any insert/update where the match has already kicked off.
create or replace function check_prediction_unlocked()
returns trigger language plpgsql as $$
declare
  k timestamptz;
begin
  select kickoff_utc into k from matches where id = new.match_id;
  if k is null then
    raise exception 'match % not found', new.match_id;
  end if;
  if now() >= k then
    raise exception 'match has already kicked off';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger predictions_lock_guard
  before insert or update on predictions
  for each row execute function check_prediction_unlocked();

-- Scoring view. NULL points until the match is finished.
create or replace view v_scored_predictions as
select
  p.id,
  p.user_id,
  p.match_id,
  p.pred_home,
  p.pred_away,
  p.pred_outcome,
  m.status,
  m.home_score,
  m.away_score,
  case
    when m.status <> 'finished' then 0::numeric
    when p.pred_home is not null and p.pred_away is not null
         and p.pred_home = m.home_score and p.pred_away = m.away_score then 3
    when p.pred_outcome = case
      when m.home_score > m.away_score then 'H'::outcome_t
      when m.home_score < m.away_score then 'A'::outcome_t
      else 'D'::outcome_t end
      and p.pred_home is not null and p.pred_away is not null
      and (p.pred_home - p.pred_away) = (m.home_score - m.away_score) then 1.5
    when p.pred_outcome = case
      when m.home_score > m.away_score then 'H'::outcome_t
      when m.home_score < m.away_score then 'A'::outcome_t
      else 'D'::outcome_t end then 1
    else 0
  end as scores_points,
  case
    when m.status <> 'finished' then 0::numeric
    when p.pred_outcome = case
      when m.home_score > m.away_score then 'H'::outcome_t
      when m.home_score < m.away_score then 'A'::outcome_t
      else 'D'::outcome_t end then 1
    else 0
  end as results_points
from predictions p
join matches m on m.id = p.match_id;

-- Per-user totals for both leagues.
create or replace view v_leaderboard as
select
  pr.id as user_id,
  pr.display_name,
  pr.avatar_url,
  pr.mode,
  coalesce((select sum(results_points) from v_scored_predictions s where s.user_id = pr.id), 0) as results_total,
  case when pr.mode = 'scores'
    then coalesce((select sum(scores_points) from v_scored_predictions s where s.user_id = pr.id), 0)
    else null end as scores_total
from profiles pr;

-- RLS
alter table profiles enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;

create policy "profiles readable by signed-in users"
  on profiles for select to authenticated using (true);
create policy "users insert own profile"
  on profiles for insert to authenticated with check (id = auth.uid());
create policy "users update own profile"
  on profiles for update to authenticated using (id = auth.uid());

create policy "matches readable by anyone signed in"
  on matches for select to authenticated using (true);
-- writes via service role only (bypasses RLS)

create policy "own predictions readable always"
  on predictions for select to authenticated
  using (user_id = auth.uid());
create policy "others predictions readable after kickoff"
  on predictions for select to authenticated
  using (exists (select 1 from matches m where m.id = match_id and now() >= m.kickoff_utc));

create policy "users insert own predictions"
  on predictions for insert to authenticated
  with check (user_id = auth.uid());
create policy "users update own predictions"
  on predictions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on v_scored_predictions to authenticated;
grant select on v_leaderboard to authenticated;
