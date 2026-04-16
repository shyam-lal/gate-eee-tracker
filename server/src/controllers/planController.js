const planService = require('../services/planService');
const taskService = require('../services/taskService');
const pool = require('../config/db');

// ═══════════════════════════════════════════════════
// Daily Battle Plan Controller
// ═══════════════════════════════════════════════════

/**
 * GET /plan/today
 * Returns the Daily Battle Plan — frontend-ready, zero computation needed.
 */
const getTodayPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const plan = await planService.generateDailyPlan(userId);
        res.json(formatBattlePlanResponse(plan));
    } catch (err) {
        console.error('Error generating daily plan:', err);
        if (err.message.includes('No active enrollment') || err.message.includes('No topics')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to generate daily plan' });
    }
};

/**
 * POST /plan/task/start
 * Body: { task_id }
 */
const startTask = async (req, res) => {
    try {
        const { task_id } = req.body;
        if (!task_id) return res.status(400).json({ error: 'task_id is required' });

        const result = await taskService.startTask(req.user.id, task_id);

        // Return updated full plan for consistency
        const plan = await planService.getTodayPlanRaw(req.user.id);
        res.json({
            ...formatBattlePlanResponse(plan),
            action: 'task_started',
            started_task: result.task,
        });
    } catch (err) {
        console.error('Error starting task:', err);
        if (err.message.includes('not found') || err.message.includes('already') || err.message.includes('skipped')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to start task' });
    }
};

/**
 * POST /plan/task/complete
 * Body: { task_id, actual_duration_minutes }
 */
const completeTaskHandler = async (req, res) => {
    try {
        const { task_id, actual_duration_minutes } = req.body;
        if (!task_id) return res.status(400).json({ error: 'task_id is required' });

        const result = await taskService.completeTask(
            req.user.id,
            task_id,
            parseInt(actual_duration_minutes) || 0
        );

        // Return updated full plan
        const plan = await planService.getTodayPlanRaw(req.user.id);

        const response = {
            ...formatBattlePlanResponse(plan),
            action: 'task_completed',
            completed_task: result.completed_task,
            next_task: result.next_task,
            topic_state: result.topic_state,
        };

        // If all done, add congratulations
        if (result.all_done) {
            response.message = "🎯 You're done for today! Great work.";
        }

        res.json(response);
    } catch (err) {
        console.error('Error completing task:', err);
        if (err.message.includes('not found') || err.message.includes('already')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to complete task' });
    }
};

/**
 * POST /plan/task/skip
 * Body: { task_id }
 */
const skipTask = async (req, res) => {
    try {
        const { task_id } = req.body;
        if (!task_id) return res.status(400).json({ error: 'task_id is required' });

        const result = await taskService.skipTask(req.user.id, task_id);

        // Return updated full plan
        const plan = await planService.getTodayPlanRaw(req.user.id);
        res.json({
            ...formatBattlePlanResponse(plan),
            action: 'task_skipped',
            skipped_task: result.skipped_task,
            next_task: result.next_task,
        });
    } catch (err) {
        console.error('Error skipping task:', err);
        if (err.message.includes('not found') || err.message.includes('Cannot skip')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to skip task' });
    }
};

/**
 * POST /plan/regenerate
 * Force regenerate today's plan.
 */
const regeneratePlan = async (req, res) => {
    try {
        const plan = await planService.regeneratePlan(req.user.id);
        res.json({
            ...formatBattlePlanResponse(plan),
            action: 'plan_regenerated',
            message: 'Plan regenerated successfully',
        });
    } catch (err) {
        console.error('Error regenerating plan:', err);
        if (err.message.includes('No active enrollment')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to regenerate plan' });
    }
};

/**
 * GET /plan/date/:date
 */
const getPlanByDate = async (req, res) => {
    try {
        const plan = await planService.getPlanByDate(req.user.id, req.params.date);
        if (!plan) return res.status(404).json({ error: 'No plan found for this date' });
        res.json(formatBattlePlanResponse(plan));
    } catch (err) {
        console.error('Error fetching plan:', err);
        res.status(500).json({ error: 'Failed to fetch plan' });
    }
};

/**
 * GET /plan/history?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
const getPlanHistory = async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'start and end query params required' });

        const plans = await planService.getPlanHistory(req.user.id, start, end);

        const history = plans.map(p => {
            const taskData = parseTasks(p.tasks);
            const completedCount = taskData.tasks.filter(t => t.status === 'COMPLETED').length;
            const skippedCount = taskData.tasks.filter(t => t.status === 'SKIPPED').length;
            const planDate = p.plan_date instanceof Date ? p.plan_date.toISOString().split('T')[0] : p.plan_date;

            return {
                date: planDate,
                status: p.status || 'NOT_STARTED',
                total_minutes: p.total_minutes,
                completed_minutes: p.total_completed_minutes || 0,
                total_tasks: taskData.tasks.length,
                completed_tasks: completedCount,
                skipped_tasks: skippedCount,
                progress_percent: taskData.tasks.length > 0
                    ? Math.round((completedCount / taskData.tasks.length) * 100) : 0,
                streak: p.streak || 0,
            };
        });

        res.json({ history, count: history.length });
    } catch (err) {
        console.error('Error fetching plan history:', err);
        res.status(500).json({ error: 'Failed to fetch plan history' });
    }
};


// ═══════════════════════════════════════════════════
// Response Formatter
// ═══════════════════════════════════════════════════

/**
 * Transform raw DB plan into the Daily Battle Plan frontend contract.
 * Frontend should NEVER compute anything — this response is final.
 */
function formatBattlePlanResponse(plan) {
    const taskData = parseTasks(plan.tasks);
    const tasks = taskData.tasks;
    const metadata = taskData.metadata;
    const planDate = plan.plan_date instanceof Date
        ? plan.plan_date.toISOString().split('T')[0] : plan.plan_date;

    // Find current active task
    const activeTask = tasks.find(t => t.status === 'ACTIVE') || null;

    // Counts
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
    const pendingTasks = tasks.filter(t => t.status === 'PENDING');
    const skippedTasks = tasks.filter(t => t.status === 'SKIPPED');

    const completedMinutes = plan.total_completed_minutes || 0;
    const totalMinutes = plan.total_minutes || tasks.reduce((s, t) => s + t.duration_minutes, 0);

    return {
        date: planDate,
        plan_id: plan.id,
        status: plan.status || 'NOT_STARTED',

        summary: {
            total_minutes: totalMinutes,
            total_hours: Math.round((totalMinutes / 60) * 10) / 10,
            completed_minutes: completedMinutes,
            remaining_minutes: Math.max(0, totalMinutes - completedMinutes),
            progress_percent: totalMinutes > 0
                ? Math.round((completedMinutes / totalMinutes) * 100) : 0,
            completed_count: completedTasks.length,
            pending_count: pendingTasks.length,
            skipped_count: skippedTasks.length,
            total_count: tasks.length,
            streak: plan.streak || 0,
        },

        current_task: activeTask ? {
            id: activeTask.id,
            type: activeTask.type,
            topic_id: activeTask.topic_id,
            topic_name: activeTask.topic_name,
            subject_name: activeTask.subject_name,
            duration_minutes: activeTask.duration_minutes,
            order_index: activeTask.order_index,
        } : null,

        tasks: tasks.map(t => ({
            id: t.id,
            order_index: t.order_index,
            type: t.type,
            topic_id: t.topic_id,
            topic_name: t.topic_name,
            subject_name: t.subject_name,
            duration_minutes: t.duration_minutes,
            status: t.status,
            difficulty_level: t.difficulty_level,
            carryover: t.carryover || false,
        })),

        breakdown: {
            learn: {
                total: tasks.filter(t => t.type === 'LEARN').length,
                completed: completedTasks.filter(t => t.type === 'LEARN').length,
                minutes: plan.learn_minutes || 0,
            },
            revise: {
                total: tasks.filter(t => t.type === 'REVISE').length,
                completed: completedTasks.filter(t => t.type === 'REVISE').length,
                minutes: plan.revise_minutes || 0,
            },
        },

        adjustments: metadata.adjustments || null,
        safeguards: metadata.safeguards || null,
    };
}

function parseTasks(raw) {
    if (Array.isArray(raw)) return { tasks: raw, metadata: {} };
    return { tasks: raw.tasks || [], metadata: raw.metadata || {} };
}

module.exports = {
    getTodayPlan,
    startTask,
    completeTask: completeTaskHandler,
    skipTask,
    regeneratePlan,
    getPlanByDate,
    getPlanHistory,
};
