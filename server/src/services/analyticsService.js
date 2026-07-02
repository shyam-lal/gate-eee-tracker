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
                SELECT to_char(al.log_date::date, 'YYYY-MM-DD') as dt, 
                       (COALESCE(al.minutes_logged, 0) + 
                       (COALESCE(al.modules_logged, 0) * (COALESCE(t.estimated_minutes, 0) / GREATEST(COALESCE(t.total_modules, 1), 1)))) as mins
                FROM activity_logs al
                LEFT JOIN topics t ON al.topic_id = t.id
                WHERE al.user_id = $1 AND al.log_date >= $2
                
                UNION ALL
                
                -- Unlinked focus sessions
                SELECT to_char(DATE(completed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as dt, SUM(duration_minutes) as mins
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

        // Create a 30-day zero-filled array
        const heatmapData = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            heatmapData.push({
                date: getLocalDateStr(d),
                value: 0
            });
        }

        // Fill with actual data
        heatmapRes.rows.forEach(row => {
            const rowDateStr = row.date; // already formatted as 'YYYY-MM-DD' string from Postgres
            const target = heatmapData.find(d => d.date === rowDateStr);
            if (target) {
                target.value = parseInt(row.value);
            }
        });

        // Calculate Consistency Score (days with volume > 0)
        const activeDays = heatmapData.filter(d => d.value > 0).length;
        const consistencyScore = Math.round((activeDays / 30) * 100);

        // 2. Tool Distribution (Last 30 Days)
        // Let's group time by Tool.
        // For activity_logs, we need to join back to topics -> subjects -> tools
        const distributionQuery = `
            WITH tool_times AS (
                SELECT tl.name as tool_name, 
                       (COALESCE(al.minutes_logged, 0) + 
                       (COALESCE(al.modules_logged, 0) * (COALESCE(top.estimated_minutes, 0) / GREATEST(COALESCE(top.total_modules, 1), 1)))) as mins
                FROM activity_logs al
                JOIN topics top ON al.topic_id = top.id
                JOIN subjects s ON top.subject_id = s.id
                JOIN tools tl ON s.tool_id = tl.id
                WHERE al.user_id = $1 AND al.log_date >= $2
                
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
    },

    getRecentActivities: async (userId, limit = 5) => {
        const query = `
            SELECT 
                al.id,
                al.minutes_logged as value,
                al.created_at,
                t.name as topic_name,
                tl.name as tool_name,
                tl.tool_type
            FROM activity_logs al
            LEFT JOIN topics t ON al.topic_id = t.id
            LEFT JOIN tools tl ON al.tool_id = tl.id
            WHERE al.user_id = $1
            ORDER BY al.created_at DESC
            LIMIT $2
        `;
        const res = await db.query(query, [userId, limit]);
        return res.rows;
    }
};

module.exports = analyticsService;
