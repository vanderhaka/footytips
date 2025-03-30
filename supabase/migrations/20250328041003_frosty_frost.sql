/*
  # Simple PIN Authentication
  
  1. Changes
    - Create admin_settings table for PIN storage
    - Add function to verify PIN
    - Store default PIN (123456)
    
  2. Security
    - PIN is stored hashed
    - Basic protection against unauthorized access
*/

-- Create admin_settings table
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
  RETURN EXISTS (
    SELECT 1 
    FROM admin_settings 
    WHERE password_hash = crypt(input_pin, password_hash)
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION verify_pin(text) TO anon;

-- Insert default PIN (123456)
INSERT INTO admin_settings (password_hash)
VALUES (crypt('123456', gen_salt('bf')))
ON CONFLICT DO NOTHING;