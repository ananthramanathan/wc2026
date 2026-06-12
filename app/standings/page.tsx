import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { computeStandings } from "@/lib/standings";
import { flag, displayName } from "@/lib/format";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("stage", "group");

  const standings = computeStandings((matches ?? []) as Match[]);

  return (
    <AppShell title="Groups">
      <div className="space-y-5">
        {Array.from(standings.entries()).map(([group, rows]) => (
          <section key={group} className="rounded-2xl bg-white border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="font-bold">Group {group}</h2>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">P W D L GD PTS</div>
            </div>
            <ul>
              {rows.map((r, i) => (
                <li
                  key={r.team}
                  className={`px-4 py-2.5 grid grid-cols-[1.25rem_1.5rem_1fr_auto_auto_auto_auto_auto_auto] gap-2 items-center text-sm border-t border-zinc-100 first:border-t-0 ${
                    i < 2 ? "bg-emerald-50/40" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-400 tabular-nums">{i + 1}</span>
                  <span className="text-base">{flag(r.team)}</span>
                  <span className="font-medium truncate">{displayName(r.team)}</span>
                  <span className="tabular-nums text-zinc-500 w-5 text-center">{r.played}</span>
                  <span className="tabular-nums text-zinc-700 w-5 text-center">{r.won}</span>
                  <span className="tabular-nums text-zinc-700 w-5 text-center">{r.drawn}</span>
                  <span className="tabular-nums text-zinc-700 w-5 text-center">{r.lost}</span>
                  <span className={`tabular-nums w-7 text-center ${r.gd > 0 ? "text-emerald-700" : r.gd < 0 ? "text-red-600" : "text-zinc-500"}`}>
                    {r.gd > 0 ? "+" : ""}{r.gd}
                  </span>
                  <span className="tabular-nums w-6 text-center font-bold">{r.pts}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="text-[11px] text-zinc-400 mt-5 px-1">
        Top 2 from each group advance to the Round of 32, plus the 8 best 3rd-placed teams.
      </p>
    </AppShell>
  );
}
