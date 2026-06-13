import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { fetchActiveMatches, mapStatus } from "@/lib/football-data";
import { authCron } from "@/lib/cron";
import { getTeam } from "@/lib/teams";

// Pull live + recently finished matches from football-data.org, update DB.
// Matches our rows by canonical team-name pair + kickoff proximity (≤ 4h).
export async function GET(req: NextRequest) {
  const denied = authCron(req);
  if (denied) return denied;

  const supa = createAdmin();
  const { matches: live } = await fetchActiveMatches();

  // Local matches in a window around now for matching.
  // Window covers anything that could still be live, just-finished, or about to kick off.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supa
    .from("matches")
    .select("id, home_team, away_team, kickoff_utc, status")
    .gte("kickoff_utc", since)
    .lte("kickoff_utc", until);

  const canon = (n: string | null) => (n ? (getTeam(n)?.name ?? n) : "");
  const key = (a: string, b: string) => [canon(a), canon(b)].sort().join("|");

  const byKey = new Map<string, typeof rows>();
  (rows ?? []).forEach((m) => {
    if (!m.home_team || !m.away_team) return;
    const k = key(m.home_team, m.away_team);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(m);
  });

  let updated = 0;
  for (const m of live) {
    const homeCanon = canon(m.homeTeam.name);
    const awayCanon = canon(m.awayTeam.name);
    if (!homeCanon || !awayCanon) continue;
    const k = key(homeCanon, awayCanon);
    const candidates = byKey.get(k);
    if (!candidates || candidates.length === 0) continue;

    const target = candidates
      .map((row) => ({
        row,
        dt: Math.abs(new Date(row.kickoff_utc).getTime() - new Date(m.utcDate).getTime()),
      }))
      .sort((a, b) => a.dt - b.dt)[0];
    if (!target || target.dt > 4 * 60 * 60 * 1000) continue;

    const reversed = canon(target.row.home_team) !== homeCanon;
    const home_score = reversed ? m.score.fullTime.away : m.score.fullTime.home;
    const away_score = reversed ? m.score.fullTime.home : m.score.fullTime.away;
    const status = mapStatus(m.status);

    await supa.from("matches").update({
      status,
      home_score,
      away_score,
      score_updated_at: m.lastUpdated ?? new Date().toISOString(),
    }).eq("id", target.row.id);
    updated++;
  }

  return NextResponse.json({ feed_matches: live.length, updated });
}
