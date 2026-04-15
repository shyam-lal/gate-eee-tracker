const studyPlanService = require('../services/studyPlanService');

/**
 * GET /api/study-plan/topics/:examId
 * Get all topic states for user's exam
 */
const getTopicStates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId } = req.params;

        const states = await studyPlanService.getUserTopicStates(userId, parseInt(examId));
        res.json({ topics: states });
    } catch (err) {
        console.error('Error fetching topic states:', err);
        res.status(500).json({ error: 'Failed to fetch topic states' });
    }
};

/**
 * PUT /api/study-plan/topics/:topicId
 * Upsert a single topic state
 */
const updateTopicState = async (req, res) => {
    try {
        const userId = req.user.id;
        const { topicId } = req.params;
        const { confidence, status, last_studied_at, total_time_spent_minutes } = req.body;

        const state = await studyPlanService.upsertTopicState(userId, parseInt(topicId), {
            confidence,
            status,
            last_studied_at,
            total_time_spent_minutes,
        });
        res.json({ topic_state: state });
    } catch (err) {
        console.error('Error updating topic state:', err);
        res.status(500).json({ error: 'Failed to update topic state' });
    }
};

/**
 * POST /api/study-plan/topics/bulk
 * Bulk upsert topic states (onboarding)
 * Body: { states: [{ topic_id, confidence, status }, ...] }
 */
const bulkUpdateTopicStates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { states } = req.body;

        if (!Array.isArray(states) || states.length === 0) {
            return res.status(400).json({ error: 'states array is required' });
        }

        const results = await studyPlanService.bulkUpsertTopicStates(userId, states);
        res.json({ topic_states: results, count: results.length });
    } catch (err) {
        console.error('Error bulk updating topic states:', err);
        res.status(500).json({ error: 'Failed to bulk update topic states' });
    }
};

/**
 * GET /api/study-plan/subjects/:subjectId/topics
 * Get topic states for a specific subject
 */
const getSubjectTopicStates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subjectId } = req.params;

        const states = await studyPlanService.getTopicStatesBySubject(userId, parseInt(subjectId));
        res.json({ topics: states });
    } catch (err) {
        console.error('Error fetching subject topic states:', err);
        res.status(500).json({ error: 'Failed to fetch subject topic states' });
    }
};

/**
 * PUT /api/study-plan/enrollment/:examId
 * Update enrollment onboarding data
 */
const updateEnrollment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId } = req.params;
        const { daily_available_hours, onboarding_completed } = req.body;

        const enrollment = await studyPlanService.updateEnrollmentOnboarding(
            userId, parseInt(examId), { daily_available_hours, onboarding_completed }
        );

        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        res.json({ enrollment });
    } catch (err) {
        console.error('Error updating enrollment:', err);
        res.status(500).json({ error: 'Failed to update enrollment' });
    }
};

/**
 * GET /api/study-plan/enrollment/:examId
 * Get enrollment details
 */
const getEnrollment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId } = req.params;

        const enrollment = await studyPlanService.getEnrollment(userId, parseInt(examId));
        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        res.json({ enrollment });
    } catch (err) {
        console.error('Error fetching enrollment:', err);
        res.status(500).json({ error: 'Failed to fetch enrollment' });
    }
};

module.exports = {
    getTopicStates,
    updateTopicState,
    bulkUpdateTopicStates,
    getSubjectTopicStates,
    updateEnrollment,
    getEnrollment,
};
