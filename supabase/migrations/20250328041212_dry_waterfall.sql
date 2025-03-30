/*
  # Update admin PIN
  
  1. Changes
    - Updates the stored PIN hash in admin_settings table
    - Keeps existing table structure and functions
*/

-- Update the PIN hash
UPDATE admin_settings 
SET password_hash = crypt('YOUR_NEW_PIN', gen_salt('bf'));