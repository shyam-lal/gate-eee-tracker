const pool = require('../config/db');

// --- SUBJECTS ---
const getSyllabus = async (userId) => {
    // Fetch all subjects
    const subjectsRes = await pool.query(
        'SELECT * FROM subjects WHERE user_id = $1 ORDER BY id ASC',
        [userId]
    );
    const subjects = subjectsRes.rows;

    // Fetch all topics for these subjects
    // (In a larger app, might want to join or lazy load, but this is fine for now)
    const topicsRes = await pool.query(
        `SELECT t.* 
     FROM topics t 
     JOIN subjects s ON t.subject_id = s.id 
     WHERE s.user_id = $1 
     ORDER BY t.id ASC`,
        [userId]
    );

    // Nest topics under subjects
    const topics = topicsRes.rows;
    return subjects.map(sub => ({
        ...sub,
        topics: topics.filter(t => t.subject_id === sub.id)
    }));
};

const createSubject = async (userId, name) => {
    const res = await pool.query(
        'INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING *',
        [userId, name]
    );
    return res.rows[0];
};

const updateSubject = async (subjectId, name) => {
    const res = await pool.query(
        'UPDATE subjects SET name = $1 WHERE id = $2 RETURNING *',
        [name, subjectId]
    );
    return res.rows[0];
};

// --- TOPICS ---
const createTopic = async (subjectId, name, estimatedMinutes = 720, totalModules = 0) => {
    const res = await pool.query(
        'INSERT INTO topics (subject_id, name, estimated_minutes, total_modules) VALUES ($1, $2, $3, $4) RETURNING *',
        [subjectId, name, estimatedMinutes, totalModules]
    );
    return res.rows[0];
};

const updateTopic = async (topicId, updates) => {
    // updates: { name, estimated_minutes, total_modules, is_completed }
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.estimated_minutes !== undefined) { fields.push(`estimated_minutes = $${idx++}`); values.push(updates.estimated_minutes); }
    if (updates.total_modules !== undefined) { fields.push(`total_modules = $${idx++}`); values.push(updates.total_modules); }
    if (updates.is_completed !== undefined) { fields.push(`is_completed = $${idx++}`); values.push(updates.is_completed); }

    if (fields.length === 0) return null;

    values.push(topicId);
    const res = await pool.query(
        `UPDATE topics SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
    );
    return res.rows[0];
};

// --- LOGGING ---
const logActivity = async (userId, topicId, minutes = 0, modules = 0) => {
    // 1. Create Log Entry
    const logRes = await pool.query(
        'INSERT INTO activity_logs (user_id, topic_id, minutes_logged, modules_logged) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, topicId, minutes, modules]
    );

    // 2. Update Topic Totals
    const updateRes = await pool.query(
        'UPDATE topics SET logged_minutes = logged_minutes + $1, completed_modules = completed_modules + $2 WHERE id = $3 RETURNING *',
        [minutes, modules, topicId]
    );

    return { log: logRes.rows[0], topic: updateRes.rows[0] };
};

const editActivityLog = async (logId, minutes, modules) => {
    // 1. Get old log to adjust topic totals
    const oldLog = await pool.query('SELECT * FROM activity_logs WHERE id = $1', [logId]);
    if (oldLog.rows.length === 0) throw new Error('Log not found');
    const log = oldLog.rows[0];

    // 2. Update Log
    const logRes = await pool.query(
        'UPDATE activity_logs SET minutes_logged = $1, modules_logged = $2 WHERE id = $3 RETURNING *',
        [minutes, modules, logId]
    );

    // 3. Update Topic totals (subtract old, add new)
    if (log.topic_id) {
        await pool.query(
            'UPDATE topics SET logged_minutes = logged_minutes - $1 + $2, completed_modules = completed_modules - $3 + $4 WHERE id = $5',
            [log.minutes_logged || 0, minutes || 0, log.modules_logged || 0, modules || 0, log.topic_id]
        );
    }
    return logRes.rows[0];
};

const getActivityLogs = async (userId, topicId = null) => {
    let query = 'SELECT * FROM activity_logs WHERE user_id = $1';
    const params = [userId];
    if (topicId) {
        query += ' AND topic_id = $2';
        params.push(topicId);
    }
    query += ' ORDER BY created_at DESC';
    const res = await pool.query(query, params);
    return res.rows[0];
};

const logManualTime = async (userId, subjectId, minutes) => {
    // For manual time directly on subject (legacy/offline support)
    // We log it in activity_logs with null topic_id but track it in subjects table
    await pool.query(
        'INSERT INTO activity_logs (user_id, topic_id, minutes_logged) VALUES ($1, NULL, $2)',
        [userId, minutes]
    );

    const updateRes = await pool.query(
        'UPDATE subjects SET manual_time_minutes = manual_time_minutes + $1 WHERE id = $2 RETURNING *',
        [minutes, subjectId]
    );
    return updateRes.rows[0];
};

const deleteTopic = async (topicId) => {
    const res = await pool.query(
        'DELETE FROM topics WHERE id = $1 RETURNING *',
        [topicId]
    );
    return res.rows[0];
};

const deleteSubject = async (subjectId) => {
    const res = await pool.query(
        'DELETE FROM subjects WHERE id = $1 RETURNING *',
        [subjectId]
    );
    return res.rows[0];
};

const resetUserProgress = async (userId) => {
    // Delete all subjects (cascades to topics and logs)
    const res = await pool.query(
        'DELETE FROM subjects WHERE user_id = $1 RETURNING *',
        [userId]
    );
    return res.rows;
};

module.exports = {
    getSyllabus,
    createSubject,
    updateSubject,
    createTopic,
    updateTopic,
    logActivity,
    editActivityLog,
    getActivityLogs,
    logManualTime,
    deleteTopic,
    deleteSubject,
    resetUserProgress
};
