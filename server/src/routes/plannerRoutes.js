const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const plannerController = require('../controllers/plannerController');

router.use(authMiddleware);

// Planner Notes
router.get('/notes/:date', plannerController.getDailyNote); // ?type=monthly
router.put('/notes/:date', plannerController.saveDailyNote); // body: { content, type }
router.get('/indicators', plannerController.getNoteIndicators); // ?start=&end=&type=

// Weekly Goals
router.get('/goals', plannerController.getWeeklyGoals); // Uses query params: ?start=&end=
router.post('/weekly', plannerController.createWeeklyGoal);
router.put('/weekly/:id/status', plannerController.updateGoalStatus);
router.delete('/weekly/:id', plannerController.deleteGoal);

module.exports = router;
