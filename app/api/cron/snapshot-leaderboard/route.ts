import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { authCron } from "@/lib/cron";

// Daily rank snapshot. Run once per day (cron-job.org @ ~02:00 UTC).
// Ranks are computed PER LEAGUE using the same tiebreakers the UI uses.
// Idempotent on (snap_date, league, user_id).
export async function GET(req: NextRequest) {
  const denied = authCron(req);
  if (denied) return denied;

  const supa = createAdmin();
  const { data: rows, error } = await supa
    .from("v_leaderboard")
    .select("user_id, display_name, league, results_total, scores_total, correct_results, exact_scores");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = {
    user_id: string;
    display_name: string;
    league: string;
    results_total: number;
    scores_total: number;
    correct_results: number;
    exact_scores: number;
  };
  const all = (rows ?? []) as Row[];

  // Group by league, then rank within each league.
  const byLeague = new Map<string, Row[]>();
  for (const r of all) {
    if (!byLeague.has(r.league)) byLeague.set(r.league, []);
    byLeague.get(r.league)!.push(r);
  }

  const snap_date = new Date().toISOString().slice(0, 10);
  const payload: {
    snap_date: string;
    league: string;
    user_id: string;
    results_rank: number;
    scores_rank: number;
  }[] = [];

  for (const [league, members] of byLeague) {
    const results = [...members].sort(
      (a, b) =>
        b.results_total - a.results_total ||
        b.correct_results - a.correct_results ||
        a.display_name.localeCompare(b.display_name),
    );
    const scores = [...members].sort(
      (a, b) =>
        b.scores_total - a.scores_total ||
        b.exact_scores - a.exact_scores ||
        a.display_name.localeCompare(b.display_name),
    );
    const resultsRank = new Map(results.map((r, i) => [r.user_id, i + 1]));
    const scoresRank = new Map(scores.map((r, i) => [r.user_id, i + 1]));
    for (const m of members) {
      payload.push({
        snap_date,
        league,
        user_id: m.user_id,
        results_rank: resultsRank.get(m.user_id)!,
        scores_rank: scoresRank.get(m.user_id)!,
      });
    }
  }

  const { error: upErr } = await supa
    .from("leaderboard_snapshots")
    .upsert(payload, { onConflict: "snap_date,league,user_id" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ snap_date, count: payload.length, leagues: byLeague.size });
}
