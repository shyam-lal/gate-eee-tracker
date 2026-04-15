const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

router.use(authMiddleware);

// Task execution
router.post('/complete', taskController.completeTask);
router.get('/logs/:date', taskController.getLogsByDate);
router.get('/summary', taskController.getSummary);

module.exports = router;
