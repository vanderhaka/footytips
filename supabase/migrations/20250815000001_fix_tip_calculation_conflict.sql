/*
  # Fix Tip Calculation Conflict - Ensure Correct Function is Active

  Problem: Multiple versions of update_tips_correctness exist in migration history.
  This ensures the latest robust version is active and recalculates all tip correctness.
*/

-- =============================================
-- 1. Drop any existing versions and recreate the correct one
-- =============================================
DROP FUNCTION IF EXISTS update_tips_correctness(text) CASCADE;

/*
  The CORRECT version that handles both team names and abbreviations
  Sets tips.is_correct to TRUE when the tipped side and the match winner refer to
  the same team by *either* its full name or its abbreviation.
*/
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

    /* Home side comparison - flexible matching */
    WHEN ( (t.team_tipped = home.name) OR (t.team_tipped = home.abbreviation) )
         AND ( (m.winner = home.name) OR (m.winner = home.abbreviation) )
    THEN TRUE

    /* Away side comparison - flexible matching */
    WHEN ( (t.team_tipped = away.name) OR (t.team_tipped = away.abbreviation) )
         AND ( (m.winner = away.name) OR (m.winner = away.abbreviation) )
    THEN TRUE

    ELSE FALSE
  END
  FROM matches m
  LEFT JOIN teams home ON home.id = m.home_team_id
  LEFT JOIN teams away ON away.id = m.away_team_id
  WHERE m.id = p_match_id::bigint
    AND t.match_id = m.id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO authenticated, anon;

-- =============================================
-- 2. Ensure compute_tipper_points is also correct
-- =============================================
DROP FUNCTION IF EXISTS compute_tipper_points(bigint) CASCADE;

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
-- 3. Recreate the tipper_points view to ensure it uses the correct function
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
-- 4. CRITICAL: Recalculate ALL tip correctness with the fixed function
-- =============================================
DO $$
DECLARE
  rec RECORD;
  fixed_count INTEGER := 0;
BEGIN
  -- Process every completed match to ensure all tips are correctly marked
  FOR rec IN SELECT id FROM matches WHERE is_complete = TRUE ORDER BY id LOOP
    PERFORM update_tips_correctness(rec.id::text);
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Recalculated tip correctness for % completed matches', fixed_count;
  
  -- Show summary of tip correctness by user
  RAISE NOTICE '=== UPDATED TIP TOTALS ===';
  FOR rec IN 
    SELECT 
      tp.name,
      tp.total_points,
      COUNT(t.id) as total_tips_made,
      COUNT(CASE WHEN t.is_correct = TRUE THEN 1 END) as correct_tips
    FROM tipper_points tp
    LEFT JOIN tips t ON t.tipper_id = tp.tipper_id
    LEFT JOIN matches m ON m.id = t.match_id AND m.is_complete = TRUE
    GROUP BY tp.name, tp.total_points
    ORDER BY tp.total_points DESC
  LOOP
    RAISE NOTICE 'User: % | Total Points: % | Correct Tips: % | Total Tips Made: %', 
      rec.name, rec.total_points, rec.correct_tips, rec.total_tips_made;
  END LOOP;
END $$;