import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { fetchOpenFootball } from "@/lib/openfootball";
import { authCron } from "@/lib/cron";

// Pulls the latest fixtures + final scores from openfootball/worldcup.json.
// Same source as the seed — handles new scores and resolved knockout teams.
export async function GET(req: NextRequest) {
  const denied = authCron(req);
  if (denied) return denied;

  const supa = createAdmin();
  const rows = await fetchOpenFootball();
  const { error } = await supa.from("matches").upsert(rows, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: rows.length });
}
