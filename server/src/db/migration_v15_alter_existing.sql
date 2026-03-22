-- Migration v15: Multi-Exam Platform — Alter Existing Tables
-- Links existing tables to the new exam infrastructure

-- ═══════════════════════════════════════════════════
-- Users table: add role, active exam, onboarding flag
-- ═══════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ═══════════════════════════════════════════════════
-- Tools table: link to exam
-- ═══════════════════════════════════════════════════

ALTER TABLE tools ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════
-- Revision sets: link to exam
-- ═══════════════════════════════════════════════════

ALTER TABLE revision_sets ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════
-- Subjects table: link to exam_subjects template
-- ═══════════════════════════════════════════════════

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_subject_id INTEGER REFERENCES exam_subjects(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════
-- Topics table: link to exam_topics template
-- ═══════════════════════════════════════════════════

ALTER TABLE topics ADD COLUMN IF NOT EXISTS exam_topic_id INTEGER REFERENCES exam_topics(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_active_exam ON users(active_exam_id);
CREATE INDEX IF NOT EXISTS idx_tools_exam_id ON tools(exam_id);
CREATE INDEX IF NOT EXISTS idx_revision_sets_exam_id ON revision_sets(exam_id);
