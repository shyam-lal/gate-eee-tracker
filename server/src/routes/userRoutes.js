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

router.get('/credits', async (req, res) => {
    try {
        const user = await userService.findUserById(req.user.id);
        res.json({ credits: user.credits || 0 });
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

const Razorpay = require('razorpay');
const crypto = require('crypto');
const creditService = require('../services/creditService');

// In production, these should come from process.env
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_stub';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_stub';

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});

router.post('/credits/buy/session', async (req, res) => {
    try {
        const { packId, price } = req.body;
        
        // Convert to paise for Razorpay
        const amount = price * 100;
        
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_user_${req.user.id}_${Date.now()}`
        };
        
        const order = await razorpay.orders.create(options);
        
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            key: RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error("Razorpay Order Error", err);
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});

router.post('/credits/buy/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits } = req.body;

        // Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Payment verified, add credits
            const result = await creditService.addCreditsFromPurchase(req.user.id, parseInt(credits, 10));
            res.json({ success: true, newBalance: result.remainingCredits });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
    } catch (err) {
        console.error("Razorpay Verify Error", err);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const pool = require('../config/db');
        const txRes = await pool.query(
            `SELECT * FROM credit_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
            [req.user.id]
        );
        res.json({ transactions: txRes.rows });
    } catch (err) {
        console.error("Fetch Transactions Error", err);
        res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
});

module.exports = router;
