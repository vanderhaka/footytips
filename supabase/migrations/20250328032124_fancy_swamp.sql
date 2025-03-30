/*
  # Add functions for updating match results and tips

  1. New Functions
    - update_match_result: Updates match winner and completion status
    - update_tips_correctness: Updates correctness of tips for a match
    
  2. Details
    - Ensures atomic updates of match results
    - Automatically updates related tips
    - Maintains data consistency
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_match_result(bigint, text);
DROP FUNCTION IF EXISTS update_tips_correctness(bigint);

-- Function to update match result
CREATE OR REPLACE FUNCTION update_match_result(
  match_id text,
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
  UPDATE matches
  SET 
    winner = winner_team,
    is_complete = true
  WHERE id = match_id::bigint;

  -- Get the updated match data
  SELECT row_to_json(m)
  INTO result
  FROM (
    SELECT 
      matches.*,
      row_to_json(home_team.*) as home_team,
      row_to_json(away_team.*) as away_team
    FROM matches
    LEFT JOIN teams home_team ON home_team.id = matches.home_team_id
    LEFT JOIN teams away_team ON away_team.id = matches.away_team_id
    WHERE matches.id = match_id::bigint
  ) m;

  RETURN result;
END;
$$;

-- Function to update tips correctness
CREATE OR REPLACE FUNCTION update_tips_correctness(
  match_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the is_correct field for all tips for this match
  UPDATE tips
  SET is_correct = (team_tipped = m.winner)
  FROM matches m
  WHERE m.id = match_id::bigint
  AND tips.match_id = match_id::bigint;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_match_result(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_tips_correctness(text) TO authenticated, anon;