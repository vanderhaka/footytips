-- Round 24 AFL Fixture Updates
-- Based on official AFL website data
-- All times are in AEST/AEDT (to be converted to appropriate timezone)

-- Thursday August 21, 2025
UPDATE matches 
SET match_date = '2025-08-21 19:30:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Essendon' OR abbreviation = 'ESS')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Carlton' OR abbreviation = 'CAR');

-- Friday August 22, 2025
UPDATE matches 
SET match_date = '2025-08-22 19:10:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Collingwood' OR abbreviation = 'COL')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Melbourne' OR abbreviation = 'MEL');

UPDATE matches 
SET match_date = '2025-08-22 20:10:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Port Adelaide' OR abbreviation = 'PORT')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Gold Coast Suns' OR abbreviation = 'GCS');

-- Saturday August 23, 2025
UPDATE matches 
SET match_date = '2025-08-23 13:20:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'North Melbourne' OR abbreviation = 'NM')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Adelaide Crows' OR abbreviation = 'ADE');

UPDATE matches 
SET match_date = '2025-08-23 16:15:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Richmond' OR abbreviation = 'RIC')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Geelong Cats' OR abbreviation = 'GEE');

UPDATE matches 
SET match_date = '2025-08-23 19:35:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'West Coast Eagles' OR abbreviation = 'WCE')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Sydney Swans' OR abbreviation = 'SYD');

-- Sunday August 24, 2025
UPDATE matches 
SET match_date = '2025-08-24 12:20:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'GWS Giants' OR abbreviation = 'GWS')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'St Kilda' OR abbreviation = 'STK');

UPDATE matches 
SET match_date = '2025-08-24 15:15:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Western Bulldogs' OR abbreviation = 'WB')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Fremantle' OR abbreviation = 'FRE');

UPDATE matches 
SET match_date = '2025-08-24 19:20:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Brisbane Lions' OR abbreviation = 'BL')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Hawthorn' OR abbreviation = 'HAW');

-- Wednesday August 27, 2025 (Rescheduled Match)
UPDATE matches 
SET match_date = '2025-08-27 19:20:00'::timestamp with time zone
WHERE round = 24 
  AND home_team_id = (SELECT id FROM teams WHERE name = 'Gold Coast Suns' OR abbreviation = 'GCS')
  AND away_team_id = (SELECT id FROM teams WHERE name = 'Essendon' OR abbreviation = 'ESS');

-- Verify the updates
SELECT 
  m.id,
  m.round,
  m.match_date,
  home.name as home_team,
  away.name as away_team
FROM matches m
JOIN teams home ON m.home_team_id = home.id
JOIN teams away ON m.away_team_id = away.id
WHERE m.round = 24
ORDER BY m.match_date;