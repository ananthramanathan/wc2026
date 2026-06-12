import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Jersey } from "@/components/jersey";
import { dayLabel, flag, displayName, timeLocal } from "@/lib/format";
import { getTeam } from "@/lib/teams";
import { SignOutButton } from "./sign-out";
import { ProfileEditor } from "./editor";
import type { Match, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) redirect("/onboarding");

  const { data: scored } = await supabase
    .from("v_leaderboard")
    .select("results_total, scores_total, correct_results, exact_scores")
    .eq("user_id", user.id)
    .maybeSingle<{ results_total: number; scores_total: number; correct_results: number; exact_scores: number }>();

  const { data: preds } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  const matchIds = (preds ?? []).map((p) => p.match_id);
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("id", matchIds.length ? matchIds : [-1])
    .order("kickoff_utc", { ascending: false });

  const matchById = new Map((matches ?? []).map((m) => [m.id, m as Match]));

  const { data: teamRows } = await supabase
    .from("matches")
    .select("home_team, away_team")
    .not("home_team", "is", null);
  const teamSet = new Set<string>();
  teamRows?.forEach((m) => {
    if (m.home_team) teamSet.add(m.home_team);
    if (m.away_team) teamSet.add(m.away_team);
  });
  const teamList = Array.from(teamSet).sort();

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "Player";

  // Sanitize stale avatar_url (pre-refactor users have "rocket" etc.)
  const supportedTeam = getTeam(profile.avatar_url) ? profile.avatar_url : null;
  const countryLabel = supportedTeam ? displayName(supportedTeam) : "Pick a team";

  return (
    <AppShell title={fullName}>
      <div className="relative rounded-2xl bg-white border border-zinc-200 p-5 mb-4">
        <ProfileEditor
          current={{
            display_name: profile.display_name,
            avatar_url: supportedTeam,
            champion_team: profile.champion_team,
          }}
          teams={teamList}
        />
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center shrink-0">
            <Jersey team={supportedTeam} size={88} />
            <div className="text-xs font-semibold text-zinc-700 mt-1.5 max-w-[5.5rem] text-center truncate">
              {countryLabel}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg leading-tight truncate">{profile.display_name}</div>
            {profile.champion_team && (
              <div className="text-xs text-zinc-500 mt-2">Champion pick: {profile.champion_team}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Stat label="Results pts" value={scored?.results_total ?? 0} sub={`${scored?.correct_results ?? 0} correct`} />
        <Stat label="Scores pts" value={scored?.scores_total ?? 0} sub={`${scored?.exact_scores ?? 0} exact`} />
      </div>

      <h2 className="text-sm font-semibold text-zinc-500 mb-2">Your picks</h2>
      <div className="space-y-2">
        {(preds ?? []).map((p) => {
          const m = matchById.get(p.match_id);
          if (!m) return null;
          const kicked = new Date(m.kickoff_utc) <= new Date();
          const status = m.status === "finished" ? "Scored" : kicked ? "Locked" : "Open";
          return (
            <div
              key={p.id}
              className="rounded-xl bg-white border border-zinc-200 p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {flag(m.home_team)} {displayName(m.home_team)} vs {displayName(m.away_team)} {flag(m.away_team)}
                </div>
                <div className="text-xs text-zinc-500">
                  {dayLabel(m.kickoff_utc)} · {timeLocal(m.kickoff_utc)}
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="font-semibold">
                  {p.pred_home !== null ? `${p.pred_home}-${p.pred_away}` : p.pred_outcome}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-zinc-400">{status}</div>
              </div>
            </div>
          );
        })}
        {(preds ?? []).length === 0 && (
          <div className="text-sm text-zinc-500 text-center py-6">
            No picks yet — head to Fixtures.
          </div>
        )}
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white border border-zinc-200 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-bold tabular-nums leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}
