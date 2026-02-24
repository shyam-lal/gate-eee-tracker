const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes here are protected
router.use(authenticateToken);

router.get('/', syllabusController.getSyllabus);
router.post('/subject', syllabusController.createSubject);
router.patch('/subject/:id', syllabusController.updateSubject);
router.delete('/subject/:id', syllabusController.deleteSubject);
router.post('/topic', syllabusController.createTopic);
router.patch('/topic/:id', syllabusController.updateTopic);
router.delete('/topic/:id', syllabusController.deleteTopic);
router.post('/log', syllabusController.logActivity);
router.patch('/log/:id', syllabusController.editLog);
router.get('/logs', syllabusController.getLogs);
router.delete('/reset', syllabusController.resetProgress);

module.exports = router;
