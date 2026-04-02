const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');

// Initialize Razorpay instance safely
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret'
    });
} catch (error) {
    console.error('Failed to initialize Razorpay. Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.', error);
}

const subscriptionController = {
    // 1. Get available plans
    getPlans: async (req, res) => {
        try {
            const result = await pool.query(`SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC`);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching plans:', err);
            res.status(500).json({ error: 'Failed to fetch active plans' });
        }
    },

    // 2. Create Razorpay order
    createOrder: async (req, res) => {
        try {
            const { plan_id } = req.body;
            const userId = req.user.id;

            if (!plan_id) return res.status(400).json({ error: 'plan_id is required' });

            // Ensure plan exists and is active
            const planRes = await pool.query(
                `SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true`,
                [plan_id]
            );
            
            if (planRes.rowCount === 0) {
                return res.status(404).json({ error: 'Plan not found or inactive' });
            }

            const plan = planRes.rows[0];

            // If it's a free plan, we don't need to generate a Razorpay order, just activate it
            if (plan.price <= 0) {
                return res.status(400).json({ error: 'Free plans do not require a payment gateway order.' });
            }

            // Options for Razorpay order
            // Price in DB is assumed to be in smaller units or INR. Razorpay expects paise (amount * 100).
            const options = {
                amount: Math.round(plan.price * 100), // amount in the smallest currency unit
                currency: "INR",
                receipt: `receipt_user_${userId}_plan_${plan_id}`
            };

            const order = await razorpay.orders.create(options);

            res.json({
                order_id: order.id,
                currency: order.currency,
                amount: order.amount,
                plan: {
                    id: plan.id,
                    name: plan.name,
                    price: plan.price
                }
            });
        } catch (err) {
            console.error('Error creating razorpay order:', err);
            res.status(500).json({ error: 'Failed to create payment order' });
        }
    },

    // 3. Verify Payment Signature
    verifyPayment: async (req, res) => {
        const client = await pool.connect();
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = req.body;
            const userId = req.user.id;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan_id) {
                return res.status(400).json({ error: 'Missing required payment parameters' });
            }

            // Verify signature
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
                .update(body.toString())
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ error: 'Invalid Payment Signature' });
            }

            // Payment verified, update database
            await client.query('BEGIN');

            // Deactivate old active subscriptions
            await client.query(
                `UPDATE user_subscriptions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
                 WHERE user_id = $1 AND status = 'active'`,
                [userId]
            );

            // Fetch the plan duration
            const planRes = await client.query(`SELECT duration_months FROM subscription_plans WHERE id = $1`, [plan_id]);
            const durationMonths = planRes.rows[0]?.duration_months || 0;
            
            let endDate = null;
            if (durationMonths > 0) {
                const date = new Date();
                date.setMonth(date.getMonth() + durationMonths);
                endDate = date;
            }

            // Insert new active subscription
            await client.query(
                `INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date, payment_id)
                 VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, $3, $4)`,
                [userId, plan_id, endDate, razorpay_payment_id]
            );

            // Optional: Update user role based on premium status
            // await client.query(`UPDATE users SET role = 'premium' WHERE id = $1 AND role = 'user'`, [userId]);

            await client.query('COMMIT');
            
            res.json({ success: true, message: 'Payment verified and subscription activated.' });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error verifying payment:', err);
            res.status(500).json({ error: 'Failed to verify payment' });
        } finally {
            client.release();
        }
    }
};

module.exports = subscriptionController;
