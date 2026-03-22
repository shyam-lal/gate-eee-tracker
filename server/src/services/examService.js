const pool = require('../config/db');
const { deleteFile } = require('./uploadService');
const googleDriveService = require('./googleDriveService');
// ═══════════════════════════════════════════════════
// Public / User-facing queries
// ═══════════════════════════════════════════════════

/**
 * Get all active exam categories
 */
const getCategories = async () => {
    const res = await pool.query(
        `SELECT id, name, slug, description, country, icon, sort_order
         FROM exam_categories
         WHERE is_active = TRUE
         ORDER BY sort_order ASC, name ASC`
    );
    return res.rows;
};

/**
 * Get all active exams, optionally filtered by category
 */
const getExams = async (categoryId = null) => {
    let query = `
        SELECT e.id, e.category_id, e.name, e.slug, e.full_name, e.description,
               e.primary_color, e.accent_color, e.logo_url,
               e.config, e.available_tools,
               ec.name as category_name, ec.slug as category_slug
        FROM exams e
        LEFT JOIN exam_categories ec ON ec.id = e.category_id
        WHERE e.is_active = TRUE
    `;
    const params = [];
    if (categoryId) {
        query += ' AND e.category_id = $1';
        params.push(categoryId);
    }
    query += ' ORDER BY ec.sort_order ASC, e.name ASC';

    const res = await pool.query(query, params);
    return res.rows;
};

/**
 * Get a single exam by ID with its full syllabus
 */
const getExamById = async (examId) => {
    const examRes = await pool.query(
        `SELECT e.*, ec.name as category_name, ec.slug as category_slug
         FROM exams e
         LEFT JOIN exam_categories ec ON ec.id = e.category_id
         WHERE e.id = $1`,
        [examId]
    );
    if (!examRes.rows.length) return null;
    return examRes.rows[0];
};

/**
 * Get exam by slug
 */
const getExamBySlug = async (slug) => {
    const res = await pool.query(
        `SELECT e.*, ec.name as category_name, ec.slug as category_slug
         FROM exams e
         LEFT JOIN exam_categories ec ON ec.id = e.category_id
         WHERE e.slug = $1`,
        [slug]
    );
    return res.rows[0] || null;
};

/**
 * Get full syllabus for an exam (subjects with their topics)
 */
const getExamSyllabus = async (examId) => {
    const subjects = await pool.query(
        `SELECT id, name, slug, sort_order, weightage, metadata
         FROM exam_subjects
         WHERE exam_id = $1
         ORDER BY sort_order ASC`,
        [examId]
    );

    for (const subject of subjects.rows) {
        const topics = await pool.query(
            `SELECT id, name, slug, sort_order, estimated_hours, difficulty, metadata
             FROM exam_topics
             WHERE subject_id = $1
             ORDER BY sort_order ASC`,
            [subject.id]
        );
        subject.topics = topics.rows;
    }

    return subjects.rows;
};

/**
 * Get study materials for an exam, optionally filtered by subject/topic
 */
const getStudyMaterials = async (examId, { subjectId, topicId, contentType } = {}) => {
    let query = `
        SELECT sm.*, es.name as subject_name, et.name as topic_name
        FROM study_materials sm
        LEFT JOIN exam_subjects es ON es.id = sm.subject_id
        LEFT JOIN exam_topics et ON et.id = sm.topic_id
        WHERE sm.exam_id = $1 AND sm.is_published = TRUE
    `;
    const params = [examId];
    let idx = 2;

    if (subjectId) {
        query += ` AND sm.subject_id = $${idx++}`;
        params.push(subjectId);
    }
    if (topicId) {
        query += ` AND sm.topic_id = $${idx++}`;
        params.push(topicId);
    }
    if (contentType) {
        query += ` AND sm.content_type = $${idx++}`;
        params.push(contentType);
    }

    query += ' ORDER BY sm.sort_order ASC, sm.created_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
};

// ═══════════════════════════════════════════════════
// User Enrollment
// ═══════════════════════════════════════════════════

/**
 * Enroll a user in an exam
 */
const enrollUser = async (userId, examId, targetDate = null) => {
    const res = await pool.query(
        `INSERT INTO user_enrollments (user_id, exam_id, target_date)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, exam_id) DO UPDATE SET is_active = TRUE, target_date = COALESCE($3, user_enrollments.target_date)
         RETURNING *`,
        [userId, examId, targetDate]
    );
    return res.rows[0];
};

/**
 * Get all exams a user is enrolled in
 */
const getUserEnrollments = async (userId) => {
    const res = await pool.query(
        `SELECT ue.id as enrollment_id, ue.enrolled_at, ue.target_date, ue.is_active,
                e.id as exam_id, e.name, e.slug, e.full_name, e.primary_color, e.accent_color,
                e.logo_url, e.available_tools, e.config,
                ec.name as category_name
         FROM user_enrollments ue
         JOIN exams e ON e.id = ue.exam_id
         LEFT JOIN exam_categories ec ON ec.id = e.category_id
         WHERE ue.user_id = $1 AND ue.is_active = TRUE
         ORDER BY ue.enrolled_at DESC`,
        [userId]
    );
    return res.rows;
};

/**
 * Set a user's active exam
 */
const setActiveExam = async (userId, examId) => {
    const res = await pool.query(
        'UPDATE users SET active_exam_id = $1 WHERE id = $2 RETURNING id, active_exam_id',
        [examId, userId]
    );
    return res.rows[0];
};

/**
 * Complete onboarding for a user
 */
const completeOnboarding = async (userId) => {
    await pool.query(
        'UPDATE users SET onboarding_completed = TRUE WHERE id = $1',
        [userId]
    );
};

// ═══════════════════════════════════════════════════
// Admin CRUD
// ═══════════════════════════════════════════════════

const createCategory = async (data) => {
    const res = await pool.query(
        `INSERT INTO exam_categories (name, slug, description, country, icon, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.name, data.slug, data.description, data.country || 'IN', data.icon, data.sort_order || 0]
    );
    return res.rows[0];
};

const updateCategory = async (id, data) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(data.slug); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (data.icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(data.icon); }
    if (data.sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(data.sort_order); }
    if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.is_active); }

    fields.push(`updated_at = NOW()`);

    if (fields.length <= 1) return null;

    values.push(id);
    const res = await pool.query(
        `UPDATE exam_categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

const createExam = async (data) => {
    const res = await pool.query(
        `INSERT INTO exams (category_id, name, slug, full_name, description,
                           primary_color, accent_color, logo_url, config, available_tools)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
            data.category_id, data.name, data.slug, data.full_name, data.description,
            data.primary_color || '#6366f1', data.accent_color || '#818cf8',
            data.logo_url, JSON.stringify(data.config || {}),
            JSON.stringify(data.available_tools || ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics']),
        ]
    );
    return res.rows[0];
};

const updateExam = async (id, data) => {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['category_id', 'name', 'slug', 'full_name', 'description',
                     'primary_color', 'accent_color', 'logo_url', 'is_active'];
    for (const key of allowed) {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${idx++}`);
            values.push(data[key]);
        }
    }
    if (data.config !== undefined) { fields.push(`config = $${idx++}`); values.push(JSON.stringify(data.config)); }
    if (data.available_tools !== undefined) { fields.push(`available_tools = $${idx++}`); values.push(JSON.stringify(data.available_tools)); }

    fields.push(`updated_at = NOW()`);

    if (fields.length <= 1) return null;

    values.push(id);
    const res = await pool.query(
        `UPDATE exams SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

const deleteExam = async (id) => {
    const res = await pool.query('DELETE FROM exams WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
};

// ─── Syllabus Admin ────────────────────────────────

const createSubject = async (examId, data) => {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = await pool.query(
        `INSERT INTO exam_subjects (exam_id, name, slug, sort_order, weightage, metadata)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [examId, data.name, slug, data.sort_order || 0, data.weightage || null, JSON.stringify(data.metadata || {})]
    );
    return res.rows[0];
};

const updateSubject = async (id, data) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(data.slug); }
    if (data.sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(data.sort_order); }
    if (data.weightage !== undefined) { fields.push(`weightage = $${idx++}`); values.push(data.weightage); }
    if (data.metadata !== undefined) { fields.push(`metadata = $${idx++}`); values.push(JSON.stringify(data.metadata)); }

    if (fields.length === 0) return null;

    values.push(id);
    const res = await pool.query(
        `UPDATE exam_subjects SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

const deleteSubject = async (id) => {
    const res = await pool.query('DELETE FROM exam_subjects WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
};

const createTopic = async (subjectId, data) => {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = await pool.query(
        `INSERT INTO exam_topics (subject_id, name, slug, sort_order, estimated_hours, difficulty, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [subjectId, data.name, slug, data.sort_order || 0, data.estimated_hours || 12, data.difficulty || 'medium', JSON.stringify(data.metadata || {})]
    );
    return res.rows[0];
};

const updateTopic = async (id, data) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(data.slug); }
    if (data.sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(data.sort_order); }
    if (data.estimated_hours !== undefined) { fields.push(`estimated_hours = $${idx++}`); values.push(data.estimated_hours); }
    if (data.difficulty !== undefined) { fields.push(`difficulty = $${idx++}`); values.push(data.difficulty); }
    if (data.metadata !== undefined) { fields.push(`metadata = $${idx++}`); values.push(JSON.stringify(data.metadata)); }

    if (fields.length === 0) return null;

    values.push(id);
    const res = await pool.query(
        `UPDATE exam_topics SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

const deleteTopic = async (id) => {
    const res = await pool.query('DELETE FROM exam_topics WHERE id = $1 RETURNING *', [id]);
    return res.rows[0];
};

// ─── Study Materials Admin ─────────────────────────

const createMaterial = async (data) => {
    const res = await pool.query(
        `INSERT INTO study_materials (
            exam_id, subject_id, topic_id, title, content_type, content, 
            file_url, file_size_bytes, r2_key, file_mime_type, page_count,
            uploaded_by, source, tags, sort_order
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
         RETURNING *`,
        [
            data.exam_id, data.subject_id || null, data.topic_id || null,
            data.title, data.content_type, data.content || null,
            data.file_url || null, data.file_size_bytes || null,
            data.r2_key || null, data.file_mime_type || null, data.page_count || null,
            data.uploaded_by || null, data.source || 'admin',
            JSON.stringify(data.tags || []), data.sort_order || 0,
        ]
    );
    return res.rows[0];
};

const updateMaterial = async (id, data) => {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = ['subject_id', 'topic_id', 'title', 'content_type', 'content',
                     'file_url', 'file_size_bytes', 'r2_key', 'file_mime_type', 'page_count', 
                     'status', 'sort_order', 'is_published'];
    for (const key of allowed) {
        if (data[key] !== undefined) {
            fields.push(`${key} = $${idx++}`);
            values.push(data[key]);
        }
    }
    if (data.tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(JSON.stringify(data.tags)); }

    fields.push(`updated_at = NOW()`);

    if (fields.length <= 1) return null;

    values.push(id);
    const res = await pool.query(
        `UPDATE study_materials SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

const deleteMaterial = async (id) => {
    // 1. Fetch the material first to get the storage key
    const fetchRes = await pool.query('SELECT r2_key FROM study_materials WHERE id = $1', [id]);
    const material = fetchRes.rows[0];

    // 2. Delete from database
    const res = await pool.query('DELETE FROM study_materials WHERE id = $1 RETURNING *', [id]);
    
    // 3. Delete from actual storage (R2 or Google Drive)
    if (material && material.r2_key) {
        // Google Drive IDs usually don't contain slashes. R2 keys do (e.g., 'materials/123-file.pdf')
        if (!material.r2_key.includes('/')) {
            await googleDriveService.deleteFromDrive(material.r2_key);
        } else {
            await deleteFile(material.r2_key);
        }
    }
    
    return res.rows[0];
};

module.exports = {
    // Public
    getCategories,
    getExams,
    getExamById,
    getExamBySlug,
    getExamSyllabus,
    getStudyMaterials,

    // User enrollment
    enrollUser,
    getUserEnrollments,
    setActiveExam,
    completeOnboarding,

    // Admin - Categories
    createCategory,
    updateCategory,

    // Admin - Exams
    createExam,
    updateExam,
    deleteExam,

    // Admin - Syllabus
    createSubject,
    updateSubject,
    deleteSubject,
    createTopic,
    updateTopic,
    deleteTopic,

    // Admin - Materials
    createMaterial,
    updateMaterial,
    deleteMaterial,
};
