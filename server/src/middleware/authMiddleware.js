const admin = require('../config/firebase');
const userService = require('../services/userService');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Find user in our DB by email (since Firebase UID is not currently mapped, we use email as the linker)
        // Alternatively we can use decodedToken.uid if we update the schema, but email is unique.
        const user = await userService.findUserByEmail(decodedToken.email);
        
        if (!user) {
            // User hasn't synced yet, this is mostly fine, we just attach decoded token info
            req.user = { id: null, email: decodedToken.email, role: 'user' };
        } else {
            req.user = { id: user.id, username: user.username, role: user.role || 'user', email: user.email };
        }
        
        next();
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.sendStatus(403);
    }
};

module.exports = authenticateToken;
