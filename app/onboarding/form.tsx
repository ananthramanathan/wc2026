"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TEAMS } from "@/lib/teams";
import { Jersey } from "@/components/jersey";
import { saveProfile } from "./action";

export function OnboardingForm({ teams, defaultName }: { teams: string[]; defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [supporting, setSupporting] = useState<string>(TEAMS[0].name);
  const [champion, setChampion] = useState<string>(teams[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Pick a team name.");
    start(async () => {
      const res = await saveProfile({
        display_name: name.trim(),
        avatar_url: supporting,
        champion_team: champion || null,
      });
      if (res.error) setError(res.error);
      else router.push("/");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2">Team name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Goal Diggers"
          maxLength={32}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Who are you supporting?</label>
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
          {TEAMS.map((t) => (
            <button
              type="button"
              key={t.name}
              onClick={() => setSupporting(t.name)}
              className={`flex flex-col items-center rounded-xl py-2 transition ${
                supporting === t.name ? "bg-emerald-50 ring-2 ring-emerald-500" : "bg-white border border-zinc-200"
              }`}
            >
              <Jersey team={t.name} size={36} />
              <div className="text-[10px] text-zinc-600 leading-tight mt-1 px-1 text-center truncate w-full">
                {t.display}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Who wins the World Cup?</label>
        <select
          value={champion}
          onChange={(e) => setChampion(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base"
        >
          {teams.length === 0 && <option value="">Loading teams…</option>}
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-zinc-500">
        Pick a scoreline or just W/D/L on every match — choose as you go.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-emerald-600 text-white font-semibold py-4 text-lg disabled:opacity-50"
      >
        {pending ? "Saving…" : "Start playing"}
      </button>
    </form>
  );
}
