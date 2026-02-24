const socialService = require('../services/socialService');
const achievementService = require('../services/achievementService');

const follow = async (req, res) => {
    try {
        const { followingId } = req.body;
        const result = await socialService.followUser(req.user.id, followingId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const unfollow = async (req, res) => {
    try {
        const { followingId } = req.params;
        const result = await socialService.unfollowUser(req.user.id, followingId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getSocialInfo = async (req, res) => {
    try {
        const following = await socialService.getFollowing(req.user.id);
        const followers = await socialService.getFollowers(req.user.id);
        res.json({ following, followers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const search = async (req, res) => {
    try {
        const { q } = req.query;
        const users = await socialService.searchUsers(q, req.user.id);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await socialService.getPublicProfile(userId, req.user.id);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAchievements = async (req, res) => {
    try {
        const achievements = await achievementService.getUserAchievements(req.user.id);
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    follow,
    unfollow,
    getSocialInfo,
    search,
    getPublicProfile,
    getAchievements
};
