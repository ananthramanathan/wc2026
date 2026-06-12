import { TEAMS, type Team } from "@/lib/teams";

// Avatars = pick your team. Each team's flag on its color. 48 choices.
export interface Avatar {
  id: string;       // team name (canonical)
  emoji: string;    // flag emoji
  bg: string;       // tailwind bg
  label: string;    // display
}

export const PRESET_AVATARS: Avatar[] = TEAMS.map((t: Team) => ({
  id: t.name,
  emoji: t.flag,
  bg: t.bg,
  label: t.display,
}));

export function getAvatar(id: string | null | undefined): Avatar {
  return PRESET_AVATARS.find((a) => a.id === id) ?? PRESET_AVATARS[0];
}

export type AvatarId = string;
