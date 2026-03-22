const userService = require('../services/userService');
const toolService = require('../services/toolService');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await userService.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const user = await userService.createUser(username, email, password);

        // Auto-provision a Global Focus Tracker and Global Revision Tests for the new user
        try {
            await toolService.createTool(user.id, "Global Focus Tracker", "focus", "General");
            await toolService.createTool(user.id, "Global Revision Tests", "revision", user.selected_exam || "GATE");
        } catch (toolErr) {
            console.error("Warning: Failed to auto-provision default tools for new user", toolErr);
            // Non-fatal, we still let registration succeed
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                selected_exam: user.selected_exam,
                tracking_mode: user.tracking_mode,
                current_streak: user.current_streak,
                role: user.role || 'user',
                active_exam_id: user.active_exam_id || null,
                onboarding_completed: user.onboarding_completed || false,
            },
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await userService.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await userService.validatePassword(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                selected_exam: user.selected_exam,
                tracking_mode: user.tracking_mode,
                current_streak: user.current_streak,
                role: user.role || 'user',
                active_exam_id: user.active_exam_id || null,
                onboarding_completed: user.onboarding_completed || false,
            },
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
};
