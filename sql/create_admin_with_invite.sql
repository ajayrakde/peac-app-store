-- Create a new admin invite code and output it, then create a user with that code
-- Usage: Set the variables below, then run this script in your SQL client

-- Set these before running:

-- 1. Generate a random code (UUID) and insert into admin_invite_codes
WITH new_code AS (
  INSERT INTO admin_invite_codes (code, used, created_at)
  VALUES (gen_random_uuid()::text, false, NOW())
  RETURNING code
)
-- 2. Create the admin user with the generated code (replace email and name as needed)
INSERT INTO users (firebase_uid, email, role, name, created_at, updated_at)
VALUES (
  'KG001', -- Will be set on first login
  'support@talentquarry.in',
  'admin',
  'support admin',
  NOW(),
  NOW()
)
RETURNING id, email;

-- 3. Output the generated code for admin onboarding
SELECT code FROM new_code;
