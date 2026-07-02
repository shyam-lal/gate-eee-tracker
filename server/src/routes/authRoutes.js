const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// The route is protected by authMiddleware to ensure only Firebase authenticated requests can sync
router.post('/sync', authenticateToken, authController.sync);

module.exports = router;
