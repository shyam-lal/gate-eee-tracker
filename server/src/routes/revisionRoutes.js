const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const rc = require('../controllers/revisionController');

// Sets
router.post('/sets', auth, rc.createSet);
router.get('/sets', auth, rc.getUserSets);
router.get('/sets/:id', auth, rc.getSet);
router.delete('/sets/:id', auth, rc.deleteSet);

// Questions
router.post('/sets/:id/import', auth, rc.importQuestions);
router.delete('/questions/:id', auth, rc.deleteQuestion);

// Prompt Generator
router.get('/prompt', auth, rc.getPrompt);

// Attempts
router.post('/sets/:id/attempts', auth, rc.createAttempt);
router.get('/sets/:id/attempts/in-progress', auth, rc.getInProgressAttempt);
router.get('/sets/:id/history', auth, rc.getAttemptHistory);
router.get('/attempts/:id', auth, rc.getAttempt);
router.put('/attempts/:id/answer', auth, rc.saveAnswer);
router.put('/attempts/:id/pause', auth, rc.pauseAttempt);
router.put('/attempts/:id/complete', auth, rc.completeAttempt);

module.exports = router;
