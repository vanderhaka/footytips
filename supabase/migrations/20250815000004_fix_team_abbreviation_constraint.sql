/*
  # Fix Team Abbreviation Constraint Issue
  
  This migration addresses the constraint violation in update_match_result by:
  1. Ensuring all team abbreviations in the teams table match the constraint
  2. Updating any remaining mismatched data
  3. Adding better error handling to the update_match_result function
*/

-- =============================================
-- 1. Verify and fix any remaining team abbreviation issues
-- =============================================

-- First, let's see what team abbreviations currently exist
DO $$
DECLARE
    team_rec RECORD;
    expected_abbreviations text[] := ARRAY['ADL', 'BRL', 'CAR', 'COL', 'ESS', 'FRE', 'GEE', 'GC', 'GWS', 'HAW', 'MEL', 'NM', 'PA', 'RIC', 'STK', 'SYD', 'WC', 'WB'];
BEGIN
    -- Check for any team abbreviations that don't match our constraint
    FOR team_rec IN 
        SELECT name, abbreviation 
        FROM teams 
        WHERE abbreviation NOT IN (SELECT unnest(expected_abbreviations))
    LOOP
        RAISE WARNING 'Found unexpected team abbreviation: % for team %', team_rec.abbreviation, team_rec.name;
    END LOOP;
    
    -- Fix any remaining Brisbane abbreviation issues
    UPDATE teams 
    SET abbreviation = 'BRL' 
    WHERE name LIKE '%Brisbane%' AND abbreviation != 'BRL';
    
    -- Ensure all team abbreviations are uppercase and trimmed
    UPDATE teams 
    SET abbreviation = UPPER(TRIM(abbreviation));
    
    RAISE NOTICE 'Team abbreviations verified and standardized';
END $$;

-- =============================================
-- 2. Update any remaining winner values that might not match
-- =============================================

-- Update any match winners that might have old abbreviations
UPDATE matches 
SET winner = 
    CASE 
        WHEN winner = 'BRI' THEN 'BRL'
        WHEN winner IS NOT NULL AND winner != 'draw' THEN UPPER(TRIM(winner))
        ELSE winner
    END
WHERE winner IS NOT NULL;

-- =============================================
-- 3. Improve the update_match_result function with better validation
-- =============================================

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS update_match_result(text, text);

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
  normalized_winner text;
  valid_abbreviations text[] := ARRAY['ADL', 'BRL', 'CAR', 'COL', 'ESS', 'FRE', 'GEE', 'GC', 'GWS', 'HAW', 'MEL', 'NM', 'PA', 'RIC', 'STK', 'SYD', 'WC', 'WB'];
BEGIN
  -- Normalize the winner value
  normalized_winner := UPPER(TRIM(winner_team));
  
  -- Handle special case for draw
  IF normalized_winner = 'DRAW' THEN
    normalized_winner := 'draw';
  END IF;
  
  -- Validate the winner value
  IF normalized_winner != 'draw' AND normalized_winner NOT IN (SELECT unnest(valid_abbreviations)) THEN
    RAISE EXCEPTION 'Invalid winner value: %. Must be one of: %, or "draw"', 
      winner_team, array_to_string(valid_abbreviations, ', ');
  END IF;

  -- Update the match
  UPDATE matches m
  SET 
    winner = normalized_winner,
    is_complete = true
  WHERE m.id = p_match_id::bigint;
  
  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match with ID % not found', p_match_id;
  END IF;

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

-- =============================================
-- 4. Grant appropriate permissions
-- =============================================

-- Grant execute permissions (maintain existing security model)
GRANT EXECUTE ON FUNCTION update_match_result(text, text) TO admin;

-- Add helpful comment
COMMENT ON FUNCTION update_match_result(text, text) IS 'Updates a match result with validation and returns the updated match data including team details';

-- =============================================
-- 5. Verify data integrity
-- =============================================

-- Check for any constraint violations in existing data
DO $$
DECLARE
    violation_count int;
    rec RECORD;
BEGIN
    SELECT COUNT(*)
    INTO violation_count
    FROM matches 
    WHERE winner IS NOT NULL 
      AND winner != 'draw' 
      AND winner NOT IN ('ADL', 'BRL', 'CAR', 'COL', 'ESS', 'FRE', 'GEE', 'GC', 'GWS', 'HAW', 'MEL', 'NM', 'PA', 'RIC', 'STK', 'SYD', 'WC', 'WB');
    
    IF violation_count > 0 THEN
        RAISE WARNING 'Found % matches with winner values that violate the constraint', violation_count;
        
        -- Show the problematic values
        FOR rec IN 
            SELECT id, winner 
            FROM matches 
            WHERE winner IS NOT NULL 
              AND winner != 'draw' 
              AND winner NOT IN ('ADL', 'BRL', 'CAR', 'COL', 'ESS', 'FRE', 'GEE', 'GC', 'GWS', 'HAW', 'MEL', 'NM', 'PA', 'RIC', 'STK', 'SYD', 'WC', 'WB')
            LIMIT 5
        LOOP
            RAISE WARNING 'Match ID % has invalid winner: %', rec.id, rec.winner;
        END LOOP;
    ELSE
        RAISE NOTICE 'All match winner values are valid according to the constraint';
    END IF;
END $$;

-- Show current team data for verification
SELECT 'Current teams:' as info, name, abbreviation FROM teams ORDER BY name;