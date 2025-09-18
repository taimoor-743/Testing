-- Fix database constraints to resolve ON CONFLICT errors
-- This script adds the necessary unique constraints for proper upsert operations

-- Add unique constraint on google_email in google_drive_connections table
-- This allows ON CONFLICT operations on google_email
ALTER TABLE google_drive_connections 
ADD CONSTRAINT google_drive_connections_google_email_unique 
UNIQUE (google_email);

-- Add unique constraint on user_id in google_drive_connections table  
-- This ensures one connection per user
ALTER TABLE google_drive_connections 
ADD CONSTRAINT google_drive_connections_user_id_unique 
UNIQUE (user_id);

-- Note: The users table already has a unique constraint on email
-- which is correct for the existing schema

-- Verify constraints were added
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('users', 'google_drive_connections')
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;
