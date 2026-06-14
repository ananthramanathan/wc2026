import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { fetchOpenFootball } from "@/lib/openfootball";
import { authCron } from "@/lib/cron";

// Pulls the latest fixtures + final scores from openfootball/worldcup.json.
// Source has no live data — only FTs. So we MUST NOT overwrite rows that
// `live-scores` has already marked `live`/`finished`. Otherwise we wipe the
// running score every 30 min.
//
// Bulk upsert requires a uniform payload shape (PostgREST fills missing keys
// with null on insert/update, which violates the NOT NULL on `status`). So
// every row in the payload includes status/home_score/away_score — for
// "preserve" rows we re-send the current DB values as a no-op.
export async function GET(req: NextRequest) {
  const denied = authCron(req);
  if (denied) return denied;

  const supa = createAdmin();
  const rows = await fetchOpenFootball();

  const { data: existing } = await supa
    .from("matches")
    .select("id, status, home_score, away_score");
  const dbById = new Map<
    number,
    { status: string; home_score: number | null; away_score: number | null }
  >(
    (existing ?? []).map((r) => [
      r.id as number,
      {
        status: r.status as string,
        home_score: r.home_score as number | null,
        away_score: r.away_score as number | null,
      },
    ]),
  );

  const payload = rows.map((r) => {
    const base = {
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

    // Preserve rows live-scores owns. Re-send DB values so the payload shape
    // is uniform and the upsert is a no-op for status/score.
    const cur = dbById.get(r.id);
    if (cur && (cur.status === "live" || cur.status === "finished")) {
      return {
        ...base,
        status: cur.status,
        home_score: cur.home_score,
        away_score: cur.away_score,
      };
    }

    return {
      ...base,
      status: r.status,
      home_score: null as number | null,
      away_score: null as number | null,
    };
  });

  const { error } = await supa
    .from("matches")
    .upsert(payload, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: payload.length });
}
