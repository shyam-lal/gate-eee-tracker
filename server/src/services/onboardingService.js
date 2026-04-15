const pool = require('../config/db');

// ═══════════════════════════════════════════════════
// Onboarding Steps (derived from data state)
// ═══════════════════════════════════════════════════
// SELECT_EXAM  → no enrollment exists
// SET_GOAL     → enrollment exists, but goal not set
// ASSESSMENT   → goal set, but not all subjects assessed
// COMPLETE     → all assessed, but not marked complete
// DONE         → onboarding_completed = true

const STEPS = ['SELECT_EXAM', 'SET_GOAL', 'ASSESSMENT', 'COMPLETE', 'DONE'];

/**
 * GET /onboarding/status
 * Derives the current onboarding step from data state.
 */
const getOnboardingStatus = async (userId) => {
    // 1. Check for active enrollment
    const enrollmentRes = await pool.query(
        `SELECT ue.*, e.name as exam_name, e.slug as exam_slug
         FROM user_enrollments ue
         JOIN exams e ON e.id = ue.exam_id
         WHERE ue.user_id = $1 AND ue.is_active = TRUE
         ORDER BY ue.enrolled_at DESC
         LIMIT 1`,
        [userId]
    );

    if (!enrollmentRes.rows.length) {
        return {
            is_complete: false,
            current_step: 'SELECT_EXAM',
            step_index: 0,
            total_steps: STEPS.length - 1,
            enrollment: null,
        };
    }

    const enrollment = enrollmentRes.rows[0];

    // Already completed
    if (enrollment.onboarding_completed) {
        return {
            is_complete: true,
            current_step: 'DONE',
            step_index: 4,
            total_steps: STEPS.length - 1,
            enrollment,
        };
    }

    // 2. Check if goal is set
    if (!enrollment.target_date || !enrollment.daily_available_hours) {
        return {
            is_complete: false,
            current_step: 'SET_GOAL',
            step_index: 1,
            total_steps: STEPS.length - 1,
            enrollment,
        };
    }

    // 3. Check assessment progress — how many subjects have been assessed
    const assessmentRes = await pool.query(
        `SELECT es.id as subject_id, es.name as subject_name,
                COUNT(uts.id) as assessed_topics,
                COUNT(et.id) as total_topics
         FROM exam_subjects es
         JOIN exam_topics et ON et.subject_id = es.id
         LEFT JOIN user_topic_states uts ON uts.topic_id = et.id AND uts.user_id = $1
         WHERE es.exam_id = $2
         GROUP BY es.id, es.name
         ORDER BY es.sort_order ASC`,
        [userId, enrollment.exam_id]
    );

    const subjects = assessmentRes.rows;
    const assessedSubjects = subjects.filter(s => parseInt(s.assessed_topics) > 0);
    const allAssessed = subjects.every(s => parseInt(s.assessed_topics) === parseInt(s.total_topics));

    if (!allAssessed) {
        return {
            is_complete: false,
            current_step: 'ASSESSMENT',
            step_index: 2,
            total_steps: STEPS.length - 1,
            enrollment,
            assessment_progress: {
                total_subjects: subjects.length,
                assessed_subjects: assessedSubjects.length,
                subjects: subjects.map(s => ({
                    subject_id: s.subject_id,
                    subject_name: s.subject_name,
                    assessed: parseInt(s.assessed_topics) > 0,
                    assessed_topics: parseInt(s.assessed_topics),
                    total_topics: parseInt(s.total_topics),
                })),
            },
        };
    }

    // All assessed but not completed
    return {
        is_complete: false,
        current_step: 'COMPLETE',
        step_index: 3,
        total_steps: STEPS.length - 1,
        enrollment,
    };
};

/**
 * POST /onboarding/start
 * Creates or reactivates a UserExam (user_enrollments) record.
 * Idempotent: ON CONFLICT re-activates.
 */
