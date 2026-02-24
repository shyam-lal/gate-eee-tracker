-- Social & Gamification Migration

-- Achievements Definitions
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    requirement_type VARCHAR(50), -- 'streak', 'minutes', 'modules', 'subjects'
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements (Earned)
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Following System
CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- User Streak & Public Profile Settings
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- Seed initial achievements
INSERT INTO achievements (name, description, icon_name, requirement_type, requirement_value) VALUES
('First Sync', 'Logged your first study session.', 'zap', 'minutes', 1),
('Streak Starter', 'Maintained a 3-day study streak.', 'flame', 'streak', 3),
('Deep Diver', 'Maintained a 7-day study streak.', 'award', 'streak', 7),
('Hour Master', 'Logged over 60 minutes of study.', 'clock', 'minutes', 60),
('Module Expert', 'Completed 5 modules.', 'box', 'modules', 5)
ON CONFLICT DO NOTHING;
