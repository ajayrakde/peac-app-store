-- Add profile_status column
ALTER TABLE candidates ADD COLUMN profile_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE employers ADD COLUMN profile_status TEXT NOT NULL DEFAULT 'pending';

-- Migrate existing data for candidates
UPDATE candidates SET profile_status = CASE WHEN verified THEN 'verified' ELSE 'pending' END;
-- Migrate existing data for employers
UPDATE employers SET profile_status = CASE WHEN verified THEN 'verified' ELSE 'pending' END;

-- Drop old verification columns
ALTER TABLE candidates DROP COLUMN profile_complete;
ALTER TABLE candidates DROP COLUMN verified;
ALTER TABLE employers DROP COLUMN verified;
