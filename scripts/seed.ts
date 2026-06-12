// One-shot seed (also safe to re-run): pull WC2026 fixtures from openfootball
// and upsert into matches. Run: npm run seed.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createAdmin } from "../lib/supabase/admin";
import { fetchOpenFootball } from "../lib/openfootball";

async function main() {
  const supa = createAdmin();
  console.log("Fetching openfootball/worldcup.json…");
  const rows = await fetchOpenFootball();
  console.log(`Got ${rows.length} matches.`);

  const { error } = await supa.from("matches").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Upserted ${rows.length} matches.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
