const pool = require('../config/db');
const planService = require('./planService');

// ═══════════════════════════════════════════════════
// Task Lifecycle — Daily Battle Plan
// ═══════════════════════════════════════════════════
// PENDING → ACTIVE → COMPLETED | SKIPPED
// Only ONE task can be ACTIVE at a time.
// All operations mutate the plan's JSONB in a single transaction.
// ═══════════════════════════════════════════════════

/**
 * Start a task: set it to ACTIVE, all others to PENDING.
 */
const startTask = async (userId, taskId) => {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        const plan = await planService.getTodayPlanRaw(userId);
        if (!plan) throw new Error('No plan found for today. Generate one first.');

        const taskData = parsePlanTasks(plan.tasks);
        const task = taskData.tasks.find(t => t.id === taskId);
        if (!task) throw new Error('Task not found in today\'s plan');
        if (task.status === 'COMPLETED') throw new Error('Task is already completed');
        if (task.status === 'SKIPPED') throw new Error('Task was skipped');

        // Reset all to PENDING, set target to ACTIVE
        for (const t of taskData.tasks) {
            if (t.status === 'ACTIVE') t.status = 'PENDING';
        }
        task.status = 'ACTIVE';

        // Update plan status to IN_PROGRESS
        const updates = {};
        if (plan.status === 'NOT_STARTED') {
            updates.status = 'IN_PROGRESS';
        }

        await planService.updatePlanTasks(plan.id, taskData, updates);

        // Log the start
        await client.query(
            `INSERT INTO user_task_logs (user_id, topic_id, task_type, task_id, planned_duration, started_at, plan_date)
             VALUES ($1, $2, $3, $4, $5, NOW(), CURRENT_DATE)
             ON CONFLICT DO NOTHING`,
            [userId, task.topic_id, task.type, task.id, task.duration_minutes]
        );

        await client.query('COMMIT');
        return { task, plan_status: updates.status || plan.status };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Complete a task: mark COMPLETED, update topic state, auto-activate next.
 */
const completeTask = async (userId, taskId, actualDuration) => {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        const plan = await planService.getTodayPlanRaw(userId);
        if (!plan) throw new Error('No plan found for today');

        const taskData = parsePlanTasks(plan.tasks);
        const task = taskData.tasks.find(t => t.id === taskId);
        if (!task) throw new Error('Task not found in today\'s plan');
        if (task.status === 'COMPLETED') throw new Error('Task is already completed');

        // Mark COMPLETED
        task.status = 'COMPLETED';

        // Auto-activate next PENDING task (by order_index)
        const nextTask = taskData.tasks
            .filter(t => t.status === 'PENDING')
            .sort((a, b) => a.order_index - b.order_index)[0];

        if (nextTask) {
            nextTask.status = 'ACTIVE';
        }

        // Calculate completed minutes
        const duration = actualDuration || task.duration_minutes;
        const completedMinutes = taskData.tasks
            .filter(t => t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.duration_minutes, 0);

        // Check if all tasks done
        const allDone = taskData.tasks.every(t => t.status === 'COMPLETED' || t.status === 'SKIPPED');
        const planStatus = allDone ? 'COMPLETED' : 'IN_PROGRESS';

        // Update plan
        await planService.updatePlanTasks(plan.id, taskData, {
            total_completed_minutes: completedMinutes,
            status: planStatus,
        });

        // Update user_topic_states: confidence +1 (cap 5), time_spent, last_studied_at
        const stateRes = await client.query(
            `INSERT INTO user_topic_states (user_id, topic_id, confidence, status, last_studied_at, total_time_spent_minutes)
             VALUES ($1, $2, 1, 'LEARNING', NOW(), $3)
             ON CONFLICT (user_id, topic_id) DO UPDATE SET
                confidence = LEAST(5, user_topic_states.confidence + 1),
                total_time_spent_minutes = user_topic_states.total_time_spent_minutes + $3,
                last_studied_at = NOW(),
                updated_at = NOW()
             RETURNING *`,
            [userId, task.topic_id, duration]
        );

        const topicState = stateRes.rows[0];

        // Auto-promote topic status
        const newStatus = deriveTopicStatus(topicState.confidence);
        if (newStatus !== topicState.status) {
            await client.query(
                `UPDATE user_topic_states SET status = $1, updated_at = NOW() WHERE id = $2`,
                [newStatus, topicState.id]
            );
            topicState.status = newStatus;
        }

        // Log completion
        await client.query(
            `INSERT INTO user_task_logs (user_id, topic_id, task_type, task_id, planned_duration, actual_duration, completed, completed_at, plan_date)
             VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), CURRENT_DATE)`,
            [userId, task.topic_id, task.type, task.id, task.duration_minutes, duration]
        );

        await client.query('COMMIT');

        return {
            completed_task: task,
            next_task: nextTask || null,
            topic_state: topicState,
            plan_status: planStatus,
            all_done: allDone,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Skip a task: mark SKIPPED, auto-activate next.
 * Skipped topics get carryover boost in tomorrow's plan.
 */
const skipTask = async (userId, taskId) => {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        const plan = await planService.getTodayPlanRaw(userId);
        if (!plan) throw new Error('No plan found for today');

        const taskData = parsePlanTasks(plan.tasks);
        const task = taskData.tasks.find(t => t.id === taskId);
        if (!task) throw new Error('Task not found in today\'s plan');
        if (task.status === 'COMPLETED') throw new Error('Cannot skip a completed task');

        // Mark SKIPPED
        task.status = 'SKIPPED';

        // Auto-activate next PENDING task
        const nextTask = taskData.tasks
            .filter(t => t.status === 'PENDING')
            .sort((a, b) => a.order_index - b.order_index)[0];

        if (nextTask) {
            nextTask.status = 'ACTIVE';
        }

        // Check if all tasks done/skipped
        const allDone = taskData.tasks.every(t => t.status === 'COMPLETED' || t.status === 'SKIPPED');
        const completedMinutes = taskData.tasks
            .filter(t => t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.duration_minutes, 0);

        const planStatus = allDone ? 'COMPLETED' : plan.status;

        await planService.updatePlanTasks(plan.id, taskData, {
            total_completed_minutes: completedMinutes,
            status: planStatus,
        });

        // Log skip
        await client.query(
            `INSERT INTO user_task_logs (user_id, topic_id, task_type, task_id, planned_duration, skipped, plan_date)
             VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_DATE)`,
            [userId, task.topic_id, task.type, task.id, task.duration_minutes]
        );

        await client.query('COMMIT');

        return {
            skipped_task: task,
            next_task: nextTask || null,
            plan_status: planStatus,
            all_done: allDone,
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
        `SELECT plan_date,
                COUNT(*) as total_tasks,
                COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
                COUNT(*) FILTER (WHERE skipped = TRUE) as skipped_tasks,
                SUM(actual_duration) as total_actual_minutes,
                SUM(planned_duration) as total_planned_minutes
         FROM user_task_logs
         WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3
         GROUP BY plan_date ORDER BY plan_date DESC`,
        [userId, startDate, endDate]
    );
    return res.rows;
};

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

function parsePlanTasks(raw) {
    if (Array.isArray(raw)) return { tasks: raw, metadata: {} };
    return { tasks: raw.tasks || [], metadata: raw.metadata || {} };
}

function deriveTopicStatus(confidence) {
    const c = parseInt(confidence);
    if (c <= 1) return 'NOT_STARTED';
    if (c <= 3) return 'LEARNING';
    if (c === 4) return 'REVISING';
    return 'MASTERED';
}

module.exports = {
    startTask,
    completeTask,
    skipTask,
    getTaskLogsByDate,
    getTaskLogSummary,
};
