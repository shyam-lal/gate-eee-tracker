const syllabusService = require('../services/syllabusService');

const getSyllabus = async (req, res) => {
    try {
        const data = await syllabusService.getSyllabus(req.user.id);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createSubject = async (req, res) => {
    try {
        const { name } = req.body;
        const sub = await syllabusService.createSubject(req.user.id, name);
        res.status(201).json(sub);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const sub = await syllabusService.updateSubject(id, name);
        res.json(sub);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createTopic = async (req, res) => {
    try {
        const { subjectId, name, estimatedMinutes } = req.body;
        const topic = await syllabusService.createTopic(subjectId, name, estimatedMinutes);
        res.status(201).json(topic);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const topic = await syllabusService.updateTopic(id, req.body);
        res.json(topic);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const logTime = async (req, res) => {
    try {
        const { topicId, minutes, subjectId } = req.body;

        // Check if it's a specific topic log or manual subject log
        if (topicId) {
            await syllabusService.logTime(req.user.id, topicId, minutes);
            res.json({ message: 'Time logged successfully' });
        } else if (subjectId) {
            await syllabusService.logManualTime(req.user.id, subjectId, minutes);
            res.json({ message: 'Manual time logged successfully' });
        } else {
            res.status(400).json({ error: 'Missing topicId or subjectId' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        await syllabusService.deleteTopic(id);
        res.json({ message: 'Topic deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        await syllabusService.deleteSubject(id);
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getSyllabus,
    createSubject,
    updateSubject,
    createTopic,
    updateTopic,
    logTime,
    deleteTopic,
    deleteSubject
};
