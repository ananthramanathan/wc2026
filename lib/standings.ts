import type { Match } from "@/lib/types";

export interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export function computeStandings(matches: Match[]): Map<string, StandingRow[]> {
  const byGroup = new Map<string, Match[]>();
  matches
    .filter((m) => m.stage === "group" && m.group_label)
    .forEach((m) => {
      const k = m.group_label!;
      if (!byGroup.has(k)) byGroup.set(k, []);
      byGroup.get(k)!.push(m);
    });

  const out = new Map<string, StandingRow[]>();
  Array.from(byGroup.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([g, ms]) => {
      const map = new Map<string, StandingRow>();
      const ensure = (t: string) => {
        if (!map.has(t))
          map.set(t, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
        return map.get(t)!;
      };
      ms.forEach((m) => {
        if (m.home_team) ensure(m.home_team);
        if (m.away_team) ensure(m.away_team);
        if (m.status !== "finished" || m.home_score == null || m.away_score == null) return;
        const h = ensure(m.home_team!);
        const a = ensure(m.away_team!);
        h.played++; a.played++;
        h.gf += m.home_score; h.ga += m.away_score;
        a.gf += m.away_score; a.ga += m.home_score;
        if (m.home_score > m.away_score) { h.won++; h.pts += 3; a.lost++; }
        else if (m.home_score < m.away_score) { a.won++; a.pts += 3; h.lost++; }
        else { h.drawn++; a.drawn++; h.pts++; a.pts++; }
      });
      const rows = Array.from(map.values()).map((r) => ({ ...r, gd: r.gf - r.ga }));
      rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
      out.set(g, rows);
    });
  return out;
}
