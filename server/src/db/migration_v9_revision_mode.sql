-- Add mode column to revision_attempts
ALTER TABLE revision_attempts ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'exam';
