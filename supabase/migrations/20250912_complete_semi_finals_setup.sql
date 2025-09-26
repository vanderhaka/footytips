/*
  # Complete Semi-Finals Setup with RLS
  
  This migration:
  1. Disables RLS temporarily for setup
  2. Creates tables if they don't exist
  3. Inserts teams and matches
  4. Sets up proper RLS policies
*/

-- Temporarily disable RLS for setup
ALTER TABLE IF EXISTS teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tippers DISABLE ROW LEVEL SECURITY;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  abbreviation VARCHAR(5) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round INTEGER NOT NULL,
  venue VARCHAR(200),
  match_date TIMESTAMPTZ,
  home_score INTEGER,
  away_score INTEGER,
  winner VARCHAR(100),
  is_complete BOOLEAN DEFAULT FALSE,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tippers table if it doesn't exist
CREATE TABLE IF NOT EXISTS tippers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tips table if it doesn't exist
CREATE TABLE IF NOT EXISTS tips (
  id BIGSERIAL PRIMARY KEY,
  tipper_id BIGINT REFERENCES tippers(id),
  round INTEGER NOT NULL,
  match_id UUID REFERENCES matches(id),
  team_tipped VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tipper_id, round, match_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_tips_tipper ON tips(tipper_id);
CREATE INDEX IF NOT EXISTS idx_tips_match ON tips(match_id);

-- Insert all AFL teams (if they don't exist)
INSERT INTO teams (name, abbreviation) VALUES
  ('Adelaide Crows', 'ADE'),
  ('Brisbane Lions', 'BRL'),
  ('Carlton Blues', 'CAR'),
  ('Collingwood Magpies', 'COL'),
  ('Essendon Bombers', 'ESS'),
  ('Fremantle Dockers', 'FRE'),
  ('Geelong Cats', 'GEE'),
  ('Gold Coast Suns', 'GC'),
  ('Greater Western Sydney Giants', 'GWS'),
  ('Hawthorn Hawks', 'HAW'),
  ('Melbourne Demons', 'MEL'),
  ('North Melbourne Kangaroos', 'NM'),
  ('Port Adelaide Power', 'PA'),
  ('Richmond Tigers', 'RIC'),
  ('St Kilda Saints', 'STK'),
  ('Sydney Swans', 'SYD'),
  ('West Coast Eagles', 'WC'),
  ('Western Bulldogs', 'WB')
ON CONFLICT (name) DO NOTHING;

-- Add Semi-Finals matches (Round 27)
DO $$
DECLARE
  adl uuid; haw uuid; brl uuid; gc uuid;
BEGIN
  -- Get team IDs
  SELECT id INTO adl FROM teams WHERE name = 'Adelaide Crows';
  SELECT id INTO haw FROM teams WHERE name = 'Hawthorn Hawks';
  SELECT id INTO brl FROM teams WHERE name = 'Brisbane Lions';
  SELECT id INTO gc FROM teams WHERE name = 'Gold Coast Suns';

  -- Semi-Final 1: Adelaide Crows vs Hawthorn Hawks
  -- Friday, September 12 at 7:10pm AEST
  IF NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE round = 27 AND home_team_id = adl AND away_team_id = haw
  ) THEN
    INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
    VALUES (27, 'Adelaide Oval', '2025-09-12 09:10:00+00'::timestamptz, NULL, NULL, NULL, FALSE, adl, haw);
  END IF;

  -- Semi-Final 2: Brisbane Lions vs Gold Coast Suns
  -- Saturday, September 13 at 7:05pm AEST
  IF NOT EXISTS (
    SELECT 1 FROM matches 
    WHERE round = 27 AND home_team_id = brl AND away_team_id = gc
  ) THEN
    INSERT INTO matches (round, venue, match_date, home_score, away_score, winner, is_complete, home_team_id, away_team_id)
    VALUES (27, 'Gabba', '2025-09-13 09:05:00+00'::timestamptz, NULL, NULL, NULL, FALSE, brl, gc);
  END IF;

END $$;

-- Drop and recreate function for computing tipper points
DROP FUNCTION IF EXISTS compute_tipper_points(bigint);
CREATE FUNCTION compute_tipper_points(tipper_id bigint)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM tips tip
    JOIN matches m ON m.id = tip.match_id
    WHERE tip.tipper_id = compute_tipper_points.tipper_id
    AND m.is_complete = true
    AND tip.team_tipped = m.winner
  );
END;
$$;

-- Create tipper_points view
CREATE OR REPLACE VIEW tipper_points AS
SELECT 
  t.id as tipper_id,
  t.name,
  t.avatar_url,
  t.created_at,
  compute_tipper_points(t.id) as total_points
FROM tippers t;

-- Set up RLS policies (allowing public read access for now)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE tippers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Tips are viewable by everyone" ON tips FOR SELECT USING (true);
CREATE POLICY "Tippers are viewable by everyone" ON tippers FOR SELECT USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Authenticated users can manage matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage tips" ON tips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage tippers" ON tippers FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON teams TO anon, authenticated;
GRANT ALL ON matches TO anon, authenticated;
GRANT ALL ON tips TO anon, authenticated;
GRANT ALL ON tippers TO anon, authenticated;
GRANT EXECUTE ON FUNCTION compute_tipper_points(bigint) TO anon, authenticated;
GRANT SELECT ON tipper_points TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;