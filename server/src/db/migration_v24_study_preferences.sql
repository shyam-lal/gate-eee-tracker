-- Migration v24: Study Preferences
-- Adds learning_preferences to user_enrollments

ALTER TABLE user_enrollments 
ADD COLUMN IF NOT EXISTS learning_preferences JSONB DEFAULT '{}';
