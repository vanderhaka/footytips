/*
  # Reassign Finals to Round 26 and Set Round 25 Solo Match

  - Finals Week 1 fixtures should be in round 26
  - Round 25 should contain only Gold Coast Suns vs Essendon Bombers
  - Sets precise times based on provided local times and venues
*/

DO $$
DECLARE
  adl uuid; col uuid; gee uuid; brl uuid; gws uuid; haw uuid; fre uuid; gc uuid; ess uuid;
BEGIN
  SELECT id INTO adl FROM teams WHERE name = 'Adelaide Crows';
  SELECT id INTO col FROM teams WHERE name = 'Collingwood Magpies';
  SELECT id INTO gee FROM teams WHERE name = 'Geelong Cats';
  SELECT id INTO brl FROM teams WHERE name = 'Brisbane Lions';
  SELECT id INTO gws FROM teams WHERE name = 'Greater Western Sydney Giants';
  SELECT id INTO haw FROM teams WHERE name = 'Hawthorn Hawks';
  SELECT id INTO fre FROM teams WHERE name = 'Fremantle Dockers';
  SELECT id INTO gc  FROM teams WHERE name = 'Gold Coast Suns';
  SELECT id INTO ess FROM teams WHERE name = 'Essendon Bombers';

  IF adl IS NULL OR col IS NULL OR gee IS NULL OR brl IS NULL OR gws IS NULL OR haw IS NULL OR fre IS NULL OR gc IS NULL OR ess IS NULL THEN
    RAISE EXCEPTION 'One or more team IDs not found. Ensure teams are standardized.';
  END IF;

  -- Move Week 1 finals to Round 26 and set confirmed times
  -- Adelaide Crows vs Collingwood Magpies — Thu 4 Sep 2025 7:00 pm ACST -> 2025-09-04 09:30:00Z
  UPDATE matches 
  SET round = 26,
      venue = 'Adelaide Oval',
      match_date = '2025-09-04 09:30:00+00'::timestamptz
  WHERE home_team_id = adl AND away_team_id = col
    AND (match_date >= '2025-08-25' OR match_date IS NULL);

  -- Geelong Cats vs Brisbane Lions — Fri 5 Sep 2025 7:20 pm AEST -> 2025-09-05 09:20:00Z (venue TBC)
  UPDATE matches 
  SET round = 26,
      venue = COALESCE(NULLIF(venue, ''), 'TBC'),
      match_date = '2025-09-05 09:20:00+00'::timestamptz
  WHERE home_team_id = gee AND away_team_id = brl
    AND (match_date >= '2025-08-25' OR match_date IS NULL);

  -- GWS Giants vs Hawthorn Hawks — Sat 6 Sep 2025 6:55 pm AEST -> 2025-09-06 08:55:00Z
  UPDATE matches 
  SET round = 26,
      venue = 'Engie Stadium',
      match_date = '2025-09-06 08:55:00+00'::timestamptz
  WHERE home_team_id = gws AND away_team_id = haw
    AND (match_date >= '2025-08-25' OR match_date IS NULL);

  -- Fremantle Dockers vs Gold Coast Suns — Sat 6 Sep 2025 7:40 pm AWST -> 2025-09-06 11:40:00Z
  UPDATE matches 
  SET round = 26,
      venue = 'Optus Stadium',
      match_date = '2025-09-06 11:40:00+00'::timestamptz
  WHERE home_team_id = fre AND away_team_id = gc
    AND (match_date >= '2025-08-25' OR match_date IS NULL);

  -- Ensure Round 25 contains only: Gold Coast Suns vs Essendon Bombers
  -- Thu 28 Aug 2025 4:50 am AEST -> 2025-08-27 18:50:00Z at Carrara Stadium
  IF EXISTS (
    SELECT 1 FROM matches WHERE home_team_id = gc AND away_team_id = ess
      AND (match_date >= '2025-08-20' OR match_date IS NULL)
  ) THEN
    UPDATE matches
    SET round = 25,
        venue = 'Carrara Stadium',
        match_date = '2025-08-27 18:50:00+00'::timestamptz
    WHERE home_team_id = gc AND away_team_id = ess
      AND (match_date >= '2025-08-20' OR match_date IS NULL);
  ELSE
    INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
    VALUES (25, 'Carrara Stadium', '2025-08-27 18:50:00+00'::timestamptz, NULL, NULL, NULL, FALSE, gc, ess);
  END IF;
END $$;

