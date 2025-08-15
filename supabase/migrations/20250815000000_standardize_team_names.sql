/*
  # Standardize AFL Team Names and Abbreviations

  This migration updates all team names to match official AFL 2025 naming conventions
  and ensures consistency across the entire application.

  Official AFL Teams 2025:
  - Adelaide Crows (ADL)
  - Brisbane Lions (BRL) 
  - Carlton Blues (CAR)
  - Collingwood Magpies (COL)
  - Essendon Bombers (ESS)
  - Fremantle Dockers (FRE)
  - Geelong Cats (GEE)
  - Gold Coast Suns (GC)
  - Greater Western Sydney Giants (GWS)
  - Hawthorn Hawks (HAW)
  - Melbourne Demons (MEL)
  - North Melbourne Kangaroos (NM)
  - Port Adelaide Power (PA)
  - Richmond Tigers (RIC)
  - St Kilda Saints (STK)
  - Sydney Swans (SYD)
  - West Coast Eagles (WC)
  - Western Bulldogs (WB)
*/

-- =============================================
-- 1. Update teams table with standardized names
-- =============================================

-- First, let's see what we have and create a mapping
DO $$
DECLARE
    team_mapping text[][] := ARRAY[
        ['Adelaide', 'Adelaide Crows', 'ADL'],
        ['Brisbane', 'Brisbane Lions', 'BRL'],
        ['Carlton', 'Carlton Blues', 'CAR'],
        ['Collingwood', 'Collingwood Magpies', 'COL'],
        ['Essendon', 'Essendon Bombers', 'ESS'],
        ['Fremantle', 'Fremantle Dockers', 'FRE'],
        ['Geelong', 'Geelong Cats', 'GEE'],
        ['Gold Coast', 'Gold Coast Suns', 'GC'],
        ['GWS Giants', 'Greater Western Sydney Giants', 'GWS'],
        ['Hawthorn', 'Hawthorn Hawks', 'HAW'],
        ['Melbourne', 'Melbourne Demons', 'MEL'],
        ['North Melbourne', 'North Melbourne Kangaroos', 'NM'],
        ['Port Adelaide', 'Port Adelaide Power', 'PA'],
        ['Richmond', 'Richmond Tigers', 'RIC'],
        ['St Kilda', 'St Kilda Saints', 'STK'],
        ['Sydney', 'Sydney Swans', 'SYD'],
        ['West Coast', 'West Coast Eagles', 'WC'],
        ['Western Bulldogs', 'Western Bulldogs', 'WB']
    ];
    mapping_row text[];
BEGIN
    -- Update each team with standardized name and abbreviation
    FOREACH mapping_row SLICE 1 IN ARRAY team_mapping
    LOOP
        UPDATE teams 
        SET 
            name = mapping_row[2],
            abbreviation = mapping_row[3]
        WHERE name = mapping_row[1];
        
        RAISE NOTICE 'Updated team: % -> % (%)', mapping_row[1], mapping_row[2], mapping_row[3];
    END LOOP;
END $$;

-- =============================================
-- 2. Update all existing tips to use standardized abbreviations
-- =============================================

