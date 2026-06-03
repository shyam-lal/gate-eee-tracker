const pool = require('../config/db');

/**
 * Retrieves the effective AI generation mode for a given user.
 * It checks the user's ai_generation_mode, and if it's 'global', 
 * it falls back to the global_settings table.
 * 
 * @param {number} userId - The ID of the user
 * @returns {Promise<string>} 'disabled', 'manual', or 'auto'
 */
async function getEffectiveAiMode(userId) {
    try {
        // Get user setting
        const userRes = await pool.query(
            `SELECT ai_generation_mode FROM users WHERE id = $1`,
            [userId]
        );
        
        let mode = 'global';
        if (userRes.rowCount > 0 && userRes.rows[0].ai_generation_mode) {
            mode = userRes.rows[0].ai_generation_mode;
        }

        if (mode !== 'global') {
            return mode;
        }

        // Get global setting if user is set to 'global'
        const globalRes = await pool.query(
            `SELECT value FROM global_settings WHERE key = 'ai_generation_mode'`
        );
        
        if (globalRes.rowCount > 0) {
            // value is stored as JSONB, so it might be wrapped in quotes
            const val = globalRes.rows[0].value;
            // if it's a string like '"manual"', replace quotes, else return as is
            return typeof val === 'string' ? val.replace(/^"|"$/g, '') : val;
        }

        // Default fallback if nothing is set
        return 'manual';
    } catch (err) {
        console.error('Error in getEffectiveAiMode:', err);
        return 'manual'; // Fail-safe default
    }
}

module.exports = {
    getEffectiveAiMode
};
