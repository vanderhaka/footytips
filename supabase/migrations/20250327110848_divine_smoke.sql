/*
  # Remove total_points column and add computed view

  1. Changes
    - Remove total_points column from tippers table
    - Create function to compute points
    - Create view for computed points based on correct tips
    - Set up appropriate security policies

  2. Details
    - Points are now calculated in real-time based on correct tips
    - No data loss since points are derived from tips table
    - Function and view are accessible to all authenticated users
*/

-- Create function to compute points
CREATE OR REPLACE FUNCTION compute_tipper_points(tipper_id bigint)
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

-- Remove the total_points column from tippers if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tippers' 
    AND column_name = 'total_points'
  ) THEN
    ALTER TABLE tippers DROP COLUMN total_points;
  END IF;
END $$;

-- Create the view using the function
CREATE OR REPLACE VIEW tipper_points AS
SELECT 
  t.id as tipper_id,
  t.name,
  t.avatar_url,
  t.created_at,
  compute_tipper_points(t.id) as total_points
FROM tippers t;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION compute_tipper_points(bigint) TO authenticated, anon;
GRANT SELECT ON tipper_points TO authenticated, anon;

-- Add comment to the view
COMMENT ON VIEW tipper_points IS 'Computed points for each tipper based on correct tips';