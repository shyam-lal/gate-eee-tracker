const taskService = require('../services/taskService');

/**
 * POST /task/complete
 * Body: { topic_id, task_type, planned_duration, actual_duration }
 */
const completeTask = async (req, res) => {
    try {
        const { topic_id, task_type, planned_duration, actual_duration } = req.body;

        if (!topic_id || !task_type) {
            return res.status(400).json({ error: 'topic_id and task_type are required' });
        }

        if (!['LEARN', 'REVISE'].includes(task_type)) {
            return res.status(400).json({ error: 'task_type must be LEARN or REVISE' });
        }

        const result = await taskService.completeTask(req.user.id, {
            topic_id: parseInt(topic_id),
            task_type,
            planned_duration: parseInt(planned_duration) || 0,
            actual_duration: parseInt(actual_duration) || 0,
        });

        res.json(result);
    } catch (err) {
        console.error('Error completing task:', err);
        res.status(500).json({ error: 'Failed to complete task' });
    }
};

/**
 * GET /task/logs/:date
 * Get task logs for a specific date.
 */
const getLogsByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const logs = await taskService.getTaskLogsByDate(req.user.id, date);
        res.json({ logs, count: logs.length });
    } catch (err) {
        console.error('Error fetching task logs:', err);
        res.status(500).json({ error: 'Failed to fetch task logs' });
    }
};

/**
 * GET /task/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Get task log summary for a date range.
 */
const getSummary = async (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'start and end query params required' });
        }

        const summary = await taskService.getTaskLogSummary(req.user.id, start, end);
        res.json({ summary });
    } catch (err) {
        console.error('Error fetching task summary:', err);
        res.status(500).json({ error: 'Failed to fetch task summary' });
    }
};

module.exports = {
    completeTask,
    getLogsByDate,
    getSummary,
};
