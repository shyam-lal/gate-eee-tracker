const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authenticateToken = require('../middleware/authMiddleware');
const aiConfigService = require('../services/aiConfigService');

router.use(authenticateToken);

router.get('/me', async (req, res) => {
    try {
        const user = await userService.findUserById(req.user.id);
        const effectiveAiMode = await aiConfigService.getEffectiveAiMode(req.user.id);
        res.json({ ...user, effective_ai_mode: effectiveAiMode });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/preferences', async (req, res) => {
    try {
        const { selected_exam, tracking_mode } = req.body;
        const user = await userService.updatePreferences(req.user.id, selected_exam, tracking_mode);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