-- Update tips that currently store full team names to use abbreviations
UPDATE tips 
SET team_tipped = 
    CASE team_tipped
        -- Original names to abbreviations
        WHEN 'Adelaide' THEN 'ADL'
        WHEN 'Adelaide Crows' THEN 'ADL'
        WHEN 'Brisbane' THEN 'BRL'
        WHEN 'Brisbane Lions' THEN 'BRL'
        WHEN 'Carlton' THEN 'CAR'
        WHEN 'Carlton Blues' THEN 'CAR'
        WHEN 'Collingwood' THEN 'COL'
        WHEN 'Collingwood Magpies' THEN 'COL'
        WHEN 'Essendon' THEN 'ESS'
        WHEN 'Essendon Bombers' THEN 'ESS'
        WHEN 'Fremantle' THEN 'FRE'
        WHEN 'Fremantle Dockers' THEN 'FRE'
        WHEN 'Geelong' THEN 'GEE'
        WHEN 'Geelong Cats' THEN 'GEE'
        WHEN 'Gold Coast' THEN 'GC'
        WHEN 'Gold Coast Suns' THEN 'GC'
        WHEN 'GWS Giants' THEN 'GWS'
        WHEN 'Greater Western Sydney Giants' THEN 'GWS'
        WHEN 'Hawthorn' THEN 'HAW'
        WHEN 'Hawthorn Hawks' THEN 'HAW'
        WHEN 'Melbourne' THEN 'MEL'
        WHEN 'Melbourne Demons' THEN 'MEL'
        WHEN 'North Melbourne' THEN 'NM'
        WHEN 'North Melbourne Kangaroos' THEN 'NM'
        WHEN 'Port Adelaide' THEN 'PA'
        WHEN 'Port Adelaide Power' THEN 'PA'
        WHEN 'Richmond' THEN 'RIC'
        WHEN 'Richmond Tigers' THEN 'RIC'
        WHEN 'St Kilda' THEN 'STK'
        WHEN 'St Kilda Saints' THEN 'STK'
        WHEN 'Sydney' THEN 'SYD'
        WHEN 'Sydney Swans' THEN 'SYD'
        WHEN 'West Coast' THEN 'WC'
        WHEN 'West Coast Eagles' THEN 'WC'
        WHEN 'Western Bulldogs' THEN 'WB'
        -- Keep existing abbreviations that are already correct
        WHEN 'ADL' THEN 'ADL'
        WHEN 'BRL' THEN 'BRL'
        WHEN 'CAR' THEN 'CAR'
        WHEN 'COL' THEN 'COL'
        WHEN 'ESS' THEN 'ESS'
        WHEN 'FRE' THEN 'FRE'
        WHEN 'GEE' THEN 'GEE'
        WHEN 'GC' THEN 'GC'
        WHEN 'GWS' THEN 'GWS'
        WHEN 'HAW' THEN 'HAW'
        WHEN 'MEL' THEN 'MEL'
        WHEN 'NM' THEN 'NM'
        WHEN 'PA' THEN 'PA'
        WHEN 'RIC' THEN 'RIC'
        WHEN 'STK' THEN 'STK'
        WHEN 'SYD' THEN 'SYD'
        WHEN 'WC' THEN 'WC'
        WHEN 'WB' THEN 'WB'
        -- Handle old abbreviations
        WHEN 'BRI' THEN 'BRL'
        ELSE team_tipped  -- Keep any unknown values as-is
    END;

-- =============================================
-- 3. Update all match winners to use standardized abbreviations
-- =============================================

-- Update match winners to use abbreviations consistently
UPDATE matches 
SET winner = 
    CASE winner
        -- Original names to abbreviations
        WHEN 'Adelaide' THEN 'ADL'
        WHEN 'Adelaide Crows' THEN 'ADL'
        WHEN 'Brisbane' THEN 'BRL'
        WHEN 'Brisbane Lions' THEN 'BRL'
        WHEN 'Carlton' THEN 'CAR'
        WHEN 'Carlton Blues' THEN 'CAR'
        WHEN 'Collingwood' THEN 'COL'
        WHEN 'Collingwood Magpies' THEN 'COL'
        WHEN 'Essendon' THEN 'ESS'
        WHEN 'Essendon Bombers' THEN 'ESS'
        WHEN 'Fremantle' THEN 'FRE'
        WHEN 'Fremantle Dockers' THEN 'FRE'
        WHEN 'Geelong' THEN 'GEE'
        WHEN 'Geelong Cats' THEN 'GEE'
        WHEN 'Gold Coast' THEN 'GC'
        WHEN 'Gold Coast Suns' THEN 'GC'
        WHEN 'GWS Giants' THEN 'GWS'
        WHEN 'Greater Western Sydney Giants' THEN 'GWS'
        WHEN 'Hawthorn' THEN 'HAW'
        WHEN 'Hawthorn Hawks' THEN 'HAW'
        WHEN 'Melbourne' THEN 'MEL'
        WHEN 'Melbourne Demons' THEN 'MEL'
        WHEN 'North Melbourne' THEN 'NM'
        WHEN 'North Melbourne Kangaroos' THEN 'NM'
        WHEN 'Port Adelaide' THEN 'PA'
        WHEN 'Port Adelaide Power' THEN 'PA'
        WHEN 'Richmond' THEN 'RIC'
        WHEN 'Richmond Tigers' THEN 'RIC'
        WHEN 'St Kilda' THEN 'STK'
        WHEN 'St Kilda Saints' THEN 'STK'
        WHEN 'Sydney' THEN 'SYD'
        WHEN 'Sydney Swans' THEN 'SYD'
        WHEN 'West Coast' THEN 'WC'
        WHEN 'West Coast Eagles' THEN 'WC'
        WHEN 'Western Bulldogs' THEN 'WB'
        -- Keep existing abbreviations that are already correct
        WHEN 'ADL' THEN 'ADL'
        WHEN 'BRL' THEN 'BRL'
        WHEN 'CAR' THEN 'CAR'
        WHEN 'COL' THEN 'COL'
        WHEN 'ESS' THEN 'ESS'
        WHEN 'FRE' THEN 'FRE'
        WHEN 'GEE' THEN 'GEE'
        WHEN 'GC' THEN 'GC'
        WHEN 'GWS' THEN 'GWS'
        WHEN 'HAW' THEN 'HAW'
        WHEN 'MEL' THEN 'MEL'
        WHEN 'NM' THEN 'NM'
        WHEN 'PA' THEN 'PA'
        WHEN 'RIC' THEN 'RIC'
        WHEN 'STK' THEN 'STK'
        WHEN 'SYD' THEN 'SYD'
        WHEN 'WC' THEN 'WC'
        WHEN 'WB' THEN 'WB'
        -- Handle old abbreviations
        WHEN 'BRI' THEN 'BRL'
        -- Keep draws and NULL values as-is
        WHEN 'draw' THEN 'draw'
        ELSE winner
    END
WHERE winner IS NOT NULL;

-- =============================================
-- 4. Refresh all tip correctness calculations
-- =============================================

-- Update tips correctness for all completed matches now that we have standardized data
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM matches WHERE is_complete = TRUE LOOP
    PERFORM update_tips_correctness(rec.id::text);
  END LOOP;
  
  RAISE NOTICE 'Refreshed tip correctness for all completed matches';
END $$;

-- =============================================
-- 5. Add constraints to ensure data consistency going forward
-- =============================================

-- Add a check constraint to ensure team_tipped in tips table only uses valid abbreviations
ALTER TABLE tips 
DROP CONSTRAINT IF EXISTS tips_team_tipped_check;

ALTER TABLE tips 
ADD CONSTRAINT tips_team_tipped_check 
CHECK (team_tipped IN (
    'ADL', 'BRL', 'CAR', 'COL', 'ESS', 'FRE', 'GEE', 'GC', 'GWS', 
    'HAW', 'MEL', 'NM', 'PA', 'RIC', 'STK', 'SYD', 'WC', 'WB'
));

-- Add a check constraint to ensure match winners only use valid abbreviations or 'draw'
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_winner_check;

ALTER TABLE matches 
ADD CONSTRAINT matches_winner_check 
CHECK (winner IS NULL OR winner = 'draw' OR winner IN (
    'ADL', 'BRL', 'CAR', 'COL', 'ESS', 'FRE', 'GEE', 'GC', 'GWS', 
    'HAW', 'MEL', 'NM', 'PA', 'RIC', 'STK', 'SYD', 'WC', 'WB'
));

-- Show updated team data
SELECT name, abbreviation FROM teams ORDER BY name;