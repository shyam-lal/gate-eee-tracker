const userService = require('../services/userService');
const toolService = require('../services/toolService');
const aiConfigService = require('../services/aiConfigService');
const sessionService = require('../services/sessionService');

const sync = async (req, res) => {
    try {
        // req.user is populated by the authMiddleware from Firebase ID token
        // However, this endpoint might be called right after sign up, so req.user.id might be null.
        // We expect email, displayName, and uid in the body as fallback.
        
        const { email, displayName, uid } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required for sync' });
        }

        let user = await userService.findUserByEmail(email);

        if (!user) {
            // Create user in our DB (password_hash can be empty or a dummy value since Firebase handles auth)
            user = await userService.createUser(displayName || email.split('@')[0], email, 'FIREBASE_MANAGED');
            
            // Auto-provision a Global Focus Tracker and Global Revision Tests for the new user
            try {
                await toolService.createTool(user.id, "Global Focus Tracker", "focus", "General");
                await toolService.createTool(user.id, "Global Revision Tests", "revision", user.selected_exam || "GATE");
            } catch (toolErr) {
                console.error("Warning: Failed to auto-provision default tools for new user", toolErr);
            }
        }

        // Record session
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const crypto = require('crypto');
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const userAgent = req.headers['user-agent'] || 'Unknown Device';
            let deviceName = 'Unknown Device';
            if (userAgent.includes('Windows')) deviceName = 'Windows PC';
            else if (userAgent.includes('Mac')) deviceName = 'MacBook';
            else if (userAgent.includes('iPhone')) deviceName = 'iPhone';
            else if (userAgent.includes('Android')) deviceName = 'Android Device';
            else deviceName = userAgent.substring(0, 50); 
            
            const ipAddress = req.ip || req.connection.remoteAddress;
            await sessionService.addSession(user.id, tokenHash, deviceName, ipAddress, 'Unknown Location');
        }

        const effectiveAiMode = await aiConfigService.getEffectiveAiMode(user.id);

        res.json({
            message: 'Sync successful',
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
                effective_ai_mode: effectiveAiMode,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    sync
};
