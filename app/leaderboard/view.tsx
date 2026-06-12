"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Jersey } from "@/components/jersey";

export interface LbRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  mode: "results" | "scores" | null;
  results_total: number;
  scores_total: number;
  correct_results: number;
  exact_scores: number;
}

export function LeaderboardView({ rows, meId }: { rows: LbRow[]; meId: string }) {
  const [tab, setTab] = useState<"results" | "scores">("results");

  const ranked = useMemo(() => {
    return [...rows].sort((a, b) =>
      tab === "results"
        ? b.results_total - a.results_total ||
          b.correct_results - a.correct_results ||
          a.display_name.localeCompare(b.display_name)
        : b.scores_total - a.scores_total ||
          b.exact_scores - a.exact_scores ||
          a.display_name.localeCompare(b.display_name),
    );
  }, [rows, tab]);

  return (
    <div>
      <div className="text-xs text-zinc-500 mb-3 px-1">
        {rows.length} {rows.length === 1 ? "player" : "players"} signed up
      </div>
      <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-zinc-200 rounded-full">
        {(["results", "scores"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full py-2 text-sm font-semibold transition ${
              tab === t ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
            }`}
          >
            {t === "results" ? "Results league" : "Scores league"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1.5rem_2.5rem_1fr_3rem_3rem] gap-3 items-center px-3 mb-1 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
        <span>#</span>
        <span></span>
        <span>Player</span>
        <span className="text-right">{tab === "results" ? "Correct" : "Exact"}</span>
        <span className="text-right">Pts</span>
      </div>
      <div className="space-y-2">
        {ranked.map((r, i) => {
          const me = r.user_id === meId;
          const pts = tab === "results" ? r.results_total : r.scores_total;
          const count = tab === "results" ? r.correct_results : r.exact_scores;
          return (
            <Link
              key={r.user_id}
              href={me ? "/profile" : `/u/${r.user_id}`}
              className={`grid grid-cols-[1.5rem_2.5rem_1fr_3rem_3rem] gap-3 items-center rounded-xl p-3 border transition active:scale-[0.99] ${
                me ? "bg-emerald-50 border-emerald-200" : "bg-white border-zinc-200"
              }`}
            >
              <div className="text-center font-bold text-zinc-500 tabular-nums">{i + 1}</div>
              <Jersey team={r.avatar_url} size={32} />
              <div className="font-medium truncate">{r.display_name}</div>
              <div className="text-right text-sm text-zinc-600 tabular-nums">{count}</div>
              <div className="text-right font-bold tabular-nums">{pts}</div>
            </Link>
          );
        })}
        {ranked.length === 0 && (
          <div className="text-center text-zinc-500 py-8">No players yet.</div>
        )}
      </div>
      <p className="text-[11px] text-zinc-400 mt-4 px-1">
        Movement arrows coming in v1.1 — needs a daily rank snapshot.
      </p>
    </div>
  );
}
