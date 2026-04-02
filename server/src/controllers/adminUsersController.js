const pool = require('../config/db');

const adminUsersController = {
    // Get all users with basic info and active subscription
    getAllUsers: async (req, res) => {
        try {
            const { search, role, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    u.id, u.username, u.email, u.role, u.created_at,
                    COALESCE(s.name, 'Free') as subscription_tier,
                    us.status as subscription_status,
                    us.end_date as subscription_end_date
                FROM users u
                LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
                LEFT JOIN subscription_plans s ON us.plan_id = s.id
                WHERE 1=1
            `;
            const queryParams = [];
            let paramIndex = 1;

            if (search) {
                query += ` AND (u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
                queryParams.push(`%${search}%`);
                paramIndex++;
            }

            if (role) {
                query += ` AND u.role = $${paramIndex}`;
                queryParams.push(role);
                paramIndex++;
            }

            query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(limit, offset);

            const result = await pool.query(query, queryParams);

            // Get total count
            let counterQuery = `SELECT COUNT(*) FROM users u WHERE 1=1`;
            const counterParams = [];
            if (search) {
                counterQuery += ` AND (u.username ILIKE $1 OR u.email ILIKE $1)`;
                counterParams.push(`%${search}%`);
            }
            if (role) {
                counterQuery += search ? ` AND u.role = $2` : ` AND u.role = $1`;
                counterParams.push(role);
            }

            const countResult = await pool.query(counterQuery, counterParams);

            res.json({
                users: result.rows,
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            });
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    },

    // Get a specific user's details including their subscription history and stats
    getUserDetails: async (req, res) => {
        try {
            const { id } = req.params;

            // Basic details
            const userRes = await pool.query(
                `SELECT id, username, email, role, created_at FROM users WHERE id = $1`,
                [id]
            );
            if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });

            const user = userRes.rows[0];

            // Subscriptions
            const subsRes = await pool.query(
                `SELECT us.id, us.status, us.start_date, us.end_date, s.name as plan_name, s.price
                 FROM user_subscriptions us
                 JOIN subscription_plans s ON us.plan_id = s.id
                 WHERE us.user_id = $1
                 ORDER BY us.created_at DESC`,
                [id]
            );
            user.subscriptions = subsRes.rows;

            // Study Stats
            const statsRes = await pool.query(
                `SELECT COALESCE(SUM(minutes_logged), 0) as total_minutes
                 FROM activity_logs WHERE user_id = $1`,
                [id]
            );
            user.stats = {
                totalMinutes: parseInt(statsRes.rows[0].total_minutes)
            };

            res.json(user);
        } catch (err) {
            console.error('Error fetching user details:', err);
            res.status(500).json({ error: 'Failed to fetch user details' });
        }
    },

    // Get all subscription plans
    getPlans: async (req, res) => {
        try {
            const result = await pool.query(`SELECT * FROM subscription_plans ORDER BY price ASC`);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching plans:', err);
            res.status(500).json({ error: 'Failed to fetch plans' });
        }
    },

    // Manually assign a subscription tier to a user (Admin override)
    updateUserSubscription: async (req, res) => {
        const client = await pool.connect();
        try {
            const { id } = req.params; // user id
            const { plan_id, end_date } = req.body;

            await client.query('BEGIN');

            // Deactivate any currently active subscriptions for this user
            await client.query(
                `UPDATE user_subscriptions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
                 WHERE user_id = $1 AND status = 'active'`,
                [id]
            );

            // If a valid plan is provided, insert a new active subscription
            if (plan_id) {
                await client.query(
                    `INSERT INTO user_subscriptions (user_id, plan_id, status, end_date, payment_id)
                     VALUES ($1, $2, 'active', $3, 'admin_override')`,
                    [id, plan_id, end_date || null]
                );
            }

            await client.query('COMMIT');
            res.json({ message: 'User subscription updated successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error updating user subscription:', err);
            res.status(500).json({ error: 'Failed to update user subscription' });
        } finally {
            client.release();
        }
    }
};

module.exports = adminUsersController;
