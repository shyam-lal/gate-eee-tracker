const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const focusController = require('../controllers/focusController');

// All routes are protected
router.use(authMiddleware);

// Get list of subjects/topics from other tools for the dropdown
router.get('/taggable-items', focusController.getTaggableItems);

// Save a new focus session
router.post('/sessions', focusController.logSession);

// Get past sessions for this focus tool
router.get('/tools/:toolId/sessions', focusController.getSessions);

// Get high level stats (total time, time today)
router.get('/tools/:toolId/stats', focusController.getStats);

// Clear all focus sessions for a specific tool
router.delete('/tools/:toolId/clear', focusController.clearData);

module.exports = router;
