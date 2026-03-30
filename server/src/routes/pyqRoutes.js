const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const pc = require('../controllers/pyqController');

// Papers (public listing, auth for attempts)
router.get('/papers', auth, pc.getPapers);
router.get('/papers/:id', auth, pc.getPaper);

// Attempts
router.post('/papers/:id/attempts', auth, pc.createAttempt);
router.get('/papers/:id/attempts/in-progress', auth, pc.getInProgressAttempt);
router.get('/papers/:id/history', auth, pc.getAttemptHistory);
router.get('/attempts/:id', auth, pc.getAttempt);
router.put('/attempts/:id/answer', auth, pc.saveAnswer);
router.put('/attempts/:id/pause', auth, pc.pauseAttempt);
router.put('/attempts/:id/complete', auth, pc.completeAttempt);

module.exports = router;
