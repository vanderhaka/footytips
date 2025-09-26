-- Just add the Semi-Finals matches to Round 27
-- This assumes tables already exist

DO $$
DECLARE
  adl uuid; haw uuid; brl uuid; gc uuid;
BEGIN
  -- Get team IDs
  SELECT id INTO adl FROM teams WHERE name = 'Adelaide Crows';
  SELECT id INTO haw FROM teams WHERE name = 'Hawthorn Hawks';
  SELECT id INTO brl FROM teams WHERE name = 'Brisbane Lions';
  SELECT id INTO gc FROM teams WHERE name = 'Gold Coast Suns';

  -- Check if teams exist
  IF adl IS NULL OR haw IS NULL OR brl IS NULL OR gc IS NULL THEN
    RAISE NOTICE 'Some teams not found. Adelaide: %, Hawthorn: %, Brisbane: %, Gold Coast: %', adl, haw, brl, gc;
    RAISE EXCEPTION 'Required teams not found in database';
  END IF;

  -- Delete any existing Round 27 matches first (in case of duplicates)
  DELETE FROM matches WHERE round = 27;

  -- Semi-Final 1: Adelaide Crows vs Hawthorn Hawks
  -- Friday, September 12 at 7:10pm AEST
  INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
  VALUES (27, 'Adelaide Oval', '2025-09-12 09:10:00+00'::timestamptz, NULL, NULL, NULL, FALSE, adl, haw);

  -- Semi-Final 2: Brisbane Lions vs Gold Coast Suns
  -- Saturday, September 13 at 7:05pm AEST  
  INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
  VALUES (27, 'Gabba', '2025-09-13 09:05:00+00'::timestamptz, NULL, NULL, NULL, FALSE, brl, gc);

  RAISE NOTICE 'Successfully added Semi-Finals matches to Round 27';
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
WHERE m.round = 27
ORDER BY m.match_date;