"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
  meId: string;
}

export function MatchCard({ match, myPrediction, othersPicks = [], profileById, recordByTeam, meId }: Props) {
  const [open, setOpen] = useState(false);
  const kicked = new Date(match.kickoff_utc) <= new Date();
  const finished = match.status === "finished";
  const tbd = !match.home_team || !match.away_team;
  const locked = kicked || tbd;
  const [picksOpen, setPicksOpen] = useState(!finished);

  function pickLabel(p: { pred_home: number | null; pred_away: number | null; pred_outcome: string }) {
    if (p.pred_home !== null && p.pred_away !== null) return `${p.pred_home}-${p.pred_away}`;
    return p.pred_outcome === "H" ? abbrev(match.home_team) : p.pred_outcome === "A" ? abbrev(match.away_team) : "Draw";
  }

  const zero: TeamRecord = { w: 0, d: 0, l: 0 };
  const isGroup = match.stage === "group";
  const homeRec = match.home_team && isGroup ? (recordByTeam?.get(match.home_team) ?? zero) : null;
  const awayRec = match.away_team && isGroup ? (recordByTeam?.get(match.away_team) ?? zero) : null;

  // All picks list (me first, then others) — only shown after kickoff.
  const allPicks: OtherPick[] = [];
  if (myPrediction) {
    allPicks.push({
      user_id: meId,
      match_id: match.id,
      pred_home: myPrediction.pred_home,
      pred_away: myPrediction.pred_away,
      pred_outcome: myPrediction.pred_outcome,
    });
  }
  othersPicks.forEach((p) => allPicks.push(p));

  function actualOutcome(): "H" | "D" | "A" | null {
    if (!finished || match.home_score == null || match.away_score == null) return null;
    return match.home_score > match.away_score ? "H" : match.home_score < match.away_score ? "A" : "D";
  }
  const winner = actualOutcome();

  const shellTone = finished
    ? "bg-zinc-100 border-zinc-200"
    : kicked
      ? "bg-emerald-50/50 border-emerald-200"
      : "bg-white border-zinc-200";

  return (
    <>
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${shellTone}`}>
      <button
        onClick={() => !locked && setOpen(true)}
        disabled={locked}
        className={`w-full text-left p-4 transition ${
          !locked ? "active:scale-[0.99]" : ""
        }`}
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

        {!kicked && !myPrediction && !tbd && (
          <div className="mt-3 pt-3 border-t border-zinc-100 text-sm text-emerald-600 font-semibold">
            Tap to predict →
          </div>
        )}
        {!kicked && tbd && (
          <div className="mt-3 pt-3 border-t border-zinc-100 text-sm text-zinc-400">
            Teams TBD
          </div>
        )}
      </button>

      {kicked && allPicks.length > 0 && (
        <div className="border-t border-zinc-200/70 px-4 py-2.5">
          <button
            onClick={() => setPicksOpen((v) => !v)}
            className="w-full flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500 font-semibold"
          >
            <span>
              {allPicks.length} {allPicks.length === 1 ? "pick" : "picks"}
            </span>
            <ChevronDown
              className={`size-4 transition-transform ${picksOpen ? "rotate-180" : ""}`}
              strokeWidth={2.5}
            />
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${
              picksOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-2 pt-2.5">
              {allPicks.map((p) => {
                const pr = profileById?.get(p.user_id);
                const isMe = p.user_id === meId;
                const correct =
                  finished &&
                  ((p.pred_home !== null && p.pred_home === match.home_score && p.pred_away === match.away_score) ||
                    (winner !== null && p.pred_outcome === winner));
                return (
                  <Link
                    key={p.user_id}
                    href={isMe ? "/profile" : `/u/${p.user_id}`}
                    className={`flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 text-xs transition active:scale-[0.98] ${
                      correct
                        ? "bg-emerald-100 text-emerald-800"
                        : isMe
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-white border border-zinc-200"
                    }`}
                  >
                    <Jersey team={pr?.avatar_url} size={20} showFlag={false} />
                    <span className="font-medium truncate max-w-[6rem]">
                      {isMe ? "You" : (pr?.display_name ?? "?")}
                    </span>
                    <span className="font-bold">{pickLabel(p)}</span>
                  </Link>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

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
