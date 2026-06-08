const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const adminUsersController = require('../controllers/adminUsersController');

// All routes require auth and admin role
router.use(authenticateToken, adminAuth);

// User Management
router.get('/users', adminUsersController.getAllUsers);
router.get('/users/:id', adminUsersController.getUserDetails);
router.put('/users/:id/ai-mode', adminUsersController.updateUserAiMode);

// Global Settings Management
router.get('/settings', adminUsersController.getGlobalSettings);
router.put('/settings/:key', adminUsersController.updateGlobalSetting);

module.exports = router;
