const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const onboardingController = require('../controllers/onboardingController');

router.use(authMiddleware);

// Onboarding status (resume detection)
router.get('/status', onboardingController.getStatus);

// Onboarding flow
router.post('/start', onboardingController.start);
router.post('/goal', onboardingController.saveGoal);
router.post('/assessment', onboardingController.saveAssessment);
router.post('/complete', onboardingController.complete);

module.exports = router;
