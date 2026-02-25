const express = require('express');
const cors = require('cors');
const path = require('path');

// Load .env from the server directory (handles running from any cwd)
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Verify critical env vars on startup
console.log('--- Environment Check ---');
console.log('PORT:', process.env.PORT || '5000 (default)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ MISSING!');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ MISSING!');
console.log('-------------------------');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/syllabus', require('./routes/syllabusRoutes'));
app.use('/api/social', require('./routes/socialRoutes'));

// Serve Static Files (production only)
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Handle React Routing (SPA)
// Express 5 does NOT support '*' wildcard in app.get(). Use app.use() instead.
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler for API routes — returns JSON instead of HTML
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
