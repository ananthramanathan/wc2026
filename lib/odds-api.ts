// the-odds-api.com. Free tier = 500 req/month. Each call returns all upcoming
// matches in one shot, so 1 call/day is plenty (~38 over the tournament).
// Pulls h2h + spreads + totals together — one request still counts as one credit
// no matter how many markets are listed.

const BASE = "https://api.the-odds-api.com/v4";
const SPORT = "soccer_fifa_world_cup";

interface OddsItem {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

export async function fetchOdds() {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY missing");
  const url = new URL(`${BASE}/sports/${SPORT}/odds/`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "eu");
  url.searchParams.set("markets", "h2h,spreads,totals");
  url.searchParams.set("oddsFormat", "decimal");

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`odds-api ${r.status}: ${await r.text()}`);
  const remaining = r.headers.get("x-requests-remaining");
  const used = r.headers.get("x-requests-used");
  const data = (await r.json()) as OddsItem[];
  return { items: data, remaining, used };
}

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

// For point-based markets (spreads, totals): pick the line most bookmakers quote,
// then average the prices at that line. Avoids skew from a single book quoting an
// unusual handicap.
function mainLine(item: OddsItem, marketKey: "spreads" | "totals") {
  const counts = new Map<number, number>();
  for (const bm of item.bookmakers) {
    const m = bm.markets.find((x) => x.key === marketKey);
    if (!m) continue;
    // Each market has two outcomes; both share the same |point|.
    const point = m.outcomes[0]?.point;
    if (point == null) continue;
    const abs = Math.abs(point);
    counts.set(abs, (counts.get(abs) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  // Most-quoted; ties broken by lower line (closer to consensus).
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0] - b[0],
  )[0][0];
}

export function totalsAtMainLine(item: OddsItem) {
  const line = mainLine(item, "totals");
  if (line == null) return null;
  const overs: number[] = [];
  const unders: number[] = [];
  for (const bm of item.bookmakers) {
    const m = bm.markets.find((x) => x.key === "totals");
    if (!m) continue;
    const over = m.outcomes.find((o) => o.name === "Over" && o.point === line);
    const under = m.outcomes.find((o) => o.name === "Under" && o.point === line);
    if (over && under) {
      overs.push(over.price);
      unders.push(under.price);
    }
  }
  if (overs.length === 0) return null;
  const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
  return { line, over: avg(overs), under: avg(unders) };
}

export function spreadAtMainLine(item: OddsItem) {
  const absLine = mainLine(item, "spreads");
  if (absLine == null) return null;
  const homePrices: number[] = [];
  const awayPrices: number[] = [];
  // Sign convention: positive spread_line = home is favourite by that many goals.
  // We need to figure out which side is favourite at this absLine — favourite is
  // the side with the NEGATIVE point in the book quotes.
  let homeIsFavourite = 0;
  let awayIsFavourite = 0;
  for (const bm of item.bookmakers) {
    const m = bm.markets.find((x) => x.key === "spreads");
    if (!m) continue;
    const home = m.outcomes.find(
      (o) => o.name === item.home_team && Math.abs(o.point ?? 0) === absLine,
    );
    const away = m.outcomes.find(
      (o) => o.name === item.away_team && Math.abs(o.point ?? 0) === absLine,
    );
    if (!home || !away) continue;
    if ((home.point ?? 0) < 0) homeIsFavourite++;
    else awayIsFavourite++;
    homePrices.push(home.price);
    awayPrices.push(away.price);
  }
  if (homePrices.length === 0) return null;
  const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
  const signedLine = homeIsFavourite >= awayIsFavourite ? absLine : -absLine;
  return { line: signedLine, home: avg(homePrices), away: avg(awayPrices) };
}
