const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const planController = require('../controllers/planController');

router.use(authMiddleware);

// Daily Battle Plan
router.get('/today', planController.getTodayPlan);
router.get('/date/:date', planController.getPlanByDate);
router.get('/history', planController.getPlanHistory);
router.post('/regenerate', planController.regeneratePlan);

// Strategic overview
router.get('/roadmap', planController.getRoadmap);

// Settings
router.patch('/settings', planController.updateSettings);

// Task lifecycle
router.post('/task/start', planController.startTask);
router.post('/task/complete', planController.completeTask);
router.post('/task/skip', planController.skipTask);

module.exports = router;
