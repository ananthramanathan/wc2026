import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import {
  fetchOdds,
  averageH2H,
  totalsAtMainLine,
  spreadAtMainLine,
} from "@/lib/odds-api";
import { authCron } from "@/lib/cron";
import { getTeam } from "@/lib/teams";

// Daily odds refresh. Maps the-odds-api fixtures to our matches by team-pair +
// kickoff proximity (≤ 4h). Writes h2h (home/draw/away), totals (over/under at
// the main line), and spreads (favourite handicap at the main line).
export async function GET(req: NextRequest) {
  const denied = authCron(req);
  if (denied) return denied;

  const supa = createAdmin();
  const { items, remaining, used } = await fetchOdds();

  const { data: matches } = await supa
    .from("matches")
    .select("id, home_team, away_team, kickoff_utc, status")
    .neq("status", "finished");

  const key = (a: string, b: string) =>
    [a, b].map((t) => getTeam(t)?.name ?? t).sort().join("|");

  const byKey = new Map<string, typeof matches>();
  (matches ?? []).forEach((m) => {
    if (!m.home_team || !m.away_team) return;
    const k = key(m.home_team, m.away_team);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(m);
  });

  let updated = 0;
  for (const item of items) {
    const canonicalHome = getTeam(item.home_team)?.name ?? item.home_team;
    const canonicalAway = getTeam(item.away_team)?.name ?? item.away_team;
    const k = key(canonicalHome, canonicalAway);
    const candidates = byKey.get(k);
    if (!candidates) continue;
    const target = candidates
      .map((m) => ({
        m,
        dt: Math.abs(new Date(m.kickoff_utc).getTime() - new Date(item.commence_time).getTime()),
      }))
      .sort((a, b) => a.dt - b.dt)[0];
    if (!target || target.dt > 4 * 60 * 60 * 1000) continue;

    const h2h = averageH2H(item);
    if (!h2h) continue;

    const totals = totalsAtMainLine(item);
    const spread = spreadAtMainLine(item);

    // home/away in our DB may be reversed vs odds-api; swap if needed.
    const reversed = target.m.home_team !== canonicalHome;
    const home_odds = reversed ? h2h.away : h2h.home;
    const away_odds = reversed ? h2h.home : h2h.away;

    // Spread line sign convention in odds-api: negative = favourite. We store
    // signed spread_line where positive = home is favourite. Flip if reversed.
    const spreadLine = spread
      ? reversed
        ? -spread.line
        : spread.line
      : null;
    const spreadHomePrice = spread ? (reversed ? spread.away : spread.home) : null;
    const spreadAwayPrice = spread ? (reversed ? spread.home : spread.away) : null;

    await supa.from("matches").update({
      home_odds,
      draw_odds: h2h.draw,
      away_odds,
      total_line: totals?.line ?? null,
      over_price: totals?.over ?? null,
      under_price: totals?.under ?? null,
      spread_line: spreadLine,
      spread_home_price: spreadHomePrice,
      spread_away_price: spreadAwayPrice,
      odds_updated_at: new Date().toISOString(),
    }).eq("id", target.m.id);
    updated++;
  }
  return NextResponse.json({ items: items.length, updated, remaining, used });
}
