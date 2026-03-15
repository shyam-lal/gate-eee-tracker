-- Migration v12: Global Streak Support
-- Add tool_id to activity_logs directly so any tool can log activity without needing a specific topic

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE;

-- Backfill tool_id for existing records based on topics -> subjects -> tools
UPDATE activity_logs
SET tool_id = subjects.tool_id
FROM topics
JOIN subjects ON topics.subject_id = subjects.id
WHERE activity_logs.topic_id = topics.id AND activity_logs.tool_id IS NULL;

-- Also backfill for manual time where topic_id is NULL but we can derive it if they were logged against a subject directly
-- (Wait, manual time in syllabusService uses topic_id = NULL and doesn't log subject_id in activity_logs currently, 
--  but we can at least backfill everything that has a topic)
