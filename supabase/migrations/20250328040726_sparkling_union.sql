/*
  # Set up admin authentication

  1. Changes
    - Create admin settings table if not exists
    - Create verify_admin_password function
    - Set up initial admin password
    - Handle existing policy gracefully
    
  2. Security
    - Password is stored securely using bcrypt
    - Function is security definer
    - Limited permissions to anonymous users
*/

-- Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow admin to manage settings" ON admin_settings;
  
  CREATE POLICY "Allow admin to manage settings"
    ON admin_settings
    FOR ALL
    TO admin
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the password hash matches
  RETURN EXISTS (
    SELECT 1 
    FROM admin_settings 
    WHERE password_hash = crypt(pin, password_hash)
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION verify_admin_password(text) TO anon;

-- Insert initial admin password (123456) if no password exists
INSERT INTO admin_settings (password_hash)
SELECT crypt('123456', gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);