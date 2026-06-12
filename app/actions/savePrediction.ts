"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Outcome } from "@/lib/types";

const schema = z.object({
  match_id: z.number().int().positive(),
  pred_home: z.number().int().min(0).max(20).nullable(),
  pred_away: z.number().int().min(0).max(20).nullable(),
  pred_outcome: z.enum(["H", "D", "A"]),
});

export async function savePrediction(input: {
  match_id: number;
  pred_home: number | null;
  pred_away: number | null;
  pred_outcome: Outcome;
}) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input." };

  // Score mode = both filled. Results mode = both null. Anything else is malformed.
  const bothSet = input.pred_home !== null && input.pred_away !== null;
  const bothNull = input.pred_home === null && input.pred_away === null;
  if (!bothSet && !bothNull) return { error: "Provide both scores or neither." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        match_id: input.match_id,
        pred_home: input.pred_home,
        pred_away: input.pred_away,
        pred_outcome: input.pred_outcome,
      },
      { onConflict: "user_id,match_id" },
    );
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/profile");
  return { ok: true };
}
