/*
  # Fix null tipper names

  1. Changes
    - Delete any tipper records with null names since they are invalid
    - Add NOT NULL constraint to name column if not already present
    
  2. Data Cleanup
    - Removes invalid tipper records that have null names
    - Ensures data integrity going forward
*/

-- Delete any tipper records with null names
DELETE FROM tippers WHERE name IS NULL;

-- Ensure name column has NOT NULL constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tippers' 
      AND column_name = 'name' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE tippers ALTER COLUMN name SET NOT NULL;
  END IF;
END $$;