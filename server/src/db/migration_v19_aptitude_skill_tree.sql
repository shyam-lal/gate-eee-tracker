-- Migration v19: General Aptitude Skill Tree
-- Hexagonal skill map with 54 topics across 3 units (Quant, Reasoning, Verbal)
-- Supports the Mastery Loop: Spark → Forge → Arena

-- ═══════════════════════════════════════════════════
-- UNITS — The 3 top-level curriculum areas
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aptitude_units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#6366f1',
    estimated_hours REAL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- NODES — 54 individual skill tree topics
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS aptitude_nodes (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER REFERENCES aptitude_units(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    estimated_minutes INTEGER DEFAULT 120,
    difficulty VARCHAR(20) DEFAULT 'medium',
    sort_order INTEGER DEFAULT 0,

    -- Hex grid position for the map UI
    hex_row INTEGER DEFAULT 0,
    hex_col INTEGER DEFAULT 0,

    -- Unlock prerequisites (array of node slugs)
    prerequisites JSONB DEFAULT '[]',

    -- Interactive tool configuration (for Phase 2-4)
    interaction_type VARCHAR(50),        -- 'relativity_engine', 'structure_lab', 'context_weaver'
    interaction_config JSONB DEFAULT '{}',

    -- Extensible metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════
-- USER PROGRESS — Per-user mastery tracking per node
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_aptitude_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    node_id INTEGER REFERENCES aptitude_nodes(id) ON DELETE CASCADE,

    -- Mastery Loop status
    status VARCHAR(20) DEFAULT 'locked',  -- locked, unlocked, spark_done, forge_done, arena_done, mastered
    spark_completed_at TIMESTAMPTZ,
    forge_completed_at TIMESTAMPTZ,
    arena_score REAL,
    arena_completed_at TIMESTAMPTZ,

    -- Aggregate stats
    time_spent_seconds INTEGER DEFAULT 0,
    mastery_percentage REAL DEFAULT 0,

    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, node_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aptitude_nodes_unit_id ON aptitude_nodes(unit_id);
CREATE INDEX IF NOT EXISTS idx_user_apt_progress_user_id ON user_aptitude_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_apt_progress_node_id ON user_aptitude_progress(node_id);
