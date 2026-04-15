-- Migration v20: Daily Study Plans
-- Stores server-generated daily plans

CREATE TABLE IF NOT EXISTS user_daily_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,

    -- Generated plan tasks as JSONB array
    -- Each task: { topic_id, topic_name, subject_name, type: 'LEARN'|'REVISE', duration_minutes, priority_score }
    tasks JSONB NOT NULL DEFAULT '[]',

    -- Summary stats
    total_minutes INTEGER DEFAULT 0,
    learn_minutes INTEGER DEFAULT 0,
    revise_minutes INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One plan per user per exam per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_daily_plans_unique
    ON user_daily_plans(user_id, exam_id, plan_date);

CREATE INDEX IF NOT EXISTS idx_user_daily_plans_user_date
    ON user_daily_plans(user_id, plan_date);
