const pool = require('../config/db');

const createTool = async (userId, name, toolType = 'time', selectedExam = 'GATE') => {
    const res = await pool.query(
        `INSERT INTO tools (user_id, name, tool_type, selected_exam) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, user_id, name, tool_type, selected_exam, TO_CHAR(target_date, 'YYYY-MM-DD') as target_date, created_at`,
        [userId, name, toolType, selectedExam]
    );
    return res.rows[0];
};

const getUserTools = async (userId) => {
    const res = await pool.query(
        `SELECT id, user_id, name, tool_type, selected_exam, TO_CHAR(target_date, 'YYYY-MM-DD') as target_date, created_at 
         FROM tools WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return res.rows;
};

const getToolById = async (toolId) => {
    const res = await pool.query(
        `SELECT id, user_id, name, tool_type, selected_exam, TO_CHAR(target_date, 'YYYY-MM-DD') as target_date, created_at 
         FROM tools WHERE id = $1`,
        [toolId]
    );
    return res.rows[0];
};

const updateTool = async (toolId, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.tool_type !== undefined) { fields.push(`tool_type = $${idx++}`); values.push(updates.tool_type); }
    if (updates.selected_exam !== undefined) { fields.push(`selected_exam = $${idx++}`); values.push(updates.selected_exam); }
    if (updates.target_date !== undefined) {
        fields.push(`target_date = $${idx++}`);
        values.push(updates.target_date || null);
    }

    if (fields.length === 0) return null;

    values.push(toolId);
    const res = await pool.query(
        `UPDATE tools SET ${fields.join(', ')} WHERE id = $${idx} 
         RETURNING id, user_id, name, tool_type, selected_exam, TO_CHAR(target_date, 'YYYY-MM-DD') as target_date, created_at`,
        values
    );
    return res.rows[0];
};

const deleteTool = async (toolId) => {
    const res = await pool.query(
        'DELETE FROM tools WHERE id = $1 RETURNING *',
        [toolId]
    );
    return res.rows[0];
};

module.exports = {
    createTool,
    getUserTools,
    getToolById,
    updateTool,
    deleteTool,
};
