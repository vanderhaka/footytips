/*
  # Fix PIN verification system
  
  1. Changes
    - Drop existing verify_pin function to avoid conflicts
    - Create new verify_pin function with proper error handling
    - Ensure admin_settings table exists with correct structure
    - Set up initial PIN
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS verify_pin(text);

-- Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Function to verify PIN
CREATE OR REPLACE FUNCTION verify_pin(input_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic validation
  IF input_pin IS NULL OR length(input_pin) != 6 THEN
    RETURN false;
  END IF;

  -- Verify the PIN hash matches
  RETURN EXISTS (
    SELECT 1 
    FROM admin_settings 
    WHERE password_hash = crypt(input_pin, password_hash)
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION verify_pin(text) TO anon;

-- Insert or update the default PIN (123456)
INSERT INTO admin_settings (password_hash)
VALUES (crypt('123456', gen_salt('bf')))
ON CONFLICT (id) DO UPDATE 
SET password_hash = crypt('123456', gen_salt('bf'));