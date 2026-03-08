const db = require('../config/db');

/**
 * Get today's date as YYYY-MM-DD in local server time
 */
function getLocalDateStr(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const focusService = {
    // 1. Log a focus session
    logSession: async (userId, toolId, durationMinutes, linkedSubjectId, linkedTopicId, notes) => {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Insert the focus session itself
            const sessionRes = await client.query(
                `INSERT INTO focus_sessions 
                 (user_id, tool_id, duration_minutes, linked_subject_id, linked_topic_id, notes) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userId, toolId, durationMinutes, linkedSubjectId || null, linkedTopicId || null, notes || null]
            );

            // MAGIC FEATURE: If a topic is linked, automatically log the study time there as well!
            if (linkedTopicId) {
                // Determine if we should also pass a subjectId safely
                const logSubjectQuery = linkedSubjectId ? linkedSubjectId : null;

                // Sync to activity logs for streaks / course tracking
                // First check if a log exists for this topic today
                const todayStr = getLocalDateStr(new Date());
                const existingLog = await client.query(
                    'SELECT id, minutes_logged FROM activity_logs WHERE user_id = $1 AND topic_id = $2 AND log_date = $3',
                    [userId, linkedTopicId, todayStr]
                );

                if (existingLog.rows.length > 0) {
                    await client.query(
                        'UPDATE activity_logs SET minutes_logged = minutes_logged + $1 WHERE id = $2',
                        [durationMinutes, existingLog.rows[0].id]
                    );
                } else {
                    await client.query(
                        'INSERT INTO activity_logs (user_id, topic_id, minutes_logged, log_date) VALUES ($1, $2, $3, $4)',
                        [userId, linkedTopicId, durationMinutes, todayStr]
                    );
                }

                // Sync `logged_minutes` on the topic table itself
                await client.query(
                    'UPDATE topics SET logged_minutes = logged_minutes + $1 WHERE id = $2',
                    [durationMinutes, linkedTopicId]
                );
            }

            await client.query('COMMIT');
            return sessionRes.rows[0];
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // 2. Get session history
    getSessions: async (toolId) => {
        const res = await db.query(
            `SELECT fs.*, s.name as subject_name, t.name as topic_name
             FROM focus_sessions fs
             LEFT JOIN subjects s ON fs.linked_subject_id = s.id
             LEFT JOIN topics t ON fs.linked_topic_id = t.id
             WHERE fs.tool_id = $1
             ORDER BY fs.completed_at DESC
             LIMIT 50`,
            [toolId]
        );
        return res.rows;
    },

    // 3. Get Focus Analytics
    getStats: async (toolId) => {
        const todayStr = getLocalDateStr(new Date());

        const res = await db.query(
            `SELECT 
                SUM(duration_minutes) as total_time,
                SUM(CASE WHEN DATE(completed_at AT TIME ZONE 'UTC') = $2 THEN duration_minutes ELSE 0 END) as time_today
             FROM focus_sessions 
             WHERE tool_id = $1`,
            [toolId, todayStr]
        );

        const stats = res.rows[0];
        return {
            totalTime: parseInt(stats.total_time) || 0,
            timeToday: parseInt(stats.time_today) || 0,
        };
    },

    // 4. Get items users can tag
    getTaggableItems: async (userId) => {
        // Fetch subjects from the user's OTHER tools (Course / Module trackers)
        const res = await db.query(
            `SELECT 
                s.id as subject_id, s.name as subject_name, 
                t.id as topic_id, t.name as topic_name
             FROM subjects s
             LEFT JOIN topics t ON s.id = t.subject_id
             WHERE s.user_id = $1
             ORDER BY s.id, t.id`,
            [userId]
        );

        // Group the flat SQL response into a nice nested structure
        const subjectsMap = {};
        for (const row of res.rows) {
            if (!subjectsMap[row.subject_id]) {
                subjectsMap[row.subject_id] = {
                    id: row.subject_id,
                    name: row.subject_name,
                    topics: []
                };
            }
            if (row.topic_id) {
                subjectsMap[row.subject_id].topics.push({
                    id: row.topic_id,
                    name: row.topic_name
                });
            }
        }

        return Object.values(subjectsMap);
    }
};

module.exports = focusService;
