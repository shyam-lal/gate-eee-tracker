-- Migration v8: Revision Mock Test System

-- A "Revision Set" is a collection of questions for a topic/session
CREATE TABLE IF NOT EXISTS revision_sets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    topics TEXT NOT NULL,
    question_count INTEGER DEFAULT 10,
    time_per_question INTEGER DEFAULT 180, -- seconds, default 3 min
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual questions within a set
CREATE TABLE IF NOT EXISTS revision_questions (
    id SERIAL PRIMARY KEY,
    set_id INTEGER REFERENCES revision_sets(id) ON DELETE CASCADE,
    question_type VARCHAR(10) NOT NULL DEFAULT 'mcq',
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer JSONB NOT NULL,
    explanation TEXT,
    marks INTEGER DEFAULT 1,
    negative_marks REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each time a user takes a test on a set
CREATE TABLE IF NOT EXISTS revision_attempts (
    id SERIAL PRIMARY KEY,
    set_id INTEGER REFERENCES revision_sets(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'in_progress',
    score REAL DEFAULT 0,
    max_score REAL DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    current_question_index INTEGER DEFAULT 0,
    question_order JSONB -- stores shuffled order of question IDs
);

-- Individual answers within an attempt
CREATE TABLE IF NOT EXISTS revision_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES revision_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES revision_questions(id) ON DELETE CASCADE,
    user_answer JSONB,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    UNIQUE(attempt_id, question_id)
);
