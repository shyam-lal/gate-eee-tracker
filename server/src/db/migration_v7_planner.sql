-- Migration V7: Upgrade Planner Notes to support multiple types (Daily, Monthly, Half-Yearly)

-- 1. Rename table to be generic
ALTER TABLE IF EXISTS daily_notes RENAME TO planner_notes;

-- 2. Add note_type column safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='planner_notes' AND column_name='note_type') THEN
        ALTER TABLE planner_notes ADD COLUMN note_type VARCHAR(50) DEFAULT 'daily';
    END IF;
END $$;

-- 3. Update existing records to explicitly be 'daily' (just in case)
UPDATE planner_notes SET note_type = 'daily' WHERE note_type IS NULL;

-- 4. Alter the unique constraint to include note_type
-- First, attempt to drop the old constraint (auto-generated name is typically table_col1_col2_key)
ALTER TABLE planner_notes DROP CONSTRAINT IF EXISTS daily_notes_user_id_note_date_key;
ALTER TABLE planner_notes DROP CONSTRAINT IF EXISTS planner_notes_user_id_note_date_key;

-- Now add the new composite unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'planner_notes'::regclass 
        AND conname = 'planner_notes_user_id_note_date_type_key'
    ) THEN
        ALTER TABLE planner_notes ADD CONSTRAINT planner_notes_user_id_note_date_type_key UNIQUE (user_id, note_date, note_type);
    END IF;
END $$;
