import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { FixturesView } from "./fixtures-view";
import type { Match, Prediction, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  if (!profile) redirect("/onboarding");
  const league = (profile as Profile & { league?: string }).league ?? "main";

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_utc", { ascending: true });

  const { data: myPreds } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  // League-scoped roster (only same-league players are revealed to each other).
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, league")
    .eq("league", league);
  const leagueIds = (profiles ?? []).map((p) => p.id);

  // Others' picks for kicked-off matches — RLS still gates reveal time;
  // we additionally constrain to same-league users so cross-league picks
  // never appear on the card.
  const { data: allPreds } = await supabase
    .from("predictions")
    .select("id, user_id, match_id, pred_home, pred_away, pred_outcome")
    .in("user_id", leagueIds.length ? leagueIds : ["00000000-0000-0000-0000-000000000000"]);

  return (
    <AppShell title="Fixtures">
      <FixturesView
        matches={(matches ?? []) as Match[]}
        myPredictions={(myPreds ?? []) as Prediction[]}
        allPredictions={allPreds ?? []}
        profiles={profiles ?? []}
        meId={user.id}
      />
    </AppShell>
  );
}
