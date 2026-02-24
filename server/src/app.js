const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/syllabus', require('./routes/syllabusRoutes'));
app.use('/api/social', require('./routes/socialRoutes'));

// Serve Static Files
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));


// Handle React Routing (SPA)
// Express 5 does NOT support '*' wildcard in app.get(). Use app.use() instead.
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
