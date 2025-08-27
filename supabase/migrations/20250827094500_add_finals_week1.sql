/*
  # Add AFL 2025 Finals Week 1 Fixtures (Round 25)

  - Inserts four Week 1 finals with standardized team names/abbreviations
  - Uses NULL for match_date to indicate time TBC (UI shows "Date TBC")
  - Venues based on current announcements; adjust when AFL confirms
  - Idempotent: skips insert if a matching fixture already exists
*/

DO $$
DECLARE
  adl uuid; gee uuid; brl uuid; col uuid; gws uuid; haw uuid; fre uuid; gc uuid;
BEGIN
  SELECT id INTO adl FROM teams WHERE name = 'Adelaide Crows';
  SELECT id INTO gee FROM teams WHERE name = 'Geelong Cats';
  SELECT id INTO brl FROM teams WHERE name = 'Brisbane Lions';
  SELECT id INTO col FROM teams WHERE name = 'Collingwood Magpies';
  SELECT id INTO gws FROM teams WHERE name = 'Greater Western Sydney Giants';
  SELECT id INTO haw FROM teams WHERE name = 'Hawthorn Hawks';
  SELECT id INTO fre FROM teams WHERE name = 'Fremantle Dockers';
  SELECT id INTO gc  FROM teams WHERE name = 'Gold Coast Suns';

  -- Sanity check: ensure all teams exist
  IF adl IS NULL OR gee IS NULL OR brl IS NULL OR col IS NULL OR gws IS NULL OR haw IS NULL OR fre IS NULL OR gc IS NULL THEN
    RAISE EXCEPTION 'One or more team IDs could not be found. Verify standardized team names exist in teams table.';
  END IF;

  -- Qualifying Final: Adelaide (1) vs Collingwood (4) @ Adelaide Oval
  IF NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE round = 25 AND home_team_id = adl AND away_team_id = col
  ) THEN
    -- Placeholder time: Thu 4 Sep 2025 19:30 ACST -> 2025-09-04 09:30:00Z
    INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
    VALUES (25, 'Adelaide Oval', '2025-09-04 09:30:00+00'::timestamptz, NULL, NULL, NULL, FALSE, adl, col);
  END IF;

  -- Qualifying Final: Geelong (2) vs Brisbane Lions (3) @ Venue TBC
  IF NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE round = 25 AND home_team_id = gee AND away_team_id = brl
  ) THEN
    -- Placeholder time: Fri 5 Sep 2025 19:50 AEST -> 2025-09-05 09:50:00Z
    INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
    VALUES (25, 'TBC', '2025-09-05 09:50:00+00'::timestamptz, NULL, NULL, NULL, FALSE, gee, brl);
  END IF;

  -- Elimination Final: GWS (5) vs Hawthorn (8) @ Engie Stadium
  IF NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE round = 25 AND home_team_id = gws AND away_team_id = haw
  ) THEN
    -- Placeholder time: Sat 6 Sep 2025 19:25 AEST -> 2025-09-06 09:25:00Z
    INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
    VALUES (25, 'Engie Stadium', '2025-09-06 09:25:00+00'::timestamptz, NULL, NULL, NULL, FALSE, gws, haw);
  END IF;

  -- Elimination Final: Fremantle (6) vs Gold Coast (7) @ Optus Stadium
  IF NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE round = 25 AND home_team_id = fre AND away_team_id = gc
  ) THEN
    -- Placeholder time: Sat 6 Sep 2025 18:10 AWST -> 2025-09-06 10:10:00Z
    INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
    VALUES (25, 'Optus Stadium', '2025-09-06 10:10:00+00'::timestamptz, NULL, NULL, NULL, FALSE, fre, gc);
  END IF;
END $$;

-- Optional: quick view to verify inserts
-- SELECT m.id, m.round, m.venue, m.match_date, ht.name as home, at.name as away
-- FROM matches m
-- JOIN teams ht ON ht.id = m.home_team_id
-- JOIN teams at ON at.id = m.away_team_id
-- WHERE m.round = 25
-- ORDER BY m.id;
