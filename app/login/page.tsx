"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signIn() {
    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
  }

  return (
    <main className="min-h-screen relative flex flex-col text-white max-w-md mx-auto">
      <Image
        src="/wc2026-splash-tiny.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 480px) 100vw, 480px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="relative flex-1 flex flex-col justify-end items-center p-8 pb-[max(env(safe-area-inset-bottom),2rem)]">
        <h1 className="text-4xl font-black tracking-tight mb-6 drop-shadow-lg text-center">
          WC 2026 Predictor
        </h1>
        <button
          onClick={signIn}
          className="w-full rounded-full bg-white text-zinc-900 font-semibold py-4 text-lg shadow-xl active:scale-[0.98] transition"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
