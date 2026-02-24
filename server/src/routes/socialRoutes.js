const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/follow', socialController.follow);
router.delete('/unfollow/:followingId', socialController.unfollow);
router.get('/info', socialController.getSocialInfo);
router.get('/search', socialController.search);
router.get('/profile/:userId', socialController.getPublicProfile);
router.get('/achievements', socialController.getAchievements);

module.exports = router;
