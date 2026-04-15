-- Migration v19: Study Planning System
-- Extends exam_topics and user_enrollments, creates user_topic_states

-- ═══════════════════════════════════════════════════
-- STEP 1: Create topic_status enum
-- ═══════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE topic_status AS ENUM ('NOT_STARTED', 'LEARNING', 'REVISING', 'MASTERED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════
-- STEP 2: Extend exam_topics with planning metadata
-- ═══════════════════════════════════════════════════

-- Numeric difficulty for planning calculations (1=easy, 5=very hard)
ALTER TABLE exam_topics ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 3
    CHECK (difficulty_level >= 1 AND difficulty_level <= 5);

-- Weightage within subject (marks/importance)
ALTER TABLE exam_topics ADD COLUMN IF NOT EXISTS weightage REAL;

-- Prerequisites: array of other exam_topic IDs that should be studied first
ALTER TABLE exam_topics ADD COLUMN IF NOT EXISTS prerequisites INTEGER[] DEFAULT '{}';

-- ═══════════════════════════════════════════════════
-- STEP 3: Extend user_enrollments with onboarding data
-- ═══════════════════════════════════════════════════

ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS daily_available_hours REAL DEFAULT 2;
ALTER TABLE user_enrollments ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ═══════════════════════════════════════════════════
-- STEP 4: Create user_topic_states table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_topic_states (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES exam_topics(id) ON DELETE CASCADE,

    -- Self-assessed confidence: 0 = no idea, 5 = fully confident
    confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 5),

    -- Current study status
    status topic_status DEFAULT 'NOT_STARTED',

    -- Tracking
    last_studied_at TIMESTAMPTZ,
    total_time_spent_minutes INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- STEP 5: Indexes
-- ═══════════════════════════════════════════════════

-- Composite unique: one state per user per topic
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_topic_states_user_topic
    ON user_topic_states(user_id, topic_id);

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_topic_states_user_id
    ON user_topic_states(user_id);

-- Fast lookups by topic
CREATE INDEX IF NOT EXISTS idx_user_topic_states_topic_id
    ON user_topic_states(topic_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_user_topic_states_status
    ON user_topic_states(user_id, status);
