const plannerService = require('../services/plannerService');

const getDailyNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const dateStr = req.params.date; // e.g. '2024-03-25'
        const noteType = req.query.type || 'daily';
        let note = await plannerService.getNote(userId, dateStr, noteType);
        if (!note) {
            note = { content: '', isNew: true };
        }
        res.status(200).json(note);
    } catch (error) {
        console.error('Error fetching planner note:', error);
        res.status(500).json({ error: 'Internal server error fetching planner note' });
    }
};

const saveDailyNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const dateStr = req.params.date;
        const { content, type } = req.body;
        const noteType = type || 'daily';

        const updatedNote = await plannerService.saveNote(userId, dateStr, content, noteType);
        res.status(200).json(updatedNote);
    } catch (error) {
        console.error('Error saving planner note:', error);
        res.status(500).json({ error: 'Internal server error saving planner note' });
    }
};

const getNoteIndicators = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end, type } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'Must provide start and end dates' });

        const noteType = type || 'daily';
        const dates = await plannerService.getNoteIndicators(userId, start, end, noteType);
        res.status(200).json({ dates });
    } catch (error) {
        console.error('Error fetching note indicators:', error);
        res.status(500).json({ error: 'Internal server error fetching indicators' });
    }
};

const getWeeklyGoals = async (req, res) => {
    try {
        const userId = req.user.id;
        // Accept either exact weekStart (legacy) or a range for the new Timeline UI.
        const { start, end, weekStart } = req.query;

        let startDate, endDate;
        if (start && end) {
            startDate = start;
            endDate = end;
        } else if (weekStart) {
            // Fallback for single week fetch
            startDate = weekStart;
            endDate = weekStart; // The query uses <= so this is fine for exact matches
        } else {
            return res.status(400).json({ error: 'Must provide start and end dates or weekStart' });
        }

        const goals = await plannerService.getGoalsByDateRange(userId, startDate, endDate);
        res.status(200).json(goals);
    } catch (error) {
        console.error('Error fetching weekly goals:', error);
        res.status(500).json({ error: 'Internal server error fetching weekly goals' });
    }
};

const createWeeklyGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { week_start_date, title, linked_subject_id } = req.body;

        if (!week_start_date || !title) {
            return res.status(400).json({ error: 'week_start_date and title are required' });
        }

        const goal = await plannerService.createWeeklyGoal(userId, week_start_date, title, linked_subject_id);
        res.status(201).json(goal);
    } catch (error) {
        console.error('Error creating weekly goal:', error);
        res.status(500).json({ error: 'Internal server error creating weekly goal' });
    }
};

const updateGoalStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const goalId = req.params.id;
        const { status } = req.body;

        if (!['todo', 'in_progress', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const goal = await plannerService.updateWeeklyGoalStatus(goalId, userId, status);
        res.status(200).json(goal);
    } catch (error) {
        console.error('Error updating goal status:', error);
        if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
        res.status(500).json({ error: 'Internal server error updating focus goal' });
    }
};

const deleteGoal = async (req, res) => {
    try {
        const userId = req.user.id;
        const goalId = req.params.id;
        await plannerService.deleteWeeklyGoal(goalId, userId);
        res.status(200).json({ message: 'Goal deleted' });
    } catch (error) {
        console.error('Error deleting weekly goal:', error);
        if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
        res.status(500).json({ error: 'Internal server error deleting goal' });
    }
};

module.exports = {
    getDailyNote,
    saveDailyNote,
    getNoteIndicators,
    getWeeklyGoals,
    createWeeklyGoal,
    updateGoalStatus,
    deleteGoal
};
