const revisionService = require('../services/revisionService');
const { generatePrompt } = require('../services/revisionPromptService');

// ─── SETS ────────────────────────────────────────────────────────────────

exports.createSet = async (req, res) => {
    try {
        const { title, topics, questionCount, timePerQuestion } = req.body;
        if (!title || !topics) return res.status(400).json({ error: 'Title and topics are required' });
        const set = await revisionService.createSet(req.user.id, title, topics, questionCount || 10, timePerQuestion || 180);
        res.json(set);
    } catch (err) {
        console.error('createSet error:', err);
        res.status(500).json({ error: 'Failed to create set' });
    }
};

exports.getUserSets = async (req, res) => {
    try {
        const sets = await revisionService.getUserSets(req.user.id);
        res.json(sets);
    } catch (err) {
        console.error('getUserSets error:', err);
        res.status(500).json({ error: 'Failed to get sets' });
    }
};

exports.getSet = async (req, res) => {
    try {
        const set = await revisionService.getSet(req.params.id);
        if (!set) return res.status(404).json({ error: 'Set not found' });
        res.json(set);
    } catch (err) {
        console.error('getSet error:', err);
        res.status(500).json({ error: 'Failed to get set' });
    }
};

exports.deleteSet = async (req, res) => {
    try {
        await revisionService.deleteSet(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('deleteSet error:', err);
        res.status(500).json({ error: 'Failed to delete set' });
    }
};

// ─── QUESTIONS ───────────────────────────────────────────────────────────

exports.importQuestions = async (req, res) => {
    try {
        const { questions } = req.body;
        if (!questions) return res.status(400).json({ error: 'Questions JSON is required' });
        const inserted = await revisionService.importQuestions(req.params.id, questions);
        res.json({ count: inserted.length, questions: inserted });
    } catch (err) {
        console.error('importQuestions error:', err);
        res.status(500).json({ error: 'Failed to import questions: ' + err.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        await revisionService.deleteQuestion(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('deleteQuestion error:', err);
        res.status(500).json({ error: 'Failed to delete question' });
    }
};

// ─── PROMPT ──────────────────────────────────────────────────────────────

exports.getPrompt = async (req, res) => {
    try {
        const { topics, count, examType } = req.query;
        if (!topics) return res.status(400).json({ error: 'Topics are required' });
        const prompt = generatePrompt(topics, count || 10, examType || 'GATE');
        res.json({ prompt });
    } catch (err) {
        console.error('getPrompt error:', err);
        res.status(500).json({ error: 'Failed to generate prompt' });
    }
};

// ─── ATTEMPTS ────────────────────────────────────────────────────────────

exports.createAttempt = async (req, res) => {
    try {
        const { questionOrder } = req.body;
        if (!questionOrder || !Array.isArray(questionOrder)) {
            return res.status(400).json({ error: 'questionOrder array is required' });
        }
        const attempt = await revisionService.createAttempt(req.params.id, questionOrder);
        res.json(attempt);
    } catch (err) {
        console.error('createAttempt error:', err);
        res.status(500).json({ error: 'Failed to create attempt' });
    }
};

exports.getAttempt = async (req, res) => {
    try {
        const attempt = await revisionService.getAttempt(req.params.id);
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
        const result = await revisionService.saveAnswer(req.params.id, questionId, answer, timeSpent || 0);
        res.json(result);
    } catch (err) {
        console.error('saveAnswer error:', err);
        res.status(500).json({ error: 'Failed to save answer' });
    }
};

exports.pauseAttempt = async (req, res) => {
    try {
        const { currentIndex, timeTaken } = req.body;
        await revisionService.pauseAttempt(req.params.id, currentIndex || 0, timeTaken || 0);
        res.json({ success: true });
    } catch (err) {
        console.error('pauseAttempt error:', err);
        res.status(500).json({ error: 'Failed to pause attempt' });
    }
};

exports.completeAttempt = async (req, res) => {
    try {
        const result = await revisionService.completeAttempt(req.params.id);
        res.json(result);
    } catch (err) {
        console.error('completeAttempt error:', err);
        res.status(500).json({ error: 'Failed to complete attempt' });
    }
};

exports.getAttemptHistory = async (req, res) => {
    try {
        const history = await revisionService.getAttemptHistory(req.params.id);
        res.json(history);
    } catch (err) {
        console.error('getAttemptHistory error:', err);
        res.status(500).json({ error: 'Failed to get history' });
    }
};

exports.getInProgressAttempt = async (req, res) => {
    try {
        const attempt = await revisionService.getInProgressAttempt(req.params.id);
        res.json(attempt);
    } catch (err) {
        console.error('getInProgressAttempt error:', err);
        res.status(500).json({ error: 'Failed to check in-progress attempt' });
    }
};
