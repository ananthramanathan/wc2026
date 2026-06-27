import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LeaderboardView, type LbRow, type PrevRank } from "./view";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, league")
    .eq("id", user.id)
    .maybeSingle<{ id: string; league: string }>();
  if (!profile) redirect("/onboarding");
  const primaryLeague = profile.league ?? "main";

  // Viewer's leagues. Empty result = pre-migration fallback, treat as primary only.
  const { data: memberships } = await supabase
    .from("profile_leagues")
    .select("league")
    .eq("user_id", user.id);
  const leagues = (memberships && memberships.length > 0
    ? memberships.map((m) => m.league)
    : [primaryLeague]
  ).sort((a, b) => (a === primaryLeague ? -1 : b === primaryLeague ? 1 : a.localeCompare(b)));

  const today = new Date().toISOString().slice(0, 10);

  // Fetch each league's rows + prev snapshot in parallel.
  const perLeague = await Promise.all(
    leagues.map(async (league) => {
      const [{ data: rows }, { data: lastDateRow }] = await Promise.all([
        supabase.from("v_leaderboard").select("*").eq("league", league),
        supabase
          .from("leaderboard_snapshots")
          .select("snap_date")
          .eq("league", league)
          .lt("snap_date", today)
          .order("snap_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      let prev: PrevRank[] = [];
      if (lastDateRow?.snap_date) {
        const { data } = await supabase
          .from("leaderboard_snapshots")
          .select("user_id, results_rank, scores_rank")
          .eq("league", league)
          .eq("snap_date", lastDateRow.snap_date);
        prev = data ?? [];
      }
      return { league, rows: (rows ?? []) as LbRow[], prev };
    }),
  );

  return (
    <AppShell title="Leaderboards">
      <LeaderboardView
        perLeague={perLeague}
        defaultLeague={primaryLeague}
        meId={user.id}
      />
    </AppShell>
  );
}
