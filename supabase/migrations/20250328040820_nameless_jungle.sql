/*
  # Set up admin authentication

  1. Changes
    - Create admin user in auth.users if it doesn't exist
    - Set up admin role and permissions
    - Update verify_admin_password function to work with auth
    
  2. Security
    - Password is stored securely using bcrypt
    - Function is security definer
    - Limited permissions to anonymous users
*/

-- Create admin user if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'admin@example.com',
      crypt('123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      ''
    );
  END IF;
END $$;

-- Update verify_admin_password function to handle auth
CREATE OR REPLACE FUNCTION verify_admin_password(pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify both the admin_settings password and auth.users password
  RETURN EXISTS (
    SELECT 1 
    FROM admin_settings a
    CROSS JOIN auth.users u
    WHERE a.password_hash = crypt(pin, a.password_hash)
    AND u.email = 'admin@example.com'
    AND u.encrypted_password = crypt(pin, u.encrypted_password)
  );
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION verify_admin_password(text) TO anon;