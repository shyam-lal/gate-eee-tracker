const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

// All analytics routes are protected
router.use(authMiddleware);

// Get Global Dashboard Stats
router.get('/global', analyticsController.getGlobalStats);

module.exports = router;
