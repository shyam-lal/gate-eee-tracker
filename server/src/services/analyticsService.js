const db = require('../config/db');

/**
 * Get a local date string YYYY-MM-DD from a Date object
 */
function getLocalDateStr(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const analyticsService = {
    getGlobalStats: async (userId) => {
        // We want to fetch data for the last 30 days
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const thirtyDaysAgoStr = getLocalDateStr(thirtyDaysAgo);

        // 1. Heatmap Data (from both activity_logs and focus_sessions without double counting)
        // Since focus_sessions automatically insert to activity_logs if linked, we need to be careful.
        // `activity_logs` tracks Course/Module time. 
        // `focus_sessions` tracks Focus time.
        // It's probably safest, for a unified graphic, to just use `activity_logs` for topics 
        // AND unlinked `focus_sessions`.

        // Let's create a combined view of daily minutes for the last 30 days
        const heatmapQuery = `
            WITH combined_daily AS (
                -- Topic logs (includes linked focus sessions)
                SELECT log_date::date as dt, SUM(minutes_logged) as mins
                FROM activity_logs
                WHERE user_id = $1 AND log_date >= $2
                GROUP BY log_date
                
                UNION ALL
                
                -- Unlinked focus sessions
                SELECT DATE(completed_at AT TIME ZONE 'UTC') as dt, SUM(duration_minutes) as mins
                FROM focus_sessions
                WHERE user_id = $1 AND completed_at >= $2::date AND linked_topic_id IS NULL
                GROUP BY DATE(completed_at AT TIME ZONE 'UTC')
            )
            SELECT dt as date, SUM(mins) as value
            FROM combined_daily
            GROUP BY dt
            ORDER BY dt ASC;
        `;
        const heatmapRes = await db.query(heatmapQuery, [userId, thirtyDaysAgoStr]);

        // Format the dates as purely local date strings for the frontend
        const heatmapData = heatmapRes.rows.map(row => {
            const dateObj = new Date(row.date);
            // JS dates from postgres might be midnight UTC, which shifts if local timezone is behind.
            // Using split('T')[0] from standard ISO string might drift if it's offset.
            // But doing `.toISOString()` on a purely constructed date works.
            return {
                date: row.date.toISOString().split('T')[0],
                value: parseInt(row.value)
            };
        });

        // Calculate Consistency Score
        const activeDays = new Set(heatmapData.map(d => d.date)).size;
        const consistencyScore = Math.round((activeDays / 30) * 100);

        // 2. Tool Distribution (Last 30 Days)
        // Let's group time by Tool.
        // For activity_logs, we need to join back to topics -> subjects -> tools
        const distributionQuery = `
            WITH tool_times AS (
                SELECT t.name as tool_name, SUM(al.minutes_logged) as mins
                FROM activity_logs al
                JOIN topics top ON al.topic_id = top.id
                JOIN subjects s ON top.subject_id = s.id
                JOIN tools t ON s.tool_id = t.id
                WHERE al.user_id = $1 AND al.log_date >= $2
                GROUP BY t.name
                
                UNION ALL
                
                SELECT t.name as tool_name, SUM(fs.duration_minutes) as mins
                FROM focus_sessions fs
                JOIN tools t ON fs.tool_id = t.id
                WHERE fs.user_id = $1 AND fs.completed_at >= $2::date AND fs.linked_topic_id IS NULL
                GROUP BY t.name
            )
            SELECT tool_name as name, SUM(mins) as value
            FROM tool_times
            GROUP BY tool_name
            ORDER BY value DESC;
        `;
        const distributionRes = await db.query(distributionQuery, [userId, thirtyDaysAgoStr]);
        const toolDistribution = distributionRes.rows.map(r => ({
            name: r.name,
            value: parseInt(r.value)
        }));

        // 3. Weekly Recap (Last 7 days vs Previous 7 days)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const sevenDaysAgoStr = getLocalDateStr(sevenDaysAgo);

        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(today.getDate() - 14);
        const fourteenDaysAgoStr = getLocalDateStr(fourteenDaysAgo);

        // Calculate total time for last 7 days from the existing heatmap string (easier to do in JS since we have it)
        const totalLast7 = heatmapData
            .filter(d => d.date >= sevenDaysAgoStr)
            .reduce((sum, d) => sum + d.value, 0);

        const totalPrev7 = heatmapData
            .filter(d => d.date >= fourteenDaysAgoStr && d.date < sevenDaysAgoStr)
            .reduce((sum, d) => sum + d.value, 0);

        let percentageChange = 0;
        if (totalPrev7 > 0) {
            percentageChange = Math.round(((totalLast7 - totalPrev7) / totalPrev7) * 100);
        } else if (totalLast7 > 0) {
            percentageChange = 100;
        }

        return {
            heatmapData,
            consistencyScore,
            toolDistribution,
            weeklyRecap: {
                currentWeekMins: totalLast7,
                previousWeekMins: totalPrev7,
                percentageChange
            }
        };
    }
};

module.exports = analyticsService;
