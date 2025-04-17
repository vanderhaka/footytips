/*
  # Improve tip correctness calculations

  1. Fixes
    - Recreate update_tips_correctness to consider both team names *and* abbreviations when marking a tip correct.
    - Recreate compute_tipper_points to rely on tips.is_correct flag instead of direct string equality.
    - Back‑fill existing tips.is_correct values for all completed matches.

  2. Effect
    - Ensures leaderboards and per‑round score summaries are accurate when either the team name or abbreviation is stored in `tips.team_tipped` or `matches.winner`.
*/

-- =============================================
-- 1. Replace update_tips_correctness
-- =============================================
DROP FUNCTION IF EXISTS update_tips_correctness(text);

/*
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
  WHERE m.id = p_match_id::bigint
    AND t.match_id = m.id;
END;
$$;

-- Grant execution to the same roles as before
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO authenticated, anon;

-- =============================================
-- 2. Replace compute_tipper_points
-- =============================================
DROP FUNCTION IF EXISTS compute_tipper_points(bigint) CASCADE;

/*
  Returns the total number of correct tips for a given tipper. Uses the
  previously computed tips.is_correct flag (which now supports both names and
  abbreviations) to avoid duplicating comparison logic.
*/
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
-- 3. Refresh tipper_points view (drop & recreate)
-- =============================================
DROP VIEW IF EXISTS tipper_points;

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
-- 4. Back‑fill existing is_correct values for *all* completed matches
-- =============================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM matches WHERE is_complete = TRUE LOOP
    PERFORM update_tips_correctness(rec.id::text);
  END LOOP;
END $$; 