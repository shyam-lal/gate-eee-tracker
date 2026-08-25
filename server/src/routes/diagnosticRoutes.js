const express = require('express');
const router = express.Router();
const diagnosticController = require('../controllers/diagnosticController');
const authenticateToken = require('../middleware/authMiddleware');

// Guest endpoints
router.get('/questions/:subject_slug', diagnosticController.getQuestions);
router.get('/syllabus/:subject_slug', diagnosticController.getSubjectSyllabus);

// Authenticated endpoints (for syncing guest data after sign-up)
router.post('/sync', authenticateToken, diagnosticController.syncDiagnosticResult);

module.exports = router;
