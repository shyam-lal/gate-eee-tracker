-- Migration v29: Diagnostic Test Flow
-- Creates tables for storing diagnostic questions for non-authenticated quick fire quizzes.

CREATE TABLE IF NOT EXISTS diagnostic_questions (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES exam_subjects(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES exam_topics(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) DEFAULT 'medium',
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_id VARCHAR(50) NOT NULL,
    explanation TEXT,
    related_feature_recommendation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diag_questions_subject ON diagnostic_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_diag_questions_topic ON diagnostic_questions(topic_id);
