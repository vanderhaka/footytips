-- Add Grand Final match for 2025 (Round 29)
-- Saturday, September 27 at 2:30pm AEST - Geelong Cats vs Brisbane Lions at the MCG

DO $$
DECLARE
  gee uuid; brl uuid;
BEGIN
  -- Get team IDs
  SELECT id INTO gee FROM teams WHERE name = 'Geelong Cats';
  SELECT id INTO brl FROM teams WHERE name = 'Brisbane Lions';

  -- Check if teams exist
  IF gee IS NULL OR brl IS NULL THEN
    RAISE NOTICE 'Some teams not found. Geelong: %, Brisbane: %', gee, brl;
    RAISE EXCEPTION 'Required teams not found in database';
  END IF;

  -- Delete any existing Round 29 matches first (in case of duplicates)
  DELETE FROM matches WHERE round = 29;

  -- Grand Final: Geelong Cats vs Brisbane Lions
  -- Saturday, September 27 at 2:30pm AEST (4:30am UTC)
  INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
  VALUES (29, 'MCG', '2025-09-27 04:30:00+00'::timestamptz, NULL, NULL, NULL, FALSE, gee, brl);

  RAISE NOTICE 'Successfully added Grand Final match to Round 29';
END $$;

-- Verify the match was added
SELECT 
  m.round,
  ht.name as home_team,
  at.name as away_team,
  m.venue,
  m.match_date
FROM matches m
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
WHERE m.round = 29
ORDER BY m.match_date;
