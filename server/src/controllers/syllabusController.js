const syllabusService = require('../services/syllabusService');
const userService = require('../services/userService');
const achievementService = require('../services/achievementService');

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
        const { subjectId, name, estimatedMinutes, totalModules } = req.body;
        const topic = await syllabusService.createTopic(subjectId, name, estimatedMinutes, totalModules);
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

const logActivity = async (req, res) => {
    try {
        const { topicId, minutes, modules, subjectId } = req.body;

        if (topicId) {
            await syllabusService.logActivity(req.user.id, topicId, minutes, modules);

            // Gamification logic
            await userService.updateStreak(req.user.id);
            const newAchievements = await achievementService.checkAndAwardAchievements(req.user.id);

            res.json({
                message: 'Activity logged successfully',
                newAchievements: newAchievements
            });
        } else if (subjectId) {
            await syllabusService.logManualTime(req.user.id, subjectId, minutes);
            await userService.updateStreak(req.user.id);
            const newAchievements = await achievementService.checkAndAwardAchievements(req.user.id);

            res.json({
                message: 'Manual time logged successfully',
                newAchievements: newAchievements
            });
        } else {
            res.status(400).json({ error: 'Missing topicId or subjectId' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const editLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { minutes, modules } = req.body;
        const updated = await syllabusService.editActivityLog(id, minutes, modules);
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getLogs = async (req, res) => {
    try {
        const { topicId } = req.query;
        const logs = await syllabusService.getActivityLogs(req.user.id, topicId);
        res.json(logs);
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

const resetProgress = async (req, res) => {
    try {
        await syllabusService.resetUserProgress(req.user.id);
        res.json({ message: 'All progress reset successfully' });
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
    logActivity,
    editLog,
    getLogs,
    deleteTopic,
    deleteSubject,
    resetProgress
};
