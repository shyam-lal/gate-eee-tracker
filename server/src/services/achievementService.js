const pool = require('../config/db');

const checkAndAwardAchievements = async (userId) => {
    // 1. Get user stats
    const statsRes = await pool.query(
        `SELECT 
            u.current_streak,
            COALESCE(SUM(al.minutes_logged), 0) as total_minutes,
            COALESCE(SUM(al.modules_logged), 0) as total_modules
         FROM users u
         LEFT JOIN activity_logs al ON u.id = al.user_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [userId]
    );

    const stats = statsRes.rows[0];
    if (!stats) return [];

    // 2. Get unearned achievements
    const achRes = await pool.query(
        `SELECT * FROM achievements 
         WHERE id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)`,
        [userId]
    );

    const newAchievements = [];

    for (const ach of achRes.rows) {
        let earned = false;
        if (ach.requirement_type === 'streak' && stats.current_streak >= ach.requirement_value) earned = true;
        if (ach.requirement_type === 'minutes' && stats.total_minutes >= ach.requirement_value) earned = true;
        if (ach.requirement_type === 'modules' && stats.total_modules >= ach.requirement_value) earned = true;

        if (earned) {
            await pool.query(
                'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, ach.id]
            );
            newAchievements.push(ach);
        }
    }

    return newAchievements;
};

const getUserAchievements = async (userId) => {
    const res = await pool.query(
        `SELECT a.*, ua.earned_at FROM achievements a 
         JOIN user_achievements ua ON a.id = ua.achievement_id 
         WHERE ua.user_id = $1
         ORDER BY ua.earned_at DESC`,
        [userId]
    );
    return res.rows;
};

const getAllAchievements = async () => {
    const res = await pool.query('SELECT * FROM achievements');
    return res.rows;
};

module.exports = {
    checkAndAwardAchievements,
    getUserAchievements,
    getAllAchievements
};
