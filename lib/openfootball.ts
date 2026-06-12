// openfootball/worldcup.json fetcher + transformer.
// Single source of truth for fixtures + final scores. Free, no key.

const URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

interface RawMatch {
  num?: number;
  round: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "13:00 UTC-6"
  team1: string;
  team2: string;
  score?: { ft?: [number, number]; ht?: [number, number] };
  group?: string; // e.g. "Group A"
  ground?: string;
}

interface RawData {
  name: string;
  matches: RawMatch[];
}

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "final";
export type Status = "scheduled" | "live" | "finished" | "tbd";

export interface NormalisedMatch {
  id: number;
  stage: Stage;
  group_label: string | null;
  home_team: string | null;
  away_team: string | null;
  kickoff_utc: string;
  status: Status;
  home_score: number | null;
  away_score: number | null;
}

function isResolvedTeam(name: string): boolean {
  // openfootball uses placeholders like "1A", "2B", "W74", "3A/B/C/D/F" until teams resolve.
  if (/^[WL]\d+$/.test(name)) return false;
  if (/^\d[A-L]$/.test(name)) return false;
  if (/^\d[A-L]\/[A-L/]+$/.test(name)) return false;
  return true;
}

function mapStage(round: string): Stage {
  if (round.startsWith("Matchday")) return "group";
  if (round === "Round of 32") return "r32";
  if (round === "Round of 16") return "r16";
  if (round === "Quarter-final") return "qf";
  if (round === "Semi-final") return "sf";
  return "final"; // Final + "Match for third place"
}

function parseKickoffToUtcIso(date: string, time: string): string {
  // time = "13:00 UTC-6" → ISO 8601 with offset
  const m = time.match(/^(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})$/);
  if (!m) throw new Error(`bad time: ${time}`);
  const [, hh, mm, off] = m;
  const sign = off.startsWith("-") ? "-" : "+";
  const hours = Math.abs(Number(off)).toString().padStart(2, "0");
  // Build an ISO with the local offset, then convert to UTC via Date.
  const iso = `${date}T${hh.padStart(2, "0")}:${mm}:00${sign}${hours}:00`;
  return new Date(iso).toISOString();
}

export async function fetchOpenFootball(): Promise<NormalisedMatch[]> {
  const r = await fetch(URL, { cache: "no-store" });
  if (!r.ok) throw new Error(`openfootball ${r.status}`);
  const data = (await r.json()) as RawData;

  return data.matches.map((m, i): NormalisedMatch => {
    const home_resolved = isResolvedTeam(m.team1);
    const away_resolved = isResolvedTeam(m.team2);
    const both_resolved = home_resolved && away_resolved;
    const has_score = !!m.score?.ft;
    return {
      id: m.num ?? i + 1,
      stage: mapStage(m.round),
      group_label: m.group?.replace(/^Group\s+/, "") ?? null,
      home_team: home_resolved ? m.team1 : null,
      away_team: away_resolved ? m.team2 : null,
      kickoff_utc: parseKickoffToUtcIso(m.date, m.time),
      status: has_score ? "finished" : both_resolved ? "scheduled" : "tbd",
      home_score: m.score?.ft?.[0] ?? null,
      away_score: m.score?.ft?.[1] ?? null,
    };
  });
}
