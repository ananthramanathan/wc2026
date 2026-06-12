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

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_utc", { ascending: true });

  const { data: myPreds } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  // All visible predictions (RLS hides others' picks for un-kicked matches).
  const { data: allPreds } = await supabase
    .from("predictions")
    .select("id, user_id, match_id, pred_home, pred_away, pred_outcome");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url");

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
