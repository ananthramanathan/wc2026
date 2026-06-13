-- Timestamp the live-scores cron writes whenever it updates a match's score.
-- The card derives the displayed minute from (score_updated_at - kickoff_utc),
-- so the minute label never advances ahead of the score it's paired with.
alter table matches
  add column if not exists score_updated_at timestamptz;
