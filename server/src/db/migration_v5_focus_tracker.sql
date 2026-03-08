-- Migration v5: Hybrid Focus Timer

-- Focus Sessions Table
-- Allows users to log distinct focus/study blocks.
-- If linked_topic_id is provided, this time can auto-sync to their Course/Module Tracker.
CREATE TABLE IF NOT EXISTS focus_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    linked_subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL, -- Optional tagging
    linked_topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,     -- Optional tagging
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
