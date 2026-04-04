-- Migration v20: Aptitude Content & Answer Tracking
-- Supports the Mastery Loop: Spark lessons + Forge/Arena questions

-- ═══════════════════════════════════════════════════
-- CONTENT — Spark lessons, Forge & Arena questions
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aptitude_content (
    id SERIAL PRIMARY KEY,
    node_id INTEGER REFERENCES aptitude_nodes(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL,  -- 'spark_lesson', 'forge_question', 'arena_question'
    title VARCHAR(300),
    body TEXT NOT NULL,
    options JSONB DEFAULT '[]',         -- MCQ: [{key, text, isCorrect}]
    answer TEXT,                        -- Correct key or NAT value
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium',
    time_limit_seconds INTEGER DEFAULT 60,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- USER ANSWERS — Per-question response log
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_aptitude_answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content_id INTEGER REFERENCES aptitude_content(id) ON DELETE CASCADE,
    node_id INTEGER REFERENCES aptitude_nodes(id) ON DELETE CASCADE,
    stage VARCHAR(20) NOT NULL,         -- 'forge' or 'arena'
    selected_answer TEXT,
    is_correct BOOLEAN,
    time_taken_seconds INTEGER DEFAULT 0,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aptitude_content_node ON aptitude_content(node_id);
CREATE INDEX IF NOT EXISTS idx_aptitude_content_type ON aptitude_content(content_type);
CREATE INDEX IF NOT EXISTS idx_user_apt_answers_user ON user_aptitude_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_apt_answers_node ON user_aptitude_answers(node_id);
