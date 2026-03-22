const pool = require('../config/db');

/**
 * Exam-scope middleware. Must be used AFTER authenticateToken.
 * Reads exam context from X-Exam-Id header or exam_id query parameter.
 * Verifies user is enrolled in the exam and attaches req.examId.
 * 
 * Usage:
 *   router.get('/something', authenticateToken, examScope, handler);
 */
const examScope = async (req, res, next) => {
    try {
        const examId = req.headers['x-exam-id'] || req.query.exam_id;

        if (!examId) {
            return res.status(400).json({ error: 'Exam context required. Set X-Exam-Id header or exam_id query parameter.' });
        }

        const parsedExamId = parseInt(examId);
        if (isNaN(parsedExamId)) {
            return res.status(400).json({ error: 'Invalid exam ID' });
        }

        // Verify user is enrolled in this exam
        const enrollment = await pool.query(
            'SELECT id FROM user_enrollments WHERE user_id = $1 AND exam_id = $2 AND is_active = TRUE',
            [req.user.id, parsedExamId]
        );

        if (enrollment.rows.length === 0) {
            return res.status(403).json({ error: 'Not enrolled in this exam' });
        }

        req.examId = parsedExamId;
        next();
    } catch (err) {
        console.error('ExamScope middleware error:', err);
        res.status(500).json({ error: 'Failed to verify exam context' });
    }
};

module.exports = examScope;
