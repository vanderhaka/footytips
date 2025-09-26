-- Add is_correct column and related functions for proper tip tracking
-- This migration adds the is_correct column to tips table and creates/updates
-- functions to properly calculate tip correctness including draw handling

-- =============================================
-- 1. Add is_correct column to tips table
-- =============================================
ALTER TABLE tips ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tips_is_correct ON tips(is_correct) WHERE is_correct IS NOT NULL;

-- =============================================
-- 2. Create update_tips_correctness function
-- =============================================
CREATE OR REPLACE FUNCTION update_tips_correctness(
  p_match_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  /* Update all tips for the supplied match */
  UPDATE tips t
  SET is_correct = CASE
    /* Incomplete matches remain NULL */
    WHEN m.is_complete IS FALSE OR m.winner IS NULL THEN NULL

    /* Draw: all tips are correct (everyone gets a point) */
    WHEN m.winner = 'draw' THEN TRUE

    /* Home side comparison */
    WHEN ( (t.team_tipped = home.name) OR (t.team_tipped = home.abbreviation) )
         AND ( (m.winner = home.name) OR (m.winner = home.abbreviation) )
    THEN TRUE

    /* Away side comparison */
    WHEN ( (t.team_tipped = away.name) OR (t.team_tipped = away.abbreviation) )
         AND ( (m.winner = away.name) OR (m.winner = away.abbreviation) )
    THEN TRUE

    ELSE FALSE
  END
  FROM matches m
  LEFT JOIN teams home ON home.id = m.home_team_id
  LEFT JOIN teams away ON away.id = m.away_team_id
  WHERE m.id = p_match_id::uuid
    AND t.match_id = m.id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO authenticated, anon;

-- =============================================
-- 3. Create compute_tipper_points function
-- =============================================
CREATE OR REPLACE FUNCTION compute_tipper_points(p_tipper_id bigint)
RETURNS integer
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM tips t
    JOIN matches m ON m.id = t.match_id
    WHERE t.tipper_id = p_tipper_id
      AND m.is_complete = TRUE
      AND t.is_correct = TRUE
  );
END;
$$;

GRANT EXECUTE ON FUNCTION compute_tipper_points(bigint) TO authenticated, anon;

-- =============================================
-- 4. Create or replace tipper_points view
-- =============================================
DROP VIEW IF EXISTS tipper_points CASCADE;

CREATE OR REPLACE VIEW tipper_points AS
SELECT 
  tp.id          AS tipper_id,
  tp.name,
  tp.avatar_url,
  tp.created_at,
  compute_tipper_points(tp.id) AS total_points
FROM tippers tp;

GRANT SELECT ON tipper_points TO authenticated, anon;

-- =============================================
-- 5. Create trigger to update tip correctness when match completes
-- =============================================
CREATE OR REPLACE FUNCTION trigger_update_tips_on_match_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if match is being marked as complete
  IF NEW.is_complete = TRUE AND (OLD.is_complete IS NULL OR OLD.is_complete = FALSE) THEN
    PERFORM update_tips_correctness(NEW.id::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_tips_on_match_complete ON matches;

-- Create the trigger
CREATE TRIGGER update_tips_on_match_complete
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tips_on_match_complete();

-- =============================================
-- 6. Back-fill existing completed matches
-- =============================================
DO $$
DECLARE
  rec RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Process every completed match to ensure all tips are correctly marked
  FOR rec IN SELECT id FROM matches WHERE is_complete = TRUE ORDER BY id LOOP
    PERFORM update_tips_correctness(rec.id::text);
    updated_count := updated_count + 1;
  END LOOP;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Updated tip correctness for % completed matches', updated_count;
  END IF;
END $$;