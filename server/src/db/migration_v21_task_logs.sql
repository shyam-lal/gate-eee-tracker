-- Migration v21: Task Execution Logs
-- Tracks completion of individual tasks from daily plans

CREATE TABLE IF NOT EXISTS user_task_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES exam_topics(id) ON DELETE CASCADE,

    task_type VARCHAR(10) NOT NULL CHECK (task_type IN ('LEARN', 'REVISE')),
    planned_duration INTEGER NOT NULL DEFAULT 0,   -- minutes
    actual_duration INTEGER NOT NULL DEFAULT 0,    -- minutes
    completed BOOLEAN DEFAULT FALSE,

    plan_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_task_logs_user_id
    ON user_task_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_task_logs_user_date
    ON user_task_logs(user_id, plan_date);

CREATE INDEX IF NOT EXISTS idx_user_task_logs_topic
    ON user_task_logs(user_id, topic_id);
