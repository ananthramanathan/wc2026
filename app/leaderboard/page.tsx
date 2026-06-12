import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { LeaderboardView, type LbRow } from "./view";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");

  const { data: rows } = await supabase
    .from("v_leaderboard")
    .select("*")
    .order("results_total", { ascending: false });

  return (
    <AppShell title="Leaderboards">
      <LeaderboardView rows={(rows ?? []) as LbRow[]} meId={user.id} />
    </AppShell>
  );
}
