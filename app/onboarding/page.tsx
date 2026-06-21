import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./form";

export const dynamic = "force-dynamic";

const LEAGUE = /^[a-z0-9-]{2,32}$/;

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) redirect("/");

  const { data: teams } = await supabase
    .from("matches")
    .select("home_team, away_team")
    .not("home_team", "is", null);

  const teamSet = new Set<string>();
  teams?.forEach((m) => {
    if (m.home_team) teamSet.add(m.home_team);
    if (m.away_team) teamSet.add(m.away_team);
  });
  const teamList = Array.from(teamSet).sort();

  const jar = await cookies();
  const rawLeague = jar.get("wc_league")?.value;
  const league = rawLeague && LEAGUE.test(rawLeague) ? rawLeague : "main";

  return (
    <main className="min-h-screen px-5 py-8 max-w-md mx-auto">
      {league !== "main" && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
          Joining league <span className="text-emerald-900">{league}</span>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-1">Register your team</h1>
      <p className="text-zinc-500 mb-6">A few quick choices and you&apos;re in.</p>
      <OnboardingForm teams={teamList} defaultName={user.user_metadata?.name ?? ""} />
    </main>
  );
}
