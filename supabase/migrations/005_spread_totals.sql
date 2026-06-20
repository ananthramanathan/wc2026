-- Cache spreads + totals lines alongside the existing h2h odds.
-- Stored at the most-quoted line across bookmakers; prices are averaged at that line.
-- Useful context for the Scores league: implied goals total helps users size predictions.

alter table matches
  add column if not exists total_line numeric(4,2),
  add column if not exists over_price numeric(6,3),
  add column if not exists under_price numeric(6,3),
  add column if not exists spread_line numeric(4,2),
  add column if not exists spread_home_price numeric(6,3),
  add column if not exists spread_away_price numeric(6,3);
