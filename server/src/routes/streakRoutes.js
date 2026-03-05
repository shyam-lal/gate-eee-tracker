const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const streakService = require('../services/streakService');

// GET /api/streak/tool/:toolId - Get tool streak data
router.get('/tool/:toolId', authMiddleware, async (req, res) => {
    try {
        const { toolId } = req.params;
        const now = new Date();
        const year = parseInt(req.query.year) || now.getFullYear();
        const month = parseInt(req.query.month) || (now.getMonth() + 1);

        const data = await streakService.getToolStreak(req.user.id, toolId, year, month);
        res.json(data);
    } catch (err) {
        console.error('Tool streak error:', err);
        res.status(500).json({ error: 'Failed to get tool streak' });
    }
});

// GET /api/streak/user - Get user-wide streak data
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const data = await streakService.getUserStreak(req.user.id);
        res.json(data);
    } catch (err) {
        console.error('User streak error:', err);
        res.status(500).json({ error: 'Failed to get user streak' });
    }
});

module.exports = router;
