const db = require('../config/db');

const plannerService = {
    // --- DAILY NOTES ---

    getDailyNote: async (userId, dateStr) => {
        // Find existing note
        const query = `
            SELECT id, content, updated_at
            FROM daily_notes
            WHERE user_id = $1 AND note_date = $2::date
        `;
        const res = await db.query(query, [userId, dateStr]);

        // If not found, return empty placeholder
        if (res.rows.length === 0) {
            return {
                content: '',
                isNew: true
            };
        }

        return res.rows[0];
    },

    saveDailyNote: async (userId, dateStr, content) => {
        // Upsert the daily note
        const query = `
            INSERT INTO daily_notes (user_id, note_date, content, updated_at)
            VALUES ($1, $2::date, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, note_date) 
            DO UPDATE SET 
                content = EXCLUDED.content,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id, content, updated_at
        `;
        const res = await db.query(query, [userId, dateStr, content]);
        return res.rows[0];
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
