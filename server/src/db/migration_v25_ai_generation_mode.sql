-- Migration v25: AI Generation Mode Feature Flag

-- 1. Create global_settings table
CREATE TABLE IF NOT EXISTS global_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert default AI generation mode
INSERT INTO global_settings (key, value)
VALUES ('ai_generation_mode', '"manual"')
ON CONFLICT (key) DO NOTHING;

-- 3. Add ai_generation_mode column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_generation_mode VARCHAR(20) DEFAULT 'global';
