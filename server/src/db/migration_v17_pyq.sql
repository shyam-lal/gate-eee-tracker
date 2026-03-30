-- Migration v17: PYQ (Previous Year Questions) Mock Test System
-- Global question bank — admin-seeded, all users can attempt

-- ═══════════════════════════════════════════════════
-- PAPERS — One row per year/session question paper
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pyq_papers (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL,
    year INTEGER NOT NULL,
    session VARCHAR(50) DEFAULT 'Session 1',        -- 'Session 1', 'Session 2', 'Forenoon', 'Afternoon'
    branch VARCHAR(50) NOT NULL DEFAULT 'EE',        -- 'EE', 'ECE', 'CS', etc.
    title VARCHAR(255) NOT NULL,                     -- e.g. 'GATE EE 2024 — Session 1'
    total_marks REAL DEFAULT 100,
    duration_minutes INTEGER DEFAULT 180,
    pdf_url TEXT,                                     -- Google Drive link to original paper
    question_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pyq_papers_unique ON pyq_papers(year, session, branch);

-- ═══════════════════════════════════════════════════
-- QUESTIONS — Individual questions within a paper
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pyq_questions (
    id SERIAL PRIMARY KEY,
    paper_id INTEGER REFERENCES pyq_papers(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    section VARCHAR(100),                            -- 'General Aptitude', 'Technical', or specific subject
    question_type VARCHAR(10) NOT NULL DEFAULT 'mcq', -- 'mcq', 'msq', 'nat'
    question_text TEXT NOT NULL,
    options JSONB,                                    -- ["opt A", "opt B", "opt C", "opt D"] or null for NAT
    correct_answer JSONB NOT NULL,                    -- [0] for MCQ, [0,2] for MSQ, {"value":5,"tolerance":0.1} for NAT
    explanation TEXT,
    marks REAL DEFAULT 1,
    negative_marks REAL DEFAULT 0,
    subject_tag VARCHAR(100),                         -- e.g. 'Control Systems', 'Power Systems'
    topic_tag VARCHAR(200),                           -- e.g. 'Root Locus', 'Bode Plot'
    difficulty VARCHAR(20) DEFAULT 'medium',          -- 'easy', 'medium', 'hard'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pyq_questions_paper_id ON pyq_questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_pyq_questions_subject_tag ON pyq_questions(subject_tag);

-- ═══════════════════════════════════════════════════
-- ATTEMPTS — User taking a PYQ paper
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pyq_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    paper_id INTEGER REFERENCES pyq_papers(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'in_progress',         -- 'in_progress', 'paused', 'completed'
    score REAL DEFAULT 0,
    max_score REAL DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    current_question_index INTEGER DEFAULT 0,
    question_order JSONB,                             -- shuffled question IDs
    mode VARCHAR(20) DEFAULT 'exam'                   -- 'exam' or 'study'
);

CREATE INDEX IF NOT EXISTS idx_pyq_attempts_user_id ON pyq_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_pyq_attempts_paper_id ON pyq_attempts(paper_id);

-- ═══════════════════════════════════════════════════
-- ANSWERS — Per-question answer within an attempt
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pyq_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES pyq_attempts(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES pyq_questions(id) ON DELETE CASCADE,
    user_answer JSONB,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_pyq_answers_attempt_id ON pyq_answers(attempt_id);
