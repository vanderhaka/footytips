/*
  # Add teams table with abbreviations

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `abbreviation` (text, unique)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `teams` table
    - Add policy for authenticated users to read team data
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  abbreviation text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users"
  ON teams
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Insert team data
INSERT INTO teams (name, abbreviation) VALUES
  ('Adelaide', 'ADL'),
  ('Brisbane', 'BRI'),
  ('Carlton', 'CAR'),
  ('Port Adelaide', 'PA'),
  ('Essendon', 'ESS'),
  ('Melbourne', 'MEL'),
  ('North Melbourne', 'NM'),
  ('Gold Coast', 'GC'),
  ('GWS Giants', 'GWS'),
  ('Hawthorn', 'HAW'),
  ('Richmond', 'RIC'),
  ('St Kilda', 'STK'),
  ('Western Bulldogs', 'WB'),
  ('West Coast', 'WC'),
  ('Sydney', 'SYD'),
  ('Fremantle', 'FRE'),
  ('Geelong', 'GEE'),
  ('Collingwood', 'COL')
ON CONFLICT (name) DO UPDATE SET abbreviation = EXCLUDED.abbreviation;