-- Migration v14: Multi-Exam Platform — Core Tables
-- Creates the foundation for supporting multiple competitive exams

-- ═══════════════════════════════════════════════════
-- LEVEL 0: Platform Configuration (Admin-Managed)
-- ═══════════════════════════════════════════════════

-- Exam categories (e.g. "Engineering Entrance", "Civil Services", etc.)
CREATE TABLE IF NOT EXISTS exam_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    country VARCHAR(50) DEFAULT 'IN',
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual exams within categories
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES exam_categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    full_name VARCHAR(255),

    -- Theming & Branding
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    accent_color VARCHAR(7) DEFAULT '#818cf8',
    logo_url TEXT,

    -- Configuration (flexible — exam patterns, marks distribution, etc.)
    config JSONB DEFAULT '{}',
    
    -- Which tools are available for this exam
    available_tools JSONB DEFAULT '["tracker","flashcard","revision","planner","focus","analytics"]',

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- LEVEL 1: Syllabus Structure (Admin-Managed, per Exam)
-- ═══════════════════════════════════════════════════

-- Subjects within an exam's syllabus
CREATE TABLE IF NOT EXISTS exam_subjects (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    weightage REAL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics within a subject
CREATE TABLE IF NOT EXISTS exam_topics (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES exam_subjects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(150),
    sort_order INTEGER DEFAULT 0,
    estimated_hours REAL DEFAULT 12,
    difficulty VARCHAR(20) DEFAULT 'medium',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- LEVEL 2: Study Materials (Admin-Managed, per Exam)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS study_materials (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES exam_subjects(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES exam_topics(id) ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,   -- 'pdf', 'notes', 'video_link', 'formula_sheet'
    content TEXT,                         -- for text/markdown content
    file_url TEXT,                        -- for uploaded files
    file_size_bytes BIGINT,

    tags JSONB DEFAULT '[]',
    sort_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- LEVEL 3: User Enrollments
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    target_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, exam_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam_id ON exam_subjects(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_topics_subject_id ON exam_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_exam_id ON study_materials(exam_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_subject_id ON study_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_topic_id ON study_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_exam_id ON user_enrollments(exam_id);
