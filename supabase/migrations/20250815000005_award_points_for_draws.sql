/*
  Update tip correctness calculations to award points for draws
  
  Changes:
  - When a match ends in a draw, all tips for that match are marked as correct
  - This ensures all tippers get +1 point when matches end in draws
*/

-- =============================================
-- Update update_tips_correctness to handle draws
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
  WHERE m.id = p_match_id::bigint
    AND t.match_id = m.id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO authenticated, anon;

-- =============================================
-- Back-fill existing draws to award points
-- =============================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM matches WHERE is_complete = TRUE AND winner = 'draw' LOOP
    PERFORM update_tips_correctness(rec.id::text);
  END LOOP;
END $$;