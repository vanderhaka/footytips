/*
  # Update matches table to use team references

  1. Changes
    - Add UUID columns for team references
    - Map existing team names to team IDs
    - Add foreign key constraints
    - Remove old text columns
  
  2. Data Preservation
    - Ensures all team names are properly matched
    - Handles case sensitivity and whitespace
    - Provides detailed error messages for mismatches
*/

-- First drop any existing foreign key constraints if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'matches_home_team_id_fkey') THEN
    ALTER TABLE matches DROP CONSTRAINT matches_home_team_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'matches_away_team_id_fkey') THEN
    ALTER TABLE matches DROP CONSTRAINT matches_away_team_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'matches_home_team_fkey') THEN
    ALTER TABLE matches DROP CONSTRAINT matches_home_team_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'matches_away_team_fkey') THEN
    ALTER TABLE matches DROP CONSTRAINT matches_away_team_fkey;
  END IF;
END $$;

-- Add team ID columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'home_team_id') THEN
    ALTER TABLE matches ADD COLUMN home_team_id uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'away_team_id') THEN
    ALTER TABLE matches ADD COLUMN away_team_id uuid;
  END IF;
END $$;

-- Create a mapping table with normalized team names
CREATE TEMP TABLE team_name_mappings (
  original_name text,
  normalized_name text,
  team_id uuid
);

-- Insert normalized versions of team names
INSERT INTO team_name_mappings (original_name, normalized_name, team_id)
SELECT 
  name,
  REGEXP_REPLACE(LOWER(TRIM(name)), '\s+', ' ', 'g'),
  id
FROM teams;

-- Get the GWS Giants team ID for reference
DO $$
DECLARE
  gws_id uuid;
BEGIN
  SELECT id INTO gws_id FROM teams WHERE name = 'GWS Giants';
  
  -- Insert additional common variations including exact matches
  INSERT INTO team_name_mappings (original_name, normalized_name, team_id) VALUES
    ('GWS', 'gws', gws_id),
    ('Giants', 'giants', gws_id),
    ('GWS Giants', 'gws giants', gws_id),
    ('Crows', 'crows', (SELECT id FROM teams WHERE name = 'Adelaide')),
    ('Adelaide Crows', 'adelaide crows', (SELECT id FROM teams WHERE name = 'Adelaide')),
    ('Lions', 'lions', (SELECT id FROM teams WHERE name = 'Brisbane')),
    ('Brisbane Lions', 'brisbane lions', (SELECT id FROM teams WHERE name = 'Brisbane')),
    ('Blues', 'blues', (SELECT id FROM teams WHERE name = 'Carlton')),
    ('Power', 'power', (SELECT id FROM teams WHERE name = 'Port Adelaide')),
    ('Bombers', 'bombers', (SELECT id FROM teams WHERE name = 'Essendon')),
    ('Demons', 'demons', (SELECT id FROM teams WHERE name = 'Melbourne')),
    ('Kangaroos', 'kangaroos', (SELECT id FROM teams WHERE name = 'North Melbourne')),
    ('Roos', 'roos', (SELECT id FROM teams WHERE name = 'North Melbourne')),
    ('North', 'north', (SELECT id FROM teams WHERE name = 'North Melbourne')),
    ('Suns', 'suns', (SELECT id FROM teams WHERE name = 'Gold Coast')),
    ('Hawks', 'hawks', (SELECT id FROM teams WHERE name = 'Hawthorn')),
    ('Tigers', 'tigers', (SELECT id FROM teams WHERE name = 'Richmond')),
    ('Saints', 'saints', (SELECT id FROM teams WHERE name = 'St Kilda')),
    ('Bulldogs', 'bulldogs', (SELECT id FROM teams WHERE name = 'Western Bulldogs')),
    ('Dogs', 'dogs', (SELECT id FROM teams WHERE name = 'Western Bulldogs')),
    ('Eagles', 'eagles', (SELECT id FROM teams WHERE name = 'West Coast')),
    ('Swans', 'swans', (SELECT id FROM teams WHERE name = 'Sydney')),
    ('Dockers', 'dockers', (SELECT id FROM teams WHERE name = 'Fremantle')),
    ('Cats', 'cats', (SELECT id FROM teams WHERE name = 'Geelong')),
    ('Magpies', 'magpies', (SELECT id FROM teams WHERE name = 'Collingwood')),
    ('Pies', 'pies', (SELECT id FROM teams WHERE name = 'Collingwood'))
  ON CONFLICT DO NOTHING;
END $$;

-- Update matches with home team IDs using exact match first, then normalized match
UPDATE matches m
SET home_team_id = tm.team_id
FROM team_name_mappings tm
WHERE TRIM(m.home_team) = tm.original_name
   OR REGEXP_REPLACE(LOWER(TRIM(m.home_team)), '\s+', ' ', 'g') = tm.normalized_name;

-- Update matches with away team IDs using exact match first, then normalized match
UPDATE matches m
SET away_team_id = tm.team_id
FROM team_name_mappings tm
WHERE TRIM(m.away_team) = tm.original_name
   OR REGEXP_REPLACE(LOWER(TRIM(m.away_team)), '\s+', ' ', 'g') = tm.normalized_name;

-- Check for any remaining unmatched teams and provide detailed error message
DO $$
DECLARE
  unmatched_teams text;
BEGIN
  WITH unmatched AS (
    SELECT 
      'home_team' as field,
      home_team as team_name,
      REGEXP_REPLACE(LOWER(TRIM(home_team)), '\s+', ' ', 'g') as normalized_name
    FROM matches 
    WHERE home_team_id IS NULL
    UNION ALL
    SELECT 
      'away_team' as field,
      away_team as team_name,
      REGEXP_REPLACE(LOWER(TRIM(away_team)), '\s+', ' ', 'g') as normalized_name
    FROM matches 
    WHERE away_team_id IS NULL
  )
  SELECT string_agg(DISTINCT field || ': ' || team_name || ' (normalized: ' || normalized_name || ')', E'\n')
  INTO unmatched_teams
  FROM unmatched;
  
  IF unmatched_teams IS NOT NULL THEN
    RAISE EXCEPTION 'Unmatched teams found: %', E'\n' || unmatched_teams;
  END IF;
END $$;

-- Make the columns required now that we've verified the data
ALTER TABLE matches
ALTER COLUMN home_team_id SET NOT NULL,
ALTER COLUMN away_team_id SET NOT NULL;

-- Add the foreign key constraints
ALTER TABLE matches
ADD CONSTRAINT matches_home_team_fkey FOREIGN KEY (home_team_id) REFERENCES teams(id),
ADD CONSTRAINT matches_away_team_fkey FOREIGN KEY (away_team_id) REFERENCES teams(id);

-- Drop the old text columns
ALTER TABLE matches
DROP COLUMN IF EXISTS home_team,
DROP COLUMN IF EXISTS away_team;

-- Clean up temporary tables
DROP TABLE team_name_mappings;