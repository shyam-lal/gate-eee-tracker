const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async (username, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
        [username, email, hashedPassword]
    );
    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

const findUserById = async (id) => {
    const result = await pool.query('SELECT id, username, email, selected_exam, tracking_mode FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

const updatePreferences = async (userId, selected_exam, tracking_mode) => {
    const result = await pool.query(
        'UPDATE users SET selected_exam = $1, tracking_mode = $2 WHERE id = $3 RETURNING id, username, email, selected_exam, tracking_mode',
        [selected_exam, tracking_mode, userId]
    );
    return result.rows[0];
};

const validatePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const updateStreak = async (userId) => {
    const userRes = await pool.query('SELECT current_streak, last_activity_date FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    const today = new Date().toISOString().split('T')[0];

    if (user.last_activity_date) {
        const lastDate = new Date(user.last_activity_date);
        const diff = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);

        if (diff === 1) {
            // Increment streak
            await pool.query('UPDATE users SET current_streak = current_streak + 1, last_activity_date = $1 WHERE id = $2', [today, userId]);
        } else if (diff > 1) {
            // Reset streak
            await pool.query('UPDATE users SET current_streak = 1, last_activity_date = $1 WHERE id = $2', [today, userId]);
        }
        // Else it's the same day, do nothing OR update activity date if needed (already done)
    } else {
        await pool.query('UPDATE users SET current_streak = 1, last_activity_date = $1 WHERE id = $2', [today, userId]);
    }
};

const getLeaderboard = async () => {
    const res = await pool.query(
        'SELECT id, username, current_streak FROM users WHERE is_public = TRUE ORDER BY current_streak DESC LIMIT 10'
    );
    return res.rows;
};



module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    validatePassword,
    updatePreferences,
    updateStreak,
    getLeaderboard,
};
