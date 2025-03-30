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

-- Function to update match result
CREATE OR REPLACE FUNCTION update_match_result(
  match_id bigint,
  winner_team text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the match
  UPDATE matches
  SET 
    winner = winner_team,
    is_complete = true
  WHERE id = match_id
  RETURNING *;

  -- Return the updated match data
  RETURN (
    SELECT row_to_json(m)
    FROM (
      SELECT 
        m.*,
        home.name as home_team_name,
        home.abbreviation as home_team_abbreviation,
        away.name as away_team_name,
        away.abbreviation as away_team_abbreviation
      FROM matches m
      LEFT JOIN teams home ON home.id = m.home_team_id
      LEFT JOIN teams away ON away.id = m.away_team_id
      WHERE m.id = match_id
    ) m
  );
END;
$$;

-- Function to update tips correctness
CREATE OR REPLACE FUNCTION update_tips_correctness(
  match_id bigint
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
  WHERE m.id = match_id
  AND tips.match_id = match_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_match_result(bigint, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_tips_correctness(bigint) TO authenticated, anon;