"use server";

import { createClient } from "@/lib/supabase/server";

interface Input {
  display_name: string;
  avatar_url: string;
  champion_team: string | null;
}

export async function saveProfile(input: Input) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    display_name: input.display_name,
    avatar_url: input.avatar_url,
    champion_team: input.champion_team,
    mode: null,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
