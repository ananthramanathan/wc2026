"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

interface Input {
  display_name: string;
  avatar_url: string;
  champion_team: string | null;
}

const LEAGUE = /^[a-z0-9-]{2,32}$/;

export async function saveProfile(input: Input) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const jar = await cookies();
  const raw = jar.get("wc_league")?.value;
  const league = raw && LEAGUE.test(raw) ? raw : "main";

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    display_name: input.display_name,
    avatar_url: input.avatar_url,
    champion_team: input.champion_team,
    mode: "scores",
    league,
  });
  if (error) return { error: error.message };

  // Multi-league source of truth. profiles.league stays as the user's primary
  // (used by home/profile pages); profile_leagues drives leaderboard scoring.
  await supabase.from("profile_leagues").insert({
    user_id: user.id,
    league,
    // joined_at omitted → DB default now()
  });

  jar.delete("wc_league");
  return { ok: true };
}
