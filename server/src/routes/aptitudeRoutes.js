const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    getSkillTree, getUserProgress, updateNodeProgress,
    getSparkContent, getForgeContent, getArenaContent,
    completeStage, submitAnswers
} = require('../controllers/aptitudeController');

// Public — get the full skill tree structure
router.get('/', getSkillTree);

// Authenticated — get user's progress
router.get('/progress', auth, getUserProgress);

// Authenticated — update progress for a node
router.post('/progress/:nodeId', auth, updateNodeProgress);

// Stage content endpoints
router.get('/nodes/:nodeId/spark', getSparkContent);
router.get('/nodes/:nodeId/forge', getForgeContent);
router.get('/nodes/:nodeId/arena', getArenaContent);

// Stage completion & answers (authenticated)
router.post('/nodes/:nodeId/complete-stage', auth, completeStage);
router.post('/answers', auth, submitAnswers);

module.exports = router;
