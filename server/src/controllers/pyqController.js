const pyqService = require('../services/pyqService');

// ─── PAPERS ──────────────────────────────────────────────────────────────

exports.getPapers = async (req, res) => {
    try {
        const papers = await pyqService.getPapers({
            year: req.query.year,
            branch: req.query.branch,
            exam_id: req.query.exam_id
        });
        res.json(papers);
    } catch (err) {
        console.error('getPapers error:', err);
        res.status(500).json({ error: 'Failed to get papers' });
    }
};

exports.getPaper = async (req, res) => {
    try {
        const paper = await pyqService.getPaper(req.params.id);
        if (!paper) return res.status(404).json({ error: 'Paper not found' });
        res.json(paper);
    } catch (err) {
        console.error('getPaper error:', err);
        res.status(500).json({ error: 'Failed to get paper' });
    }
};

// ─── ATTEMPTS ────────────────────────────────────────────────────────────

exports.createAttempt = async (req, res) => {
    try {
        const { questionOrder, mode } = req.body;
        if (!questionOrder || !Array.isArray(questionOrder)) {
            return res.status(400).json({ error: 'questionOrder array is required' });
        }
        const attempt = await pyqService.createAttempt(req.user.id, req.params.id, questionOrder, mode || 'exam');
        res.json(attempt);
    } catch (err) {
        console.error('createAttempt error:', err);
        res.status(500).json({ error: 'Failed to create attempt' });
    }
};

exports.getInProgressAttempt = async (req, res) => {
    try {
        const attempt = await pyqService.getInProgressAttempt(req.user.id, req.params.id);
        res.json(attempt);
    } catch (err) {
        console.error('getInProgressAttempt error:', err);
        res.status(500).json({ error: 'Failed to check in-progress attempt' });
    }
};

exports.getAttempt = async (req, res) => {
    try {
        const attempt = await pyqService.getAttempt(req.params.id);
        if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
        res.json(attempt);
    } catch (err) {
        console.error('getAttempt error:', err);
        res.status(500).json({ error: 'Failed to get attempt' });
    }
};

exports.saveAnswer = async (req, res) => {
    try {
        const { questionId, answer, timeSpent } = req.body;
        if (!questionId) return res.status(400).json({ error: 'questionId is required' });
        const result = await pyqService.saveAnswer(req.params.id, questionId, answer, timeSpent || 0);
        res.json(result);
    } catch (err) {
        console.error('saveAnswer error:', err);
        res.status(500).json({ error: 'Failed to save answer' });
    }
};

exports.pauseAttempt = async (req, res) => {
    try {
        const { currentIndex, timeTaken } = req.body;
        await pyqService.pauseAttempt(req.params.id, currentIndex || 0, timeTaken || 0);
        res.json({ success: true });
    } catch (err) {
        console.error('pauseAttempt error:', err);
        res.status(500).json({ error: 'Failed to pause attempt' });
    }
};

exports.completeAttempt = async (req, res) => {
    try {
        const { toolId } = req.body;
        const result = await pyqService.completeAttempt(req.params.id, toolId, req.user.id);
        res.json(result);
    } catch (err) {
        console.error('completeAttempt error:', err);
        res.status(500).json({ error: 'Failed to complete attempt' });
    }
};

exports.getAttemptHistory = async (req, res) => {
    try {
        const history = await pyqService.getAttemptHistory(req.user.id, req.params.id);
        res.json(history);
    } catch (err) {
        console.error('getAttemptHistory error:', err);
        res.status(500).json({ error: 'Failed to get history' });
    }
};
