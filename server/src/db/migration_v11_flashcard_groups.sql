-- Migration v11: Flashcard Groups (Subjects)

-- 1. Create the flashcard_groups table
CREATE TABLE IF NOT EXISTS flashcard_groups (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add group_id to decks table safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decks' AND column_name='group_id') THEN
        ALTER TABLE decks ADD COLUMN group_id INTEGER REFERENCES flashcard_groups(id) ON DELETE CASCADE;

        -- 3. Create a default "General Subjects" group for any tool that currently has decks
        INSERT INTO flashcard_groups (tool_id, name)
        SELECT DISTINCT tool_id, 'General Subjects' FROM decks WHERE tool_id IS NOT NULL;

        -- 4. Assign existing decks to their tool's "General Subjects" group
        UPDATE decks d
        SET group_id = fg.id
        FROM flashcard_groups fg
        WHERE d.tool_id = fg.tool_id AND fg.name = 'General Subjects';

        -- 6. Enforce NOT NULL on group_id, now that data is migrated
        ALTER TABLE decks ALTER COLUMN group_id SET NOT NULL;

        -- 7. Remove the redundant tool_id from decks, as they now belong to groups
        ALTER TABLE decks DROP COLUMN tool_id;
    END IF;
END $$;
