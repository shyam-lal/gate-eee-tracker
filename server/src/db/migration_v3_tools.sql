-- Migration v3: Multi-Tool Architecture
-- Users can create multiple named tools, each with their own tracking mode and subjects

-- Tools Table
CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    tool_type VARCHAR(20) NOT NULL DEFAULT 'time', -- 'time' or 'module'
    selected_exam VARCHAR(50) DEFAULT 'GATE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link subjects to a tool (nullable for backward compatibility with existing data)
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE;

-- Migrate existing data: create a default tool per user that has subjects and link them
DO $$
DECLARE
    u RECORD;
    new_tool_id INTEGER;
BEGIN
    FOR u IN 
        SELECT DISTINCT s.user_id, usr.tracking_mode, usr.selected_exam 
        FROM subjects s 
        JOIN users usr ON usr.id = s.user_id 
        WHERE s.tool_id IS NULL
    LOOP
        INSERT INTO tools (user_id, name, tool_type, selected_exam) 
        VALUES (
            u.user_id, 
            COALESCE(u.selected_exam, 'GATE') || ' Tracker', 
            COALESCE(u.tracking_mode, 'time'), 
            COALESCE(u.selected_exam, 'GATE')
        ) 
        RETURNING id INTO new_tool_id;

        UPDATE subjects SET tool_id = new_tool_id WHERE user_id = u.user_id AND tool_id IS NULL;
    END LOOP;
END $$;
