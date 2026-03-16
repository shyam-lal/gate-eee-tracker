-- Migration v13: Fix log_date for historical activity_logs
-- Old rows had log_date set by PostgreSQL's CURRENT_DATE which uses the server/database timezone (UTC).
-- For IST (+05:30) users, activity logged between 00:00-05:30 IST was recorded as the PREVIOUS day.
-- This migration recalculates log_date from created_at using IST timezone to fix any mismatches.

-- Recalculate log_date from created_at using Asia/Kolkata timezone for all existing rows
UPDATE activity_logs
SET log_date = (created_at AT TIME ZONE 'Asia/Kolkata')::date
WHERE created_at IS NOT NULL;

-- Also backfill any rows where log_date is somehow NULL
UPDATE activity_logs
SET log_date = CURRENT_DATE
WHERE log_date IS NULL;
