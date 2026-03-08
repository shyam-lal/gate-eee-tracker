const focusService = require('../services/focusService');

const logSession = async (req, res) => {
    try {
        const { toolId, durationMinutes, linkedSubjectId, linkedTopicId, notes } = req.body;
        const userId = req.user.id;

        if (!toolId || !durationMinutes) {
            return res.status(400).json({ error: 'toolId and durationMinutes are required' });
        }

        const session = await focusService.logSession(
            userId, toolId, durationMinutes, linkedSubjectId, linkedTopicId, notes
        );
        res.status(201).json(session);
    } catch (error) {
        console.error('Error logging focus session:', error);
        res.status(500).json({ error: 'Internal server error while logging focus session' });
    }
};

const getSessions = async (req, res) => {
    try {
        const { toolId } = req.params;
        const sessions = await focusService.getSessions(toolId);
        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching focus sessions:', error);
        res.status(500).json({ error: 'Internal server error while fetching focus sessions' });
    }
};

const getStats = async (req, res) => {
    try {
        const { toolId } = req.params;
        const stats = await focusService.getStats(toolId);
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching focus stats:', error);
        res.status(500).json({ error: 'Internal server error while fetching stats' });
    }
};

const getTaggableItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await focusService.getTaggableItems(userId);
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching taggable items:', error);
        res.status(500).json({ error: 'Internal server error while fetching taggable items' });
    }
};

const clearData = async (req, res) => {
    try {
        const { toolId } = req.params;
        const result = await focusService.clearData(toolId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error clearing focus data:', error);
        res.status(500).json({ error: 'Internal server error while clearing focus data' });
    }
};

module.exports = {
    logSession,
    getSessions,
    getStats,
    getTaggableItems,
    clearData
};
