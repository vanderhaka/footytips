/*
  # Simplify PIN system
  
  1. Changes
    - Drop existing verify_pin function
    - Create new admin_settings table with simple PIN storage
    - Create simple PIN verification function
    - Set PIN to 990744
*/

-- Drop existing function and table
DROP FUNCTION IF EXISTS verify_pin(text);
DROP TABLE IF EXISTS admin_settings;

-- Create simplified admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Function to verify PIN
CREATE OR REPLACE FUNCTION verify_pin(input_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM admin_settings 
    WHERE pin = input_pin
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION verify_pin(text) TO anon;

-- Insert the PIN (990744)
INSERT INTO admin_settings (pin)
VALUES ('990744')
ON CONFLICT (id) DO UPDATE 
SET pin = '990744';