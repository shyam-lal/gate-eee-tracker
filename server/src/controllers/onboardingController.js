const onboardingService = require('../services/onboardingService');

/**
 * GET /onboarding/status
 */
const getStatus = async (req, res) => {
    try {
        const status = await onboardingService.getOnboardingStatus(req.user.id);
        res.json(status);
    } catch (err) {
        console.error('Error fetching onboarding status:', err);
        res.status(500).json({ error: 'Failed to fetch onboarding status' });
    }
};

/**
 * POST /onboarding/start
 * Body: { exam_id }
 */
const start = async (req, res) => {
    try {
        const { exam_id } = req.body;
        if (!exam_id) {
            return res.status(400).json({ error: 'exam_id is required' });
        }

        const enrollment = await onboardingService.startOnboarding(req.user.id, parseInt(exam_id));
        res.json({ enrollment });
    } catch (err) {
        console.error('Error starting onboarding:', err);
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to start onboarding' });
    }
};

/**
 * POST /onboarding/goal
 * Body: { target_date, daily_available_hours }
 */
const saveGoal = async (req, res) => {
    try {
        const { target_date, daily_available_hours } = req.body;

        if (!target_date || !daily_available_hours) {
            return res.status(400).json({ error: 'target_date and daily_available_hours are required' });
        }

        const enrollment = await onboardingService.saveGoal(req.user.id, {
            target_date,
            daily_available_hours: parseFloat(daily_available_hours),
        });
        res.json({ enrollment });
    } catch (err) {
        console.error('Error saving goal:', err);
        if (err.message.includes('No active enrollment')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to save goal' });
    }
};

/**
 * POST /onboarding/assessment
 * Body: { subject_id, confidence }
 */
const saveAssessment = async (req, res) => {
    try {
        const { subject_id, confidence } = req.body;

        if (subject_id === undefined || confidence === undefined) {
            return res.status(400).json({ error: 'subject_id and confidence are required' });
        }

        const result = await onboardingService.saveSubjectAssessment(req.user.id, {
            subject_id: parseInt(subject_id),
            confidence: parseInt(confidence),
        });
        res.json(result);
    } catch (err) {
        console.error('Error saving assessment:', err);
        if (err.message.includes('must be between') || err.message.includes('No topics')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to save assessment' });
    }
};

/**
 * POST /onboarding/complete
 */
const complete = async (req, res) => {
    try {
        const enrollment = await onboardingService.completeOnboarding(req.user.id);
        res.json({ enrollment, message: 'Onboarding completed successfully' });
    } catch (err) {
        console.error('Error completing onboarding:', err);
        if (err.message.includes('No active enrollment')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Failed to complete onboarding' });
    }
};

module.exports = {
    getStatus,
    start,
    saveGoal,
    saveAssessment,
    complete,
};
