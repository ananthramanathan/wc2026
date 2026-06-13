export type Mode = "results" | "scores";
export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "final";
export type MatchStatus = "scheduled" | "live" | "finished" | "tbd";
export type Outcome = "H" | "D" | "A";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  mode: Mode | null;
  champion_team: string | null;
  created_at: string;
}

export interface Match {
  id: number;
  stage: Stage;
  group_label: string | null;
  home_team: string | null;
  away_team: string | null;
  kickoff_utc: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  home_odds: number | null;
  draw_odds: number | null;
  away_odds: number | null;
  odds_updated_at: string | null;
  score_updated_at: string | null;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: number;
  pred_home: number | null;
  pred_away: number | null;
  pred_outcome: Outcome;
  locked: boolean;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile> };
      matches: { Row: Match; Insert: Partial<Match> & { id: number; kickoff_utc: string; stage: Stage }; Update: Partial<Match> };
      predictions: {
        Row: Prediction;
        Insert: Omit<Prediction, "id" | "updated_at" | "locked"> & { locked?: boolean };
        Update: Partial<Prediction>;
      };
    };
    Views: Record<string, never>;
  };
}
