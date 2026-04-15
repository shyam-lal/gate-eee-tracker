const planService = require('../services/planService');
const pool = require('../config/db');

/**
 * GET /plan/today
 * Returns today's plan formatted for direct frontend consumption.
 * Frontend should NOT compute anything — all summaries are pre-computed.
 */
const getTodayPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const plan = await planService.generateDailyPlan(userId);
        const today = new Date().toISOString().split('T')[0];

        // Parse tasks from DB (handles both raw array and { tasks, metadata } shape)
        const rawTasks = plan.tasks;
        const taskList = Array.isArray(rawTasks) ? rawTasks : (rawTasks.tasks || []);
        const metadata = Array.isArray(rawTasks) ? {} : (rawTasks.metadata || {});

        // Fetch today's completion logs to compute progress
        const logsRes = await pool.query(
            `SELECT topic_id, task_type, actual_duration
             FROM user_task_logs
             WHERE user_id = $1 AND plan_date = $2 AND completed = TRUE`,
            [userId, today]
        );

        const completedSet = new Set(
            logsRes.rows.map(l => `${l.topic_id}-${l.task_type}`)
        );
        const totalActualMinutes = logsRes.rows.reduce((s, l) => s + (l.actual_duration || 0), 0);

        // Build frontend-ready tasks with completion status
        const tasks = taskList.map((t, idx) => ({
            id: `${plan.id}-${idx}`,
            type: t.type,
            topic_id: t.topic_id,
            topic_name: t.topic_name,
            subject_name: t.subject_name,
            duration: t.duration_minutes,
            priority_score: t.priority_score,
            carryover: t.carryover || false,
            completed: completedSet.has(`${t.topic_id}-${t.type}`),
        }));

        const completedTasks = tasks.filter(t => t.completed);
        const pendingTasks = tasks.filter(t => !t.completed);
        const totalPlannedMinutes = tasks.reduce((s, t) => s + t.duration, 0);

        res.json({
            date: today,
            plan_id: plan.id,
            total_hours: Math.round((totalPlannedMinutes / 60) * 10) / 10,
            total_minutes: totalPlannedMinutes,

            tasks,

            progress: {
                completed_count: completedTasks.length,
                pending_count: pendingTasks.length,
                total_count: tasks.length,
                completion_percentage: tasks.length > 0
                    ? Math.round((completedTasks.length / tasks.length) * 100)
                    : 0,
                completed_minutes: totalActualMinutes,
                remaining_minutes: Math.max(0, totalPlannedMinutes - totalActualMinutes),
            },

            breakdown: {
                learn: {
                    total: tasks.filter(t => t.type === 'LEARN').length,
                    completed: completedTasks.filter(t => t.type === 'LEARN').length,
                    minutes: plan.learn_minutes,
                },
                revise: {
                    total: tasks.filter(t => t.type === 'REVISE').length,
                    completed: completedTasks.filter(t => t.type === 'REVISE').length,
                    minutes: plan.revise_minutes,
                },
            },

            adjustments: metadata.adjustments || null,
        });
    } catch (err) {
        console.error('Error generating daily plan:', err);
        if (err.message.includes('No active enrollment') || err.message.includes('No topics')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to generate daily plan' });
    }
};

/**
 * GET /plan/date/:date
 * Returns plan for a specific date, same frontend-ready shape.
 */
const getPlanByDate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.params;
        const plan = await planService.getPlanByDate(userId, date);

        if (!plan) {
            return res.status(404).json({ error: 'No plan found for this date' });
        }

        const rawTasks = plan.tasks;
        const taskList = Array.isArray(rawTasks) ? rawTasks : (rawTasks.tasks || []);

        // Fetch logs for that date
        const logsRes = await pool.query(
            `SELECT topic_id, task_type, actual_duration
             FROM user_task_logs
             WHERE user_id = $1 AND plan_date = $2 AND completed = TRUE`,
            [userId, date]
        );

        const completedSet = new Set(
            logsRes.rows.map(l => `${l.topic_id}-${l.task_type}`)
        );
        const totalActualMinutes = logsRes.rows.reduce((s, l) => s + (l.actual_duration || 0), 0);

        const tasks = taskList.map((t, idx) => ({
            id: `${plan.id}-${idx}`,
            type: t.type,
            topic_id: t.topic_id,
            topic_name: t.topic_name,
            subject_name: t.subject_name,
            duration: t.duration_minutes,
            completed: completedSet.has(`${t.topic_id}-${t.type}`),
        }));

        const completedTasks = tasks.filter(t => t.completed);

        res.json({
            date,
            plan_id: plan.id,
            total_hours: Math.round((plan.total_minutes / 60) * 10) / 10,
            total_minutes: plan.total_minutes,
            tasks,
            progress: {
                completed_count: completedTasks.length,
                pending_count: tasks.length - completedTasks.length,
                total_count: tasks.length,
                completion_percentage: tasks.length > 0
                    ? Math.round((completedTasks.length / tasks.length) * 100)
                    : 0,
                completed_minutes: totalActualMinutes,
            },
        });
    } catch (err) {
        console.error('Error fetching plan:', err);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
};

/**
 * GET /plan/history
 * Query: ?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns daily summaries, not full task lists.
 */
const getPlanHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'start and end query params required' });
        }

        const plans = await planService.getPlanHistory(userId, start, end);

        // Fetch all logs in date range for completion stats
        const logsRes = await pool.query(
            `SELECT plan_date, topic_id, task_type
             FROM user_task_logs
             WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3 AND completed = TRUE`,
            [userId, start, end]
        );

        // Group completed logs by date
        const logsByDate = {};
        for (const log of logsRes.rows) {
            const d = log.plan_date instanceof Date
                ? log.plan_date.toISOString().split('T')[0]
                : log.plan_date;
            if (!logsByDate[d]) logsByDate[d] = new Set();
            logsByDate[d].add(`${log.topic_id}-${log.task_type}`);
        }

        const history = plans.map(p => {
            const rawTasks = p.tasks;
            const taskList = Array.isArray(rawTasks) ? rawTasks : (rawTasks.tasks || []);
            const planDate = p.plan_date instanceof Date
                ? p.plan_date.toISOString().split('T')[0]
                : p.plan_date;
            const dayLogs = logsByDate[planDate] || new Set();

            const completedCount = taskList.filter(t =>
                dayLogs.has(`${t.topic_id}-${t.type}`)
            ).length;

            return {
                date: planDate,
                total_hours: Math.round((p.total_minutes / 60) * 10) / 10,
                total_tasks: taskList.length,
                completed_tasks: completedCount,
                completion_percentage: taskList.length > 0
                    ? Math.round((completedCount / taskList.length) * 100)
                    : 0,
                learn_minutes: p.learn_minutes,
                revise_minutes: p.revise_minutes,
            };
        });

        res.json({ history, count: history.length });
    } catch (err) {
        console.error('Error fetching plan history:', err);
        res.status(500).json({ error: 'Failed to fetch plan history' });
    }
};

/**
 * POST /plan/regenerate
 * Force regenerate today's plan, returns same shape as GET /today.
 */
const regeneratePlan = async (req, res) => {
    try {
        await planService.regeneratePlan(req.user.id);
        // Re-use getTodayPlan for consistent response shape
        return getTodayPlan(req, res);
    } catch (err) {
        console.error('Error regenerating plan:', err);
        if (err.message.includes('No active enrollment')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to regenerate plan' });
    }
};

module.exports = {
    getTodayPlan,
    getPlanByDate,
    getPlanHistory,
    regeneratePlan,
};
