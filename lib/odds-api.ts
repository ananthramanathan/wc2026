// the-odds-api.com. Free tier = 500 req/month. Each call returns all upcoming
// matches in one shot, so 1 call/day is plenty (~38 over the tournament).

const BASE = "https://api.the-odds-api.com/v4";
const SPORT = "soccer_fifa_world_cup";

interface OddsItem {
  id: string;
  sport_key: string;
  commence_time: string; // ISO
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
}

export async function fetchOdds() {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY missing");
  const url = new URL(`${BASE}/sports/${SPORT}/odds/`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "eu");
  url.searchParams.set("markets", "h2h");
  url.searchParams.set("oddsFormat", "decimal");

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`odds-api ${r.status}: ${await r.text()}`);
  const remaining = r.headers.get("x-requests-remaining");
  const used = r.headers.get("x-requests-used");
  const data = (await r.json()) as OddsItem[];
  return { items: data, remaining, used };
}

// Average across bookmakers, fall back to first if averaging fails.
export function averageH2H(item: OddsItem) {
  const homeOdds: number[] = [];
  const drawOdds: number[] = [];
  const awayOdds: number[] = [];
  for (const bm of item.bookmakers) {
    const m = bm.markets.find((x) => x.key === "h2h");
    if (!m) continue;
    const h = m.outcomes.find((o) => o.name === item.home_team)?.price;
    const a = m.outcomes.find((o) => o.name === item.away_team)?.price;
    const d = m.outcomes.find((o) => o.name === "Draw")?.price;
    if (h && a && d) {
      homeOdds.push(h);
      drawOdds.push(d);
      awayOdds.push(a);
    }
  }
  if (homeOdds.length === 0) return null;
  const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
  return { home: avg(homeOdds), draw: avg(drawOdds), away: avg(awayOdds) };
}
