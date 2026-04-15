const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const planController = require('../controllers/planController');

router.use(authMiddleware);

// Daily plan
router.get('/today', planController.getTodayPlan);
router.get('/date/:date', planController.getPlanByDate);
router.get('/history', planController.getPlanHistory);
router.post('/regenerate', planController.regeneratePlan);

module.exports = router;
