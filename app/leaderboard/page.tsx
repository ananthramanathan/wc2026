import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LeaderboardView, type LbRow } from "./view";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("id, league").eq("id", user.id).maybeSingle<{ id: string; league: string }>();
  if (!profile) redirect("/onboarding");
  const league = profile.league ?? "main";

  const { data: rows } = await supabase
    .from("v_leaderboard")
    .select("*")
    .eq("league", league)
    .order("results_total", { ascending: false });

  // Most recent snapshot strictly before today, for ↑/↓ deltas — scoped to this league.
  const today = new Date().toISOString().slice(0, 10);
  const { data: lastDateRow } = await supabase
    .from("leaderboard_snapshots")
    .select("snap_date")
    .eq("league", league)
    .lt("snap_date", today)
    .order("snap_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  let prev: { user_id: string; results_rank: number; scores_rank: number }[] = [];
  if (lastDateRow?.snap_date) {
    const { data } = await supabase
      .from("leaderboard_snapshots")
      .select("user_id, results_rank, scores_rank")
      .eq("league", league)
      .eq("snap_date", lastDateRow.snap_date);
    prev = data ?? [];
  }

  return (
    <AppShell title="Leaderboards">
      <LeaderboardView
        rows={(rows ?? []) as LbRow[]}
        prev={prev}
        meId={user.id}
      />
    </AppShell>
  );
}
