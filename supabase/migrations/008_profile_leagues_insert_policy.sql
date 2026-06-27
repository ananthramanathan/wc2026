-- Bug found 2026-06-27: profile_leagues had SELECT policy but no INSERT policy,
-- so the onboarding action's insert was silently denied by RLS. Two abacus
-- signups (Archit, Vihaan) ended up without membership rows → invisible to
-- themselves on the leaderboard.

drop policy if exists "league membership insertable by self" on profile_leagues;
create policy "league membership insertable by self"
  on profile_leagues for insert to authenticated
  with check (user_id = auth.uid());

grant insert on profile_leagues to authenticated;

-- Backfill anyone in profiles missing a profile_leagues row.
insert into profile_leagues (user_id, league, joined_at)
select id, league, created_at from profiles
on conflict do nothing;

-- Add Antman (Ananth, the operator) to abacus for testing. joined_at = now()
-- so his abacus standings start at zero, just like Arjun.
-- 3e87851d-cea3-4dd8-b028-63388fde5b85 = Antman.
insert into profile_leagues (user_id, league, joined_at)
values ('3e87851d-cea3-4dd8-b028-63388fde5b85', 'abacus', now())
on conflict do nothing;
