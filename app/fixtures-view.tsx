"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { MatchCard, type TeamRecord } from "@/components/match-card";
import { isoDay, dayLabel } from "@/lib/format";
import type { Match, Prediction } from "@/lib/types";

function buildRecords(matches: Match[]): Map<string, TeamRecord> {
  const map = new Map<string, TeamRecord>();
  const ensure = (t: string) => {
    if (!map.has(t)) map.set(t, { w: 0, d: 0, l: 0 });
    return map.get(t)!;
  };
  for (const m of matches) {
    if (m.stage !== "group") continue;
    if (m.status !== "finished" || m.home_score == null || m.away_score == null) continue;
    if (!m.home_team || !m.away_team) continue;
    const h = ensure(m.home_team);
    const a = ensure(m.away_team);
    if (m.home_score > m.away_score) { h.w++; a.l++; }
    else if (m.home_score < m.away_score) { a.w++; h.l++; }
    else { h.d++; a.d++; }
  }
  return map;
}

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

export function FixturesView({
  matches, myPredictions, allPredictions, profiles, meId,
}: {
  matches: Match[];
  myPredictions: Prediction[];
  allPredictions: OtherPick[];
  profiles: MiniProfile[];
  meId: string;
}) {
  const days = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => set.add(isoDay(m.kickoff_utc)));
    return Array.from(set).sort();
  }, [matches]);

  const todayKey = isoDay(new Date().toISOString());
  const initialDay = days.find((d) => d >= todayKey) ?? days[0];
  const [activeDay, setActiveDay] = useState<string | undefined>(initialDay);

  const tabScrollerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Keep active pill centered in the horizontal scroller.
  useEffect(() => {
    if (!activeDay || !tabScrollerRef.current) return;
    const el = tabScrollerRef.current.querySelector<HTMLButtonElement>(`[data-day="${activeDay}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeDay]);

  // IntersectionObserver: whichever day section is most-visible becomes active.
  useEffect(() => {
    const els = Array.from(dayRefs.current.values());
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const day = (visible[0].target as HTMLElement).dataset.daySection;
          if (day) setActiveDay(day);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [matches]);

  // Jump-to-day when a date pill is tapped.
  function jumpTo(day: string) {
    setActiveDay(day);
    const target = dayRefs.current.get(day);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  // Initial scroll: bring "today" section into view if available.
  useEffect(() => {
    if (!initialDay) return;
    const target = dayRefs.current.get(initialDay);
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top, behavior: "auto" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordByTeam = useMemo(() => buildRecords(matches), [matches]);
  const myByMatch = new Map(myPredictions.map((p) => [p.match_id, p]));
  const allByMatch = new Map<number, OtherPick[]>();
  allPredictions.forEach((p) => {
    const arr = allByMatch.get(p.match_id) ?? [];
    arr.push(p);
    allByMatch.set(p.match_id, arr);
  });
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const byDay = new Map<string, Match[]>();
  matches.forEach((m) => {
    const k = isoDay(m.kickoff_utc);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(m);
  });

  return (
    <div>
      <div
        ref={tabScrollerRef}
        className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-10 -mx-5 px-5 py-2 mb-3 flex gap-2 overflow-x-auto bg-zinc-50/95 backdrop-blur scrollbar-hide"
      >
        {days.map((d) => {
          const active = d === activeDay;
          return (
            <button
              key={d}
              data-day={d}
              onClick={() => jumpTo(d)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-700"
              }`}
            >
              {dayLabel(d + "T12:00:00Z")}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {Array.from(byDay.entries()).map(([day, ms]) => (
          <section
            key={day}
            data-day-section={day}
            ref={(el) => {
              if (el) dayRefs.current.set(day, el);
              else dayRefs.current.delete(day);
            }}
          >
            <h2 className="text-sm font-semibold text-zinc-500 mb-2 px-1">
              {dayLabel(day + "T12:00:00Z")}
            </h2>
            <div className="space-y-3">
              {ms.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  myPrediction={myByMatch.get(m.id) ?? null}
                  othersPicks={(allByMatch.get(m.id) ?? []).filter((p) => p.user_id !== meId)}
                  profileById={profileById}
                  recordByTeam={recordByTeam}
                  meId={meId}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
