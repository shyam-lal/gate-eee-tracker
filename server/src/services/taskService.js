const pool = require('../config/db');

// ═══════════════════════════════════════════════════
// Task Execution Tracking
// ═══════════════════════════════════════════════════

/**
 * POST /task/complete
 * Marks a task as completed and updates the user's topic state.
 *
 * Steps:
 * 1. Insert task log
 * 2. Update user_topic_states: confidence += 0.2 (cap 5), last_studied_at, time_spent
 * 3. Auto-promote status if confidence crosses thresholds
 */
const completeTask = async (userId, { topic_id, task_type, planned_duration, actual_duration }) => {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insert task log
        const logRes = await client.query(
            `INSERT INTO user_task_logs (user_id, topic_id, task_type, planned_duration, actual_duration, completed)
             VALUES ($1, $2, $3, $4, $5, TRUE)
             RETURNING *`,
            [userId, topic_id, task_type, planned_duration || 0, actual_duration || 0]
        );

        // 2. Update user_topic_states
        //    - confidence += 0.2, capped at 5
        //    - total_time_spent_minutes += actual_duration
        //    - last_studied_at = NOW()
        //    - auto-promote status based on new confidence
        const stateRes = await client.query(
            `INSERT INTO user_topic_states (user_id, topic_id, confidence, status, last_studied_at, total_time_spent_minutes)
             VALUES ($1, $2, 1, 'LEARNING', NOW(), $3)
             ON CONFLICT (user_id, topic_id) DO UPDATE SET
                confidence = LEAST(5, user_topic_states.confidence + 1),
                total_time_spent_minutes = user_topic_states.total_time_spent_minutes + $3,
                last_studied_at = NOW(),
                updated_at = NOW()
             RETURNING *`,
            [userId, topic_id, actual_duration || 0]
        );

        const state = stateRes.rows[0];

        // 3. Auto-promote status based on new confidence
        const newStatus = deriveStatus(state.confidence);
        if (newStatus !== state.status) {
            await client.query(
                `UPDATE user_topic_states SET status = $1, updated_at = NOW()
                 WHERE id = $2`,
                [newStatus, state.id]
            );
            state.status = newStatus;
        }

        await client.query('COMMIT');

        return {
            task_log: logRes.rows[0],
            topic_state: state,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Get task logs for a specific date.
 */
const getTaskLogsByDate = async (userId, date) => {
    const res = await pool.query(
        `SELECT utl.*, et.name as topic_name, es.name as subject_name
         FROM user_task_logs utl
         JOIN exam_topics et ON et.id = utl.topic_id
         JOIN exam_subjects es ON es.id = et.subject_id
         WHERE utl.user_id = $1 AND utl.plan_date = $2
         ORDER BY utl.created_at ASC`,
        [userId, date]
    );
    return res.rows;
};

/**
 * Get task log summary for a date range.
 */
const getTaskLogSummary = async (userId, startDate, endDate) => {
    const res = await pool.query(
        `SELECT
            plan_date,
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
            SUM(actual_duration) as total_actual_minutes,
            SUM(planned_duration) as total_planned_minutes
         FROM user_task_logs
         WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3
         GROUP BY plan_date
         ORDER BY plan_date DESC`,
        [userId, startDate, endDate]
    );
    return res.rows;
};

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

/**
 * Derive status from confidence level.
 * 0-1 → NOT_STARTED
 * 2-3 → LEARNING
 * 4   → REVISING
 * 5   → MASTERED
 */
function deriveStatus(confidence) {
    const c = parseInt(confidence);
    if (c <= 1) return 'NOT_STARTED';
    if (c <= 3) return 'LEARNING';
    if (c === 4) return 'REVISING';
    return 'MASTERED';
}

module.exports = {
    completeTask,
    getTaskLogsByDate,
    getTaskLogSummary,
};
