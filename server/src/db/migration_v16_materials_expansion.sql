-- Migration v16: Expanded Materials System & Question Bank
-- Adds Cloudflare R2 tracking to materials, creates structured PYQ question bank, and prepares social features.

-- 1. Expand study_materials for R2 uploads and tracking
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin'; -- 'admin', 'user', 'system'
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published'; -- 'draft', 'pending_review', 'published', 'rejected'
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS r2_key TEXT; -- Required for deleting the file from R2
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS file_mime_type VARCHAR(100);
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS page_count INTEGER;

-- 2. Structured Question Bank (for PYQs & Mock Tests)
-- Not using vectors yet — this is for exact filtering (topic + year + type)
CREATE TABLE IF NOT EXISTS question_bank (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES exam_subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES exam_topics(id) ON DELETE SET NULL,
    material_id INTEGER REFERENCES study_materials(id) ON DELETE SET NULL, -- the source PDF

    -- Question content
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 'mcq', 'msq', 'nat', 'subjective'
    options JSONB, -- e.g. ["opt1", "opt2", "opt3", "opt4"]
    correct JSONB, -- Answers: [0] or [0,2] or {"value": 10, "tolerance": 0.1}
    explanation TEXT,
    
    -- Metadata
    year INTEGER,
    marks REAL DEFAULT 1,
    negative REAL DEFAULT 0,
    difficulty VARCHAR(20) DEFAULT 'medium',
    frequency INTEGER DEFAULT 1,
    tags JSONB DEFAULT '[]',

    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast mock test generation
CREATE INDEX IF NOT EXISTS idx_qbank_exam ON question_bank(exam_id);
CREATE INDEX IF NOT EXISTS idx_qbank_topic ON question_bank(topic_id);
CREATE INDEX IF NOT EXISTS idx_qbank_year ON question_bank(year);
CREATE INDEX IF NOT EXISTS idx_qbank_type ON question_bank(question_type);

-- 3. Material Requests (Future Social Feature Foundation)
CREATE TABLE IF NOT EXISTS material_requests (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES exam_topics(id) ON DELETE SET NULL,
    requested_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'fulfilled', 'closed'
    upvotes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matreq_exam ON material_requests(exam_id);
