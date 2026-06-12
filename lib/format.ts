import { format } from "date-fns";
export { flag, displayName } from "@/lib/teams";

export function isoDay(dateIso: string) {
  return format(new Date(dateIso), "yyyy-MM-dd");
}

export function timeLocal(dateIso: string) {
  return format(new Date(dateIso), "HH:mm");
}

export function dayLabel(dateIso: string) {
  return format(new Date(dateIso), "EEE d MMM");
}

export function impliedPct(odds: number | null | undefined): string {
  if (!odds || odds <= 0) return "—";
  return `${Math.round(100 / odds)}%`;
}