const startOnboarding = async (userId, examId) => {
    // Verify exam exists
    const examRes = await pool.query('SELECT id, name FROM exams WHERE id = $1 AND is_active = TRUE', [examId]);
    if (!examRes.rows.length) {
        throw new Error('Exam not found or inactive');
    }

    // Upsert enrollment
    const res = await pool.query(
        `INSERT INTO user_enrollments (user_id, exam_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, exam_id) DO UPDATE SET
            is_active = TRUE,
            onboarding_completed = FALSE
         RETURNING *`,
        [userId, examId]
    );

    // Set as user's active exam
    await pool.query(
        'UPDATE users SET active_exam_id = $1 WHERE id = $2',
        [examId, userId]
    );

    return res.rows[0];
};

/**
 * POST /onboarding/goal
 * Saves target_date and daily_available_hours to the active enrollment.
 * Idempotent: just overwrites.
 */
const saveGoal = async (userId, { target_date, daily_available_hours }) => {
    const res = await pool.query(
        `UPDATE user_enrollments SET
            target_date = $1,
            daily_available_hours = $2
         WHERE user_id = $3 AND is_active = TRUE
         RETURNING *`,
        [target_date, daily_available_hours, userId]
    );

    if (!res.rows.length) {
        throw new Error('No active enrollment found. Start onboarding first.');
    }

    return res.rows[0];
};

/**
 * POST /onboarding/assessment
 * Maps subject-level confidence → all topics under that subject.
 * Initializes UserTopicState for each topic.
 * Idempotent: uses ON CONFLICT to update existing states.
 */
const saveSubjectAssessment = async (userId, { subject_id, confidence }) => {
    // 1. Validate confidence range
    if (confidence < 0 || confidence > 5) {
        throw new Error('Confidence must be between 0 and 5');
    }

    // 2. Get all topics under this subject
    const topicsRes = await pool.query(
        'SELECT id, name FROM exam_topics WHERE subject_id = $1 ORDER BY sort_order ASC',
        [subject_id]
    );

    if (!topicsRes.rows.length) {
        throw new Error('No topics found for this subject');
    }

    // 3. Determine status from confidence
    const status = mapConfidenceToStatus(confidence);

    // 4. Bulk upsert topic states
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        const results = [];
        for (const topic of topicsRes.rows) {
            const res = await client.query(
                `INSERT INTO user_topic_states (user_id, topic_id, confidence, status)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, topic_id) DO UPDATE SET
                    confidence = $3,
                    status = $4,
                    updated_at = NOW()
                 RETURNING *`,
                [userId, topic.id, confidence, status]
            );
            results.push(res.rows[0]);
        }

        await client.query('COMMIT');
        return {
            subject_id,
            confidence,
            status,
            topics_initialized: results.length,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * POST /onboarding/complete
 * Marks onboarding as completed. Also sets global flag on users table.
 */
const completeOnboarding = async (userId) => {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        // Mark enrollment
        const res = await client.query(
            `UPDATE user_enrollments SET onboarding_completed = TRUE
             WHERE user_id = $1 AND is_active = TRUE
             RETURNING *`,
            [userId]
        );

        if (!res.rows.length) {
            throw new Error('No active enrollment found');
        }

        // Also set global onboarding flag on users table
        await client.query(
            'UPDATE users SET onboarding_completed = TRUE WHERE id = $1',
            [userId]
        );

        await client.query('COMMIT');
        return res.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

/**
 * Maps confidence (0-5) → initial topic status.
 * 0-1 = NOT_STARTED (needs to learn from scratch)
 * 2-3 = LEARNING    (some familiarity, still learning)
 * 4   = REVISING    (knows the material, needs revision)
 * 5   = MASTERED    (fully confident)
 */
function mapConfidenceToStatus(confidence) {
    if (confidence <= 1) return 'NOT_STARTED';
    if (confidence <= 3) return 'LEARNING';
    if (confidence === 4) return 'REVISING';
    return 'MASTERED';
}

module.exports = {
    getOnboardingStatus,
    startOnboarding,
    saveGoal,
    saveSubjectAssessment,
    completeOnboarding,
};
