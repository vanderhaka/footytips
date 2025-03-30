/*
  # Add admin password table and functions

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `password_hash` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `admin_settings` table
    - Add policy for admin role to manage settings
    - Add function to verify admin password
*/

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin role
CREATE POLICY "Allow admin to manage settings"
  ON admin_settings
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

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

-- Insert initial admin password (123456)
INSERT INTO admin_settings (password_hash)
VALUES (crypt('123456', gen_salt('bf')));