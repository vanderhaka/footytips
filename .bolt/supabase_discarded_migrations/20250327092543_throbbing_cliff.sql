/*
  # Create tippers table

  1. New Tables
    - `tippers`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `avatar_url` (text, nullable)
      - `total_points` (integer, default 0)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `tippers` table
    - Add policies for authenticated users to read all tippers
*/

CREATE TABLE IF NOT EXISTS tippers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tippers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tippers"
  ON tippers
  FOR SELECT
  TO authenticated
  USING (true);