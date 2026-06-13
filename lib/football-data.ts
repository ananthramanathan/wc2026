// football-data.org WC2026 live-score wrapper. Free tier: 10 req/min.
// We poll only during match windows from GitHub Actions, so usage is well under cap.

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

type ApiStatus =
  | "SCHEDULED" | "TIMED" | "IN_PLAY" | "PAUSED" | "LIVE"
  | "FINISHED" | "POSTPONED" | "SUSPENDED" | "CANCELLED";

interface ApiMatch {
  id: number;
  utcDate: string;
  status: ApiStatus;
  lastUpdated?: string;
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime?: { home: number | null; away: number | null };
  };
}

interface ApiResponse {
  matches: ApiMatch[];
}

function key() {
  const k = process.env.FOOTBALL_DATA_KEY;
  if (!k) throw new Error("FOOTBALL_DATA_KEY missing");
  return k;
}

export async function fetchActiveMatches() {
  const r = await fetch(
    `${BASE}/competitions/${COMPETITION}/matches?status=LIVE,IN_PLAY,PAUSED,FINISHED`,
    { headers: { "X-Auth-Token": key() }, cache: "no-store" },
  );
  if (!r.ok) throw new Error(`football-data ${r.status}: ${await r.text()}`);
  return (await r.json()) as ApiResponse;
}

export function mapStatus(s: ApiStatus): "scheduled" | "live" | "finished" | "tbd" {
  if (s === "FINISHED") return "finished";
  if (s === "IN_PLAY" || s === "LIVE" || s === "PAUSED") return "live";
  return "scheduled";
}
