const db = require('../config/db');

const plannerService = {
    // --- PLANNER NOTES (Daily, Monthly, Half-Yearly) ---

    getNote: async (userId, dateStr, noteType = 'daily') => {
        const query = `
            SELECT * FROM planner_notes 
            WHERE user_id = $1 AND note_date = $2::date AND note_type = $3
        `;
        const res = await db.query(query, [userId, dateStr, noteType]);
        return res.rows[0];
    },

    saveNote: async (userId, dateStr, content, noteType = 'daily') => {
        const query = `
            INSERT INTO planner_notes (user_id, note_date, note_type, content)
            VALUES ($1, $2::date, $3, $4)
            ON CONFLICT (user_id, note_date, note_type) 
            DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const res = await db.query(query, [userId, dateStr, noteType, content]);
        return res.rows[0];
    },

    getNoteIndicators: async (userId, startDateStr, endDateStr, noteType = 'daily') => {
        // Return an array of dates that have content > 0 within a range
        const query = `
            SELECT note_date 
            FROM planner_notes 
            WHERE user_id = $1 
              AND note_date >= $2::date 
              AND note_date <= $3::date
              AND note_type = $4
              AND LENGTH(TRIM(content)) > 0
        `;
        const res = await db.query(query, [userId, startDateStr, endDateStr, noteType]);
        return res.rows.map(r => r.note_date);
    },

    // --- WEEKLY GOALS (Now fetched by arbitrary ranges for Timeline views) ---

    getGoalsByDateRange: async (userId, startDateStr, endDateStr) => {
        const query = `
            SELECT g.*, s.name as subject_name
            FROM weekly_goals g
            LEFT JOIN subjects s ON g.linked_subject_id = s.id
            WHERE g.user_id = $1 
              AND g.week_start_date >= $2::date 
              AND g.week_start_date <= $3::date
            ORDER BY g.created_at ASC
        `;
        const res = await db.query(query, [userId, startDateStr, endDateStr]);
        return res.rows;
    },

    createWeeklyGoal: async (userId, weekStartDateStr, title, linkedSubjectId = null) => {
        const query = `
            INSERT INTO weekly_goals (user_id, week_start_date, title, linked_subject_id)
            VALUES ($1, $2::date, $3, $4)
            RETURNING *
        `;
        const res = await db.query(query, [userId, weekStartDateStr, title, linkedSubjectId]);
        return res.rows[0];
    },

    updateWeeklyGoalStatus: async (goalId, userId, newStatus) => {
        const query = `
            UPDATE weekly_goals
            SET status = $1
            WHERE id = $2 AND user_id = $3
            RETURNING *
        `;
        const res = await db.query(query, [newStatus, goalId, userId]);
        if (res.rows.length === 0) {
            throw new Error('Goal not found or unauthorized');
        }
        return res.rows[0];
    },

    deleteWeeklyGoal: async (goalId, userId) => {
        const query = `
            DELETE FROM weekly_goals
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;
        const res = await db.query(query, [goalId, userId]);
        if (res.rows.length === 0) {
            throw new Error('Goal not found or unauthorized');
        }
        return { deletedId: goalId };
    }
};

module.exports = plannerService;
