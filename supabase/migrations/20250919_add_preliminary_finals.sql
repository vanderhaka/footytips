-- Add Preliminary Finals matches for 2025 (Finals Week 3)
-- Friday, September 19 at 7:10pm - Geelong Cats vs Hawthorn Hawks at the MCG
-- Saturday, September 20 at 4:45pm - Collingwood Magpies vs Brisbane Lions at the MCG

DO $$
DECLARE
  gee uuid; haw uuid; col uuid; brl uuid;
BEGIN
  -- Get team IDs
  SELECT id INTO gee FROM teams WHERE name = 'Geelong Cats';
  SELECT id INTO haw FROM teams WHERE name = 'Hawthorn Hawks';
  SELECT id INTO col FROM teams WHERE name = 'Collingwood Magpies';
  SELECT id INTO brl FROM teams WHERE name = 'Brisbane Lions';

  -- Check if teams exist
  IF gee IS NULL OR haw IS NULL OR col IS NULL OR brl IS NULL THEN
    RAISE NOTICE 'Some teams not found. Geelong: %, Hawthorn: %, Collingwood: %, Brisbane: %', gee, haw, col, brl;
    RAISE EXCEPTION 'Required teams not found in database';
  END IF;

  -- Delete any existing Round 28 matches first (in case of duplicates)
  DELETE FROM matches WHERE round = 28;

  -- Preliminary Final 1: Geelong Cats vs Hawthorn Hawks
  -- Friday, September 19 at 7:10pm AEST
  INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
  VALUES (28, 'MCG', '2025-09-19 09:10:00+00'::timestamptz, NULL, NULL, NULL, FALSE, gee, haw);

  -- Preliminary Final 2: Collingwood Magpies vs Brisbane Lions
  -- Saturday, September 20 at 4:45pm AEST
  INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
  VALUES (28, 'MCG', '2025-09-20 06:45:00+00'::timestamptz, NULL, NULL, NULL, FALSE, col, brl);

  RAISE NOTICE 'Successfully added Preliminary Finals matches to Round 28';
END $$;

-- Verify the matches were added
SELECT 
  m.round,
  ht.name as home_team,
  at.name as away_team,
  m.venue,
  m.match_date
FROM matches m
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
WHERE m.round = 28
ORDER BY m.match_date;