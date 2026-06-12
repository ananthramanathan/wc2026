"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { TEAMS } from "@/lib/teams";
import { Jersey } from "@/components/jersey";
import { updateProfile } from "./update-action";

export function ProfileEditor({
  current, teams,
}: {
  current: { display_name: string; avatar_url: string | null; champion_team: string | null };
  teams: string[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(current.display_name);
  const [supporting, setSupporting] = useState<string>(current.avatar_url ?? TEAMS[0].name);
  const [champion, setChampion] = useState<string>(current.champion_team ?? teams[0] ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    setErr(null);
    if (!name.trim()) return setErr("Pick a team name.");
    start(async () => {
      const res = await updateProfile({
        display_name: name.trim(),
        avatar_url: supporting,
        champion_team: champion || null,
      });
      if (res.error) setErr(res.error);
      else {
        router.refresh();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Edit profile"
        className="absolute top-3 right-3 flex items-center gap-1 text-zinc-400 hover:text-zinc-600 transition"
      >
        <Pencil className="size-3.5" strokeWidth={2} />
        <span className="text-[11px] font-medium">Edit</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 rounded-full bg-zinc-200 mx-auto mb-5" />
        <h2 className="text-xl font-bold mb-4 text-center">Edit profile</h2>

        <label className="block text-sm font-semibold mb-2">Team name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base mb-5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <label className="block text-sm font-semibold mb-2">Supporting</label>
        <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto mb-5 pr-1">
          {TEAMS.map((t) => (
            <button
              key={t.name}
              type="button"
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

        <label className="block text-sm font-semibold mb-2">Champion pick</label>
        <select
          value={champion}
          onChange={(e) => setChampion(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base mb-5"
        >
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {err && <p className="text-sm text-red-600 mb-3 text-center">{err}</p>}

        <button
          onClick={save}
          disabled={pending}
          className="w-full rounded-full bg-emerald-600 text-white font-semibold py-4 text-lg disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button onClick={() => setOpen(false)} className="w-full mt-2 text-zinc-500 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
