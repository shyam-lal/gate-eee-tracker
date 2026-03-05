const express = require('express');
const router = express.Router();
const toolService = require('../services/toolService');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

// Create a new tool
router.post('/', async (req, res) => {
    try {
        const { name, toolType, selectedExam } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Tool name is required' });
        }
        const tool = await toolService.createTool(req.user.id, name.trim(), toolType, selectedExam);
        res.status(201).json(tool);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all tools for the current user
router.get('/', async (req, res) => {
    try {
        const tools = await toolService.getUserTools(req.user.id);
        res.json(tools);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get a single tool by ID
router.get('/:id', async (req, res) => {
    try {
        const tool = await toolService.getToolById(req.params.id);
        if (!tool) return res.status(404).json({ error: 'Tool not found' });
        res.json(tool);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update a tool (rename, change type, etc.)
router.patch('/:id', async (req, res) => {
    try {
        const tool = await toolService.updateTool(req.params.id, req.body);
        if (!tool) return res.status(404).json({ error: 'Tool not found or no changes' });
        res.json(tool);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a tool (cascades subjects, topics, etc.)
router.delete('/:id', async (req, res) => {
    try {
        const tool = await toolService.deleteTool(req.params.id);
        if (!tool) return res.status(404).json({ error: 'Tool not found' });
        res.json({ message: 'Tool deleted', tool });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
