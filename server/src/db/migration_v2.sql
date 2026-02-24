-- Migration script to support Module-based tracking and User Preferences

-- Add tracking preferences to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_exam VARCHAR(50) DEFAULT 'GATE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tracking_mode VARCHAR(20) DEFAULT 'time'; -- 'time' or 'module'

-- Add module tracking to topics
ALTER TABLE topics ADD COLUMN IF NOT EXISTS total_modules INTEGER DEFAULT 0;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS completed_modules INTEGER DEFAULT 0;

-- Add optional module logging to activity_logs
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS modules_logged INTEGER DEFAULT 0;
ALTER TABLE activity_logs ALTER COLUMN minutes_logged DROP NOT NULL;
