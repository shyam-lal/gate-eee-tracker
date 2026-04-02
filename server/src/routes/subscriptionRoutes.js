const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

// All subscription routes require auth
router.use(authenticateToken);

// Get available pricing tiers
router.get('/plans', subscriptionController.getPlans);

// Create a Razorpay order before frontend checkout
router.post('/create-order', subscriptionController.createOrder);

// Verify Signature after frontend checkout
router.post('/verify-payment', subscriptionController.verifyPayment);

module.exports = router;
