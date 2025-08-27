/*
  # Fix Finals Week 1 labeling and set confirmed local times

  - Ensure finals fixtures use round 25 (Finals Week 1)
  - Set match_date using UTC based on provided local times
  - Constrain updates to late-Aug onward to avoid touching earlier H&A fixtures
*/

DO $$
DECLARE
  adl uuid; col uuid; gee uuid; brl uuid; gws uuid; haw uuid; fre uuid; gc uuid;
BEGIN
  SELECT id INTO adl FROM teams WHERE name = 'Adelaide Crows';
  SELECT id INTO col FROM teams WHERE name = 'Collingwood Magpies';
  SELECT id INTO gee FROM teams WHERE name = 'Geelong Cats';
  SELECT id INTO brl FROM teams WHERE name = 'Brisbane Lions';
  SELECT id INTO gws FROM teams WHERE name = 'Greater Western Sydney Giants';
  SELECT id INTO haw FROM teams WHERE name = 'Hawthorn Hawks';
  SELECT id INTO fre FROM teams WHERE name = 'Fremantle Dockers';
  SELECT id INTO gc  FROM teams WHERE name = 'Gold Coast Suns';

  -- Adelaide Crows vs Collingwood Magpies — Thu 4 Sep 2025 7:00 pm ACST -> 2025-09-04 09:30:00Z
  UPDATE matches 
  SET round = 25,
      venue = 'Adelaide Oval',
      match_date = '2025-09-04 09:30:00+00'::timestamptz
  WHERE home_team_id = adl AND away_team_id = col
    AND (match_date >= '2025-08-25' OR match_date IS NULL);

  -- Geelong Cats vs Brisbane Lions — Fri 5 Sep 2025 7:20 pm AEST -> 2025-09-05 09:20:00Z (venue TBC)
  UPDATE matches 
  SET round = 25,
      venue = COALESCE(NULLIF(venue, ''), 'TBC'),
      match_date = '2025-09-05 09:20:00+00'::timestamptz
  WHERE home_team_id = gee AND away_team_id = brl
    AND (match_date >= '2025-08-25' OR match_date IS NULL);

  -- GWS Giants vs Hawthorn Hawks — Sat 6 Sep 2025 6:55 pm AEST -> 2025-09-06 08:55:00Z
  UPDATE matches 
  SET round = 25,
      venue = 'Engie Stadium',
      match_date = '2025-09-06 08:55:00+00'::timestamptz
  WHERE home_team_id = gws AND away_team_id = haw
    AND (match_date >= '2025-08-25' OR match_date IS NULL);

  -- Fremantle Dockers vs Gold Coast Suns — Sat 6 Sep 2025 7:40 pm AWST -> 2025-09-06 11:40:00Z
  UPDATE matches 
  SET round = 25,
      venue = 'Optus Stadium',
      match_date = '2025-09-06 11:40:00+00'::timestamptz
  WHERE home_team_id = fre AND away_team_id = gc
    AND (match_date >= '2025-08-25' OR match_date IS NULL);
END $$;

