import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { fetchOpenFootball } from "@/lib/openfootball";
import { authCron } from "@/lib/cron";

// Pulls the latest fixtures + final scores from openfootball/worldcup.json.
// Source has no live data — only FTs. So we MUST NOT overwrite rows that
// `live-scores` has already marked `live`/`finished`. Otherwise we wipe the
// running score every 30 min.
export async function GET(req: NextRequest) {
  const denied = authCron(req);
  if (denied) return denied;

  const supa = createAdmin();
  const rows = await fetchOpenFootball();

  const { data: existing } = await supa.from("matches").select("id, status");
  const dbStatus = new Map<number, string>(
    (existing ?? []).map((r) => [r.id as number, r.status as string]),
  );

  type Payload = {
    id: number;
    stage: string;
    group_label: string | null;
    home_team: string | null;
    away_team: string | null;
    kickoff_utc: string;
    status?: string;
    home_score?: number | null;
    away_score?: number | null;
  };

  const payload: Payload[] = rows.map((r) => {
    const base: Payload = {
      id: r.id,
      stage: r.stage,
      group_label: r.group_label,
      home_team: r.home_team,
      away_team: r.away_team,
      kickoff_utc: r.kickoff_utc,
    };
    // openfootball has the FT → authoritative, always write.
    if (r.status === "finished") {
      return {
        ...base,
        status: "finished",
        home_score: r.home_score,
        away_score: r.away_score,
      };
    }
    // Don't clobber a row live-scores is actively managing.
    const cur = dbStatus.get(r.id);
    if (cur === "live" || cur === "finished") return base;
    return { ...base, status: r.status };
  });

  const { error } = await supa
    .from("matches")
    .upsert(payload, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: payload.length });
}
