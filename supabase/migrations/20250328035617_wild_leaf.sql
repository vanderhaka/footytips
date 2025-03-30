/*
  # Add authentication and protect admin routes

  1. Security Changes
    - Enable RLS on matches table
    - Add policies for read access to all users
    - Add policies for write access only to authenticated users
    - Add admin role and policy for admin-only access
    
  2. Data Preservation
    - No data modifications, only security changes
    - All existing data remains intact
*/

-- Create admin role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'admin'
  ) THEN
    CREATE ROLE admin;
  END IF;
END $$;

-- Enable RLS on matches table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow read access to all users"
  ON matches
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow write access only to authenticated users with admin role
CREATE POLICY "Allow write access to admins only"
  ON matches
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- Protect admin functions
REVOKE EXECUTE ON FUNCTION update_match_result(text, text) FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION update_tips_correctness(text) FROM authenticated, anon;

GRANT EXECUTE ON FUNCTION update_match_result(text, text) TO admin;
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO admin;