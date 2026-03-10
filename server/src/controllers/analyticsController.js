const analyticsService = require('../services/analyticsService');

const getGlobalStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await analyticsService.getGlobalStats(userId);
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error fetching global analytics:', error);
        res.status(500).json({ error: 'Internal server error while fetching analytics' });
    }
};

module.exports = {
    getGlobalStats
};
