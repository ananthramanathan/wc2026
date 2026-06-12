"use client";

import { useState } from "react";
import { timeLocal, flag, displayName, impliedPct } from "@/lib/format";
import { abbrev } from "@/lib/teams";
import { Jersey } from "@/components/jersey";
import type { Match, Prediction } from "@/lib/types";
import { PredictSheet } from "./predict-sheet";

interface OtherPick {
  user_id: string;
  match_id: number;
  pred_home: number | null;
  pred_away: number | null;
  pred_outcome: "H" | "D" | "A";
}
interface MiniProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}
export interface TeamRecord { w: number; d: number; l: number }

interface Props {
  match: Match;
  myPrediction: Prediction | null;
  othersPicks?: OtherPick[];
  profileById?: Map<string, MiniProfile>;
  recordByTeam?: Map<string, TeamRecord>;
}

export function MatchCard({ match, myPrediction, othersPicks = [], profileById, recordByTeam }: Props) {
  const [open, setOpen] = useState(false);
  const kicked = new Date(match.kickoff_utc) <= new Date();
  const finished = match.status === "finished";
  const tbd = !match.home_team || !match.away_team;
  const locked = kicked || tbd;

  function pickLabel(p: { pred_home: number | null; pred_away: number | null; pred_outcome: string }) {
    if (p.pred_home !== null && p.pred_away !== null) return `${p.pred_home}-${p.pred_away}`;
    return p.pred_outcome === "H" ? "Home" : p.pred_outcome === "A" ? "Away" : "Draw";
  }

  const homeRec = match.home_team ? recordByTeam?.get(match.home_team) : null;
  const awayRec = match.away_team ? recordByTeam?.get(match.away_team) : null;

  return (
    <>
      <button
        onClick={() => !locked && setOpen(true)}
        disabled={locked}
        className={`w-full text-left rounded-2xl border p-4 shadow-sm transition ${
          finished ? "bg-zinc-100 border-zinc-200" : kicked ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-zinc-200 active:scale-[0.99]"
        } disabled:active:scale-100`}
      >
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>
            {match.stage === "group" && match.group_label
              ? `Group ${match.group_label}`
              : match.stage.toUpperCase()}
          </span>
          <span className={kicked && !finished ? "text-emerald-600 font-semibold" : ""}>
            {finished ? "FT" : kicked ? "LIVE" : timeLocal(match.kickoff_utc)}
          </span>
        </div>

        <div className="space-y-1.5">
          <Row
            team={match.home_team}
            score={finished ? match.home_score : null}
            record={homeRec}
            highlight={finished && match.home_score! > match.away_score!}
          />
          <Row
            team={match.away_team}
            score={finished ? match.away_score : null}
            record={awayRec}
            highlight={finished && match.away_score! > match.home_score!}
          />
        </div>

        {!kicked && (match.home_odds || match.draw_odds || match.away_odds) && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <OddsPill code={abbrev(match.home_team)} odds={match.home_odds} />
            <OddsPill code="DRAW" odds={match.draw_odds} />
            <OddsPill code={abbrev(match.away_team)} odds={match.away_odds} />
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-sm">
          {myPrediction ? (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Your pick:</span>
              <span className="font-semibold">{pickLabel(myPrediction)}</span>
            </div>
          ) : tbd ? (
            <span className="text-zinc-400">Teams TBD</span>
          ) : !kicked ? (
            <span className="text-emerald-600 font-semibold">Tap to predict →</span>
          ) : (
            <span className="text-zinc-400">No pick made</span>
          )}
          {kicked && !finished && (
            <span className="text-xs text-emerald-600 font-semibold">🔒 locked</span>
          )}
        </div>
      </button>

      {kicked && othersPicks.length > 0 && (
        <div className="px-3 pt-2 pb-1">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
            Friends&apos; picks
          </div>
          <div className="flex flex-wrap gap-2">
            {othersPicks.map((p) => {
              const pr = profileById?.get(p.user_id);
              const correct =
                finished &&
                ((p.pred_home !== null && p.pred_home === match.home_score && p.pred_away === match.away_score) ||
                  p.pred_outcome === (match.home_score! > match.away_score! ? "H" : match.home_score! < match.away_score! ? "A" : "D"));
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 text-xs ${
                    correct ? "bg-emerald-100 text-emerald-800" : "bg-white border border-zinc-200"
                  }`}
                >
                  <Jersey team={pr?.avatar_url} size={20} showFlag={false} />
                  <span className="font-medium truncate max-w-[6rem]">{pr?.display_name ?? "?"}</span>
                  <span className="font-bold">{pickLabel(p)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {open && (
        <PredictSheet
          match={match}
          existing={myPrediction}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function OddsPill({ code, odds }: { code: string; odds: number | null }) {
  return (
    <div className="rounded-lg bg-zinc-100 px-2 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold leading-none">{code}</div>
      <div className="text-sm font-bold tabular-nums text-zinc-800 leading-tight mt-0.5">
        {odds ? impliedPct(odds) : "—"}
      </div>
    </div>
  );
}

function Row({
  team, score, record, highlight,
}: { team: string | null; score: number | null; record: TeamRecord | null | undefined; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${highlight ? "font-bold" : "font-medium"}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xl shrink-0">{flag(team)}</span>
        <span className="truncate">{displayName(team)}</span>
        {record && (
          <span className="text-[11px] text-zinc-400 tabular-nums shrink-0">
            {record.w}-{record.d}-{record.l}
          </span>
        )}
      </div>
      {score !== null && <span className="text-lg tabular-nums">{score}</span>}
    </div>
  );
}
