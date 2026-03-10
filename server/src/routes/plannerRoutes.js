const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const plannerController = require('../controllers/plannerController');

router.use(authMiddleware);

// Daily Notes
router.get('/daily/:date', plannerController.getDailyNote);
router.put('/daily/:date', plannerController.saveDailyNote);

// Weekly Goals
router.get('/goals', plannerController.getWeeklyGoals); // Uses query params: ?start=&end=
router.post('/weekly', plannerController.createWeeklyGoal);
router.put('/weekly/:id/status', plannerController.updateGoalStatus);
router.delete('/weekly/:id', plannerController.deleteGoal);

module.exports = router;
