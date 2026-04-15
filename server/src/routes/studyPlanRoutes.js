const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const studyPlanController = require('../controllers/studyPlanController');

router.use(authMiddleware);

// Topic States
router.get('/topics/:examId', studyPlanController.getTopicStates);
router.put('/topics/:topicId', studyPlanController.updateTopicState);
router.post('/topics/bulk', studyPlanController.bulkUpdateTopicStates);

// Subject-specific topic states
router.get('/subjects/:subjectId/topics', studyPlanController.getSubjectTopicStates);

// Enrollment onboarding
router.get('/enrollment/:examId', studyPlanController.getEnrollment);
router.put('/enrollment/:examId', studyPlanController.updateEnrollment);

module.exports = router;
