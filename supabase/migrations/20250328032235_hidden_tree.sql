/*
  # Fix ambiguous column references in match result functions

  1. Changes
    - Fix ambiguous match_id references in update_match_result
    - Fix ambiguous match_id references in update_tips_correctness
    - Improve table aliases for clarity
    
  2. Details
    - Use explicit table references for all column accesses
    - Maintain existing functionality while fixing ambiguity
    - Keep security and permissions intact
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_match_result(text, text);
DROP FUNCTION IF EXISTS update_tips_correctness(text);

-- Function to update match result
CREATE OR REPLACE FUNCTION update_match_result(
  p_match_id text,
  winner_team text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Update the match
  UPDATE matches m
  SET 
    winner = winner_team,
    is_complete = true
  WHERE m.id = p_match_id::bigint;

  -- Get the updated match data
  SELECT row_to_json(matched.*)
  INTO result
  FROM (
    SELECT 
      m.*,
      row_to_json(home_team.*) as home_team,
      row_to_json(away_team.*) as away_team
    FROM matches m
    LEFT JOIN teams home_team ON home_team.id = m.home_team_id
    LEFT JOIN teams away_team ON away_team.id = m.away_team_id
    WHERE m.id = p_match_id::bigint
  ) matched;

  RETURN result;
END;
$$;

-- Function to update tips correctness
CREATE OR REPLACE FUNCTION update_tips_correctness(
  p_match_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the is_correct field for all tips for this match
  UPDATE tips t
  SET is_correct = (t.team_tipped = m.winner)
  FROM matches m
  WHERE m.id = p_match_id::bigint
    AND t.match_id = p_match_id::bigint;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_match_result(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO authenticated, anon;