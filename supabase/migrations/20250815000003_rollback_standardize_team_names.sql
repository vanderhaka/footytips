/*
  # Rollback Standardize AFL Team Names and Abbreviations
  
  This migration attempts to rollback the changes made in 
  20250815000000_standardize_team_names.sql by:
  1. Removing the constraints that were added
  2. Restoring original team names (best effort)
  3. Warning about data that cannot be automatically restored
*/

-- =============================================
-- 1. Remove the constraints that were added
-- =============================================
ALTER TABLE tips DROP CONSTRAINT IF EXISTS tips_team_tipped_check;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_winner_check;

-- =============================================
-- 2. Attempt to restore original team names in teams table
-- =============================================
/*
  WARNING: This is a best-effort restoration based on the mapping from the original migration.
  The original team names before the migration may have been different.
*/
DO $$
DECLARE
    reverse_mapping text[][] := ARRAY[
        ['Adelaide Crows', 'Adelaide', 'ADL'],
        ['Brisbane Lions', 'Brisbane', 'BRL'],
        ['Carlton Blues', 'Carlton', 'CAR'],
        ['Collingwood Magpies', 'Collingwood', 'COL'],
        ['Essendon Bombers', 'Essendon', 'ESS'],
        ['Fremantle Dockers', 'Fremantle', 'FRE'],
        ['Geelong Cats', 'Geelong', 'GEE'],
        ['Gold Coast Suns', 'Gold Coast', 'GC'],
        ['Greater Western Sydney Giants', 'GWS Giants', 'GWS'],
        ['Hawthorn Hawks', 'Hawthorn', 'HAW'],
        ['Melbourne Demons', 'Melbourne', 'MEL'],
        ['North Melbourne Kangaroos', 'North Melbourne', 'NM'],
        ['Port Adelaide Power', 'Port Adelaide', 'PA'],
        ['Richmond Tigers', 'Richmond', 'RIC'],
        ['St Kilda Saints', 'St Kilda', 'STK'],
        ['Sydney Swans', 'Sydney', 'SYD'],
        ['West Coast Eagles', 'West Coast', 'WC'],
        ['Western Bulldogs', 'Western Bulldogs', 'WB']
    ];
    mapping_row text[];
BEGIN
    -- Restore original team names (removing the standardized full names)
    FOREACH mapping_row SLICE 1 IN ARRAY reverse_mapping
    LOOP
        UPDATE teams 
        SET 
            name = mapping_row[2],
            abbreviation = NULL  -- Remove abbreviations if they weren't there before
        WHERE name = mapping_row[1];
        
        RAISE NOTICE 'Restored team: % -> %', mapping_row[1], mapping_row[2];
    END LOOP;
END $$;

-- =============================================
-- 3. WARNING: Tips and matches data cannot be easily rolled back
-- =============================================
/*
  CRITICAL WARNING: 
  
  The original migration modified all existing tips.team_tipped and matches.winner 
  values to use abbreviations. This rollback CANNOT automatically restore the 
  original values because:
  
  1. We don't know what the original values were before the migration
  2. The original migration converted various formats (full names, old abbreviations) 
     to standardized abbreviations
  3. There's no way to determine which format each record originally used
  
  If you need to restore the original tip and match data, you must:
  1. Restore from a database backup from before the original migration, OR
  2. Manually update the data based on your knowledge of the original format
  
  Current state after this rollback:
  - Teams table: Restored to simpler names without full standardized names
  - Tips table: Still contains abbreviations (ADL, BRL, etc.)
  - Matches table: Still contains abbreviations for winners
  - Constraints: Removed, so any format is now allowed again
*/

RAISE NOTICE 'ROLLBACK INCOMPLETE: Team names restored, but tips and matches data still uses abbreviations.';
RAISE NOTICE 'To fully rollback, restore from backup or manually update tips.team_tipped and matches.winner.';

-- Show current team state
SELECT 'Current teams after rollback:' as status;
SELECT name, abbreviation FROM teams ORDER BY name;