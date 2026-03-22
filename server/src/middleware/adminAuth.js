const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Admin-only middleware. Must be used AFTER authenticateToken.
 * Checks that req.user has role 'admin' or 'super_admin'.
 */
const adminAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

module.exports = adminAuth;
