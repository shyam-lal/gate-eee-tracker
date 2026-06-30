const pool = require('../config/db');

const addSession = async (userId, tokenHash, deviceName, ipAddress, location) => {
    const result = await pool.query(
        'INSERT INTO active_sessions (user_id, token_hash, device_name, ip_address, location) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, tokenHash, deviceName, ipAddress, location]
    );
    return result.rows[0];
};

const getSessionsByUser = async (userId) => {
    const result = await pool.query(
        'SELECT id, device_name, ip_address, location, last_active, created_at FROM active_sessions WHERE user_id = $1 ORDER BY last_active DESC',
        [userId]
    );
    return result.rows;
};

const deleteSession = async (sessionId, userId) => {
    await pool.query(
        'DELETE FROM active_sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
    );
};

const updateSessionActivity = async (tokenHash) => {
    await pool.query(
        'UPDATE active_sessions SET last_active = CURRENT_TIMESTAMP WHERE token_hash = $1',
        [tokenHash]
    );
};

module.exports = {
    addSession,
    getSessionsByUser,
    deleteSession,
    updateSessionActivity
};
