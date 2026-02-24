const pool = require('../config/db');

const followUser = async (followerId, followingId) => {
    const res = await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
        [followerId, followingId]
    );
    return res.rows[0];
};

const unfollowUser = async (followerId, followingId) => {
    await pool.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
    );
    return { success: true };
};

const getFollowing = async (userId) => {
    const res = await pool.query(
        `SELECT u.id, u.username, u.email, u.current_streak, u.bio 
         FROM users u 
         JOIN follows f ON u.id = f.following_id 
         WHERE f.follower_id = $1`,
        [userId]
    );
    return res.rows;
};

const getFollowers = async (userId) => {
    const res = await pool.query(
        `SELECT u.id, u.username, u.email, u.current_streak, u.bio 
         FROM users u 
         JOIN follows f ON u.id = f.follower_id 
         WHERE f.following_id = $1`,
        [userId]
    );
    return res.rows;
};

const searchUsers = async (query, excludeId) => {
    const res = await pool.query(
        `SELECT id, username, current_streak, bio 
         FROM users 
         WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2 AND is_public = TRUE
         LIMIT 10`,
        [`%${query}%`, excludeId]
    );
    return res.rows;
};

const getPublicProfile = async (userId, requesterId) => {
    const userRes = await pool.query(
        'SELECT id, username, current_streak, bio, created_at FROM users WHERE id = $1 AND is_public = TRUE',
        [userId]
    );

    if (userRes.rows.length === 0) return null;

    const user = userRes.rows[0];

    // Check if requester follows this user
    const followRes = await pool.query(
        'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
        [requesterId, userId]
    );
    user.isFollowing = followRes.rows.length > 0;

    // Get achievements
    const achRes = await pool.query(
        `SELECT a.* FROM achievements a 
         JOIN user_achievements ua ON a.id = ua.achievement_id 
         WHERE ua.user_id = $1`,
        [userId]
    );
    user.achievements = achRes.rows;

    return user;
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowing,
    getFollowers,
    searchUsers,
    getPublicProfile
};
