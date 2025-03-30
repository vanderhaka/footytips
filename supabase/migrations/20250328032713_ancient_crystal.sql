/*
  # Fix ambiguous column references in functions

  1. Changes
    - Drop existing functions
    - Recreate functions with explicit table references
    - Add detailed function comments
    - Grant appropriate permissions

  2. Security
    - Maintain SECURITY DEFINER setting
    - Keep existing permissions for authenticated and anon roles
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_match_result(text, text);
DROP FUNCTION IF EXISTS update_tips_correctness(text);

-- Function to update match result and return updated match data
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

  -- Get the updated match data including team details
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

  -- Update tips correctness for this match
  UPDATE tips t
  SET is_correct = (t.team_tipped = m.winner)
  FROM matches m
  WHERE m.id = p_match_id::bigint
    AND t.match_id = m.id;

  RETURN result;
END;
$$;

-- Function to update tips correctness for a match
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
    AND t.match_id = m.id;
END;
$$;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION update_match_result(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO authenticated, anon;

-- Add helpful comments to the functions
COMMENT ON FUNCTION update_match_result(text, text) IS 'Updates a match result and returns the updated match data including team details';
COMMENT ON FUNCTION update_tips_correctness(text) IS 'Updates the correctness of all tips for a given match based on the winner';