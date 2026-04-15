const pool = require('../config/db');

// ═══════════════════════════════════════════════════
// User Topic States
// ═══════════════════════════════════════════════════

/**
 * Get all topic states for a user's enrolled exam.
 * Joins through exam_topics → exam_subjects to filter by exam.
 */
const getUserTopicStates = async (userId, examId) => {
    const res = await pool.query(
        `SELECT uts.id, uts.topic_id, uts.confidence, uts.status,
                uts.last_studied_at, uts.total_time_spent_minutes,
                et.name as topic_name, et.difficulty_level, et.weightage as topic_weightage,
                et.estimated_hours, et.prerequisites,
                es.id as subject_id, es.name as subject_name, es.weightage as subject_weightage
         FROM exam_topics et
         JOIN exam_subjects es ON es.id = et.subject_id
         LEFT JOIN user_topic_states uts ON uts.topic_id = et.id AND uts.user_id = $1
         WHERE es.exam_id = $2
         ORDER BY es.sort_order ASC, et.sort_order ASC`,
        [userId, examId]
    );
    return res.rows;
};

/**
 * Upsert a single topic state (idempotent).
 */
const upsertTopicState = async (userId, topicId, data) => {
    const res = await pool.query(
        `INSERT INTO user_topic_states (user_id, topic_id, confidence, status, last_studied_at, total_time_spent_minutes)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, topic_id) DO UPDATE SET
            confidence = COALESCE($3, user_topic_states.confidence),
            status = COALESCE($4, user_topic_states.status),
            last_studied_at = COALESCE($5, user_topic_states.last_studied_at),
            total_time_spent_minutes = COALESCE($6, user_topic_states.total_time_spent_minutes),
            updated_at = NOW()
         RETURNING *`,
        [
            userId,
            topicId,
            data.confidence ?? null,
            data.status ?? null,
            data.last_studied_at ?? null,
            data.total_time_spent_minutes ?? null,
        ]
    );
    return res.rows[0];
};

/**
 * Bulk upsert topic states — used during onboarding when user rates all topics.
 * Expects: states = [{ topic_id, confidence, status }, ...]
 */
const bulkUpsertTopicStates = async (userId, states) => {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        const results = [];
        for (const s of states) {
            const res = await client.query(
                `INSERT INTO user_topic_states (user_id, topic_id, confidence, status)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, topic_id) DO UPDATE SET
                    confidence = COALESCE($3, user_topic_states.confidence),
                    status = COALESCE($4, user_topic_states.status),
                    updated_at = NOW()
                 RETURNING *`,
                [userId, s.topic_id, s.confidence ?? 0, s.status ?? 'NOT_STARTED']
            );
            results.push(res.rows[0]);
        }

        await client.query('COMMIT');
        return results;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Get topic states for a specific subject.
 */
const getTopicStatesBySubject = async (userId, subjectId) => {
    const res = await pool.query(
        `SELECT uts.id, uts.topic_id, uts.confidence, uts.status,
                uts.last_studied_at, uts.total_time_spent_minutes,
                et.name as topic_name, et.difficulty_level, et.weightage,
                et.estimated_hours, et.prerequisites
         FROM exam_topics et
         LEFT JOIN user_topic_states uts ON uts.topic_id = et.id AND uts.user_id = $1
         WHERE et.subject_id = $2
         ORDER BY et.sort_order ASC`,
        [userId, subjectId]
    );
    return res.rows;
};

// ═══════════════════════════════════════════════════
// Enrollment Onboarding Updates
// ═══════════════════════════════════════════════════

/**
 * Update enrollment with onboarding data (daily hours, completion flag).
 */
const updateEnrollmentOnboarding = async (userId, examId, data) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.daily_available_hours !== undefined) {
        fields.push(`daily_available_hours = $${idx++}`);
        values.push(data.daily_available_hours);
    }
    if (data.onboarding_completed !== undefined) {
        fields.push(`onboarding_completed = $${idx++}`);
        values.push(data.onboarding_completed);
    }

    if (fields.length === 0) return null;

    values.push(userId, examId);
    const res = await pool.query(
        `UPDATE user_enrollments SET ${fields.join(', ')}
         WHERE user_id = $${idx++} AND exam_id = $${idx}
         RETURNING *`,
        values
    );
    return res.rows[0];
};

/**
 * Get enrollment details for a user + exam.
 */
const getEnrollment = async (userId, examId) => {
    const res = await pool.query(
        `SELECT * FROM user_enrollments WHERE user_id = $1 AND exam_id = $2`,
        [userId, examId]
    );
    return res.rows[0] || null;
};

module.exports = {
    getUserTopicStates,
    upsertTopicState,
    bulkUpsertTopicStates,
    getTopicStatesBySubject,
    updateEnrollmentOnboarding,
    getEnrollment,
};
