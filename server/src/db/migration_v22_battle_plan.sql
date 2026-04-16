-- Migration v22: Daily Battle Plan Enhancements
-- Extends user_daily_plans and user_task_logs for the mission-list experience

-- 1. Extend user_daily_plans
ALTER TABLE user_daily_plans
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'NOT_STARTED'
        CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')),
    ADD COLUMN IF NOT EXISTS total_completed_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;

-- 2. Extend user_task_logs for richer tracking
ALTER TABLE user_task_logs
    ADD COLUMN IF NOT EXISTS task_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT FALSE;

-- Allow FLASHCARD task type (widen check constraint)
-- Drop old constraint and re-add with FLASHCARD support
ALTER TABLE user_task_logs DROP CONSTRAINT IF EXISTS user_task_logs_task_type_check;
ALTER TABLE user_task_logs ADD CONSTRAINT user_task_logs_task_type_check
    CHECK (task_type IN ('LEARN', 'REVISE', 'FLASHCARD'));

-- Index for task_id lookups
CREATE INDEX IF NOT EXISTS idx_user_task_logs_task_id
    ON user_task_logs(task_id);
