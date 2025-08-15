/*
  # Rollback Tip Calculation Conflict Fix
  
  This migration rolls back the changes made in 20250815000001_fix_tip_calculation_conflict.sql
  by removing the functions and views that were created/modified.
*/

-- =============================================
-- 1. Drop the functions that were created/recreated
-- =============================================
DROP FUNCTION IF EXISTS update_tips_correctness(text) CASCADE;
DROP FUNCTION IF EXISTS compute_tipper_points(bigint) CASCADE;

-- =============================================
-- 2. Drop the view that was recreated
-- =============================================
DROP VIEW IF EXISTS tipper_points CASCADE;

-- =============================================
-- 3. Note: Tip correctness data changes cannot be automatically rolled back
-- =============================================
/*
  WARNING: The tip correctness recalculation that was performed in the original
  migration cannot be automatically rolled back since we don't have a backup
  of the previous tip correctness states.
  
  If you need to restore the previous tip correctness calculations, you would
  need to:
  1. Restore from a database backup from before the migration, OR
  2. Manually recreate the previous version of the update_tips_correctness function
     and run it on all completed matches
*/

RAISE NOTICE 'Rollback complete. Note: Tip correctness data changes cannot be automatically undone.';