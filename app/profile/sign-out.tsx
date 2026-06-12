"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  async function out() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={out}
      className="w-full rounded-full border border-zinc-300 py-3 text-zinc-700 font-medium"
    >
      Sign out
    </button>
  );
}
