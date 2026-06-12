"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { flag, displayName } from "@/lib/format";
import { savePrediction } from "@/app/actions/savePrediction";
import type { Match, Outcome, Prediction } from "@/lib/types";

interface Props {
  match: Match;
  existing: Prediction | null;
  onClose: () => void;
}

export function PredictSheet({ match, existing, onClose }: Props) {
  const [home, setHome] = useState<number | null>(existing?.pred_home ?? null);
  const [away, setAway] = useState<number | null>(existing?.pred_away ?? null);
  const [outcome, setOutcome] = useState<Outcome | null>(existing?.pred_outcome ?? null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  // If both scores set, outcome is derived (and overrides). Otherwise use buttons.
  const bothSet = home !== null && away !== null;
  const effectiveOutcome: Outcome | null = bothSet
    ? home! > away!
      ? "H"
      : home! < away!
        ? "A"
        : "D"
    : outcome;

  function submit() {
    setErr(null);
    if (home === null && away !== null) return setErr("Set both scores, or leave both empty.");
    if (away === null && home !== null) return setErr("Set both scores, or leave both empty.");
    if (effectiveOutcome === null) return setErr("Pick a winner — or enter a scoreline.");
    start(async () => {
      const res = await savePrediction({
        match_id: match.id,
        pred_home: bothSet ? home : null,
        pred_away: bothSet ? away : null,
        pred_outcome: effectiveOutcome!,
      });
      if (res.error) setErr(res.error);
      else {
        router.refresh();
        onClose();
      }
    });
  }

  const homeName = displayName(match.home_team);
  const awayName = displayName(match.away_team);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl"
      >
        <div className="w-12 h-1.5 rounded-full bg-zinc-200 mx-auto mb-5" />
        <div className="text-center mb-6">
          <div className="text-xl font-bold tracking-tight">
            {flag(match.home_team)} {homeName} <span className="text-zinc-400 font-medium">vs</span> {flag(match.away_team)} {awayName}
          </div>
        </div>

        <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold text-center mb-2">
          Predict the result · 1 pt
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {([
            { key: "H" as const, label: homeName },
            { key: "D" as const, label: "Draw" },
            { key: "A" as const, label: awayName },
          ]).map(({ key, label }) => {
            const active = effectiveOutcome === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (bothSet) return; // outcome is derived from scores
                  setOutcome(key);
                }}
                disabled={bothSet}
                className={`rounded-xl py-3 px-2 font-semibold text-sm truncate transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 text-zinc-700"
                } ${bothSet ? "opacity-70" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold text-center mb-2">
          Predict the scoreline · goal diff 0.5 pts or result 1.5 pts
        </div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <Stepper label={homeName} value={home} onChange={setHome} />
          <div className="text-2xl text-zinc-300 mt-6">–</div>
          <Stepper label={awayName} value={away} onChange={setAway} />
        </div>

        {err && <p className="text-sm text-red-600 mb-3 text-center">{err}</p>}

        <button
          onClick={submit}
          disabled={pending}
          className="w-full rounded-full bg-emerald-600 text-white font-semibold py-4 text-lg disabled:opacity-50"
        >
          {pending ? "Saving…" : existing ? "Update pick" : "Save pick"}
        </button>
        <button onClick={onClose} className="w-full mt-2 text-zinc-500 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Stepper({
  value, onChange, label,
}: { label: string; value: number | null; onChange: (n: number | null) => void }) {
  function dec() {
    if (value === null) return;
    if (value === 0) return onChange(null);
    onChange(value - 1);
  }
  function inc() {
    if (value === null) return onChange(0);
    onChange(Math.min(20, value + 1));
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-zinc-500 max-w-[6rem] text-center truncate">{label}</div>
      <div className="flex items-center gap-2">
        <button onClick={dec} className="size-9 rounded-full bg-zinc-100 text-xl font-bold">−</button>
        <div className="text-3xl font-bold tabular-nums w-9 text-center">
          {value === null ? "–" : value}
        </div>
        <button onClick={inc} className="size-9 rounded-full bg-zinc-100 text-xl font-bold">+</button>
      </div>
    </div>
  );
}
