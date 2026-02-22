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

// --- TOPICS ---
const createTopic = async (subjectId, name, estimatedMinutes = 720) => {
    const res = await pool.query(
        'INSERT INTO topics (subject_id, name, estimated_minutes) VALUES ($1, $2, $3) RETURNING *',
        [subjectId, name, estimatedMinutes]
    );
    return res.rows[0];
};

const updateTopic = async (topicId, updates) => {
    // updates: { name, estimated_minutes, is_completed }
    // Construct dynamic query
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.estimated_minutes !== undefined) { fields.push(`estimated_minutes = $${idx++}`); values.push(updates.estimated_minutes); }
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
const logTime = async (userId, topicId, minutes) => {
    // 1. Create Log Entry
    await pool.query(
        'INSERT INTO activity_logs (user_id, topic_id, minutes_logged) VALUES ($1, $2, $3)',
        [userId, topicId, minutes]
    );

    // 2. Update Topic Total
    // We increment the logged_minutes for the topic
    const updateRes = await pool.query(
        'UPDATE topics SET logged_minutes = logged_minutes + $1 WHERE id = $2 RETURNING *',
        [minutes, topicId]
    );

    return updateRes.rows[0];
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

module.exports = {
    getSyllabus,
    createSubject,
    createTopic,
    updateTopic,
    logTime,
    logManualTime,
    deleteTopic,
    deleteSubject
};
