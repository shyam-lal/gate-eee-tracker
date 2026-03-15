const pool = require('../config/db');

/**
 * Get today's date as YYYY-MM-DD in local server time (timezone-safe).
 */
function getLocalDateStr(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculate current streak from an array of date strings sorted DESC.
 * Streak counts consecutive days from today (or yesterday) going backwards.
 */
function calculateStreak(sortedDaysDesc) {
    if (sortedDaysDesc.length === 0) return 0;

    const today = new Date();
    const todayStr = getLocalDateStr(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    // Streak must include today or yesterday to be "active"
    if (sortedDaysDesc[0] !== todayStr && sortedDaysDesc[0] !== yesterdayStr) {
        return 0;
    }

    let streak = 1;
    for (let i = 1; i < sortedDaysDesc.length; i++) {
        const prev = new Date(sortedDaysDesc[i - 1] + 'T12:00:00');
        const curr = new Date(sortedDaysDesc[i] + 'T12:00:00');
        const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Get tool-specific streak data including active days and per-day activity details.
 */
const getToolStreak = async (userId, toolId, year, month) => {
    // 1. Get ALL unique active days for this tool (for streak calculation)
    const activeDaysRes = await pool.query(`
        SELECT DISTINCT al.log_date::text as activity_date
        FROM activity_logs al
        WHERE al.tool_id = $1 AND al.user_id = $2
        ORDER BY activity_date DESC
    `, [toolId, userId]);

    const allActiveDays = activeDaysRes.rows.map(r => r.activity_date);

    const currentStreak = calculateStreak(allActiveDays);

    // 2. Get detailed activity for the requested month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const detailsRes = await pool.query(`
        SELECT
            al.log_date::text as activity_date,
            COALESCE(s.name, 'General Study') as subject_name,
            COALESCE(t.name, 'Tool Activity') as topic_name,
            SUM(COALESCE(al.minutes_logged, 0)) as total_minutes,
            SUM(COALESCE(al.modules_logged, 0)) as total_modules
        FROM activity_logs al
        LEFT JOIN topics t ON al.topic_id = t.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE al.tool_id = $1 AND al.user_id = $2
            AND al.log_date >= $3 AND al.log_date < $4
        GROUP BY al.log_date, s.name, t.name
        ORDER BY activity_date, subject_name, topic_name
    `, [toolId, userId, startDate, endDate]);

    // Group details by day
    const dayDetails = {};
    const monthActiveDays = new Set();
    for (const row of detailsRes.rows) {
        const dateKey = row.activity_date;
        monthActiveDays.add(dateKey);
        if (!dayDetails[dateKey]) dayDetails[dateKey] = [];
        dayDetails[dateKey].push({
            subject: row.subject_name,
            topic: row.topic_name,
            minutes: parseInt(row.total_minutes) || 0,
            modules: parseInt(row.total_modules) || 0
        });
    }

    return {
        currentStreak,
        activeDays: Array.from(monthActiveDays),
        allActiveDays,
        dayDetails
    };
};

/**
 * Get user-wide streak data across all tools.
 */
const getUserStreak = async (userId) => {
    // 1. Get all unique active days across ALL tools
    const activeDaysRes = await pool.query(`
        SELECT DISTINCT al.log_date::text as activity_date
        FROM activity_logs al
        WHERE al.user_id = $1
        ORDER BY activity_date DESC
    `, [userId]);

    const allActiveDays = activeDaysRes.rows.map(r => r.activity_date);

    const currentStreak = calculateStreak(allActiveDays);

    // 2. Get which tools had activity per day (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = getLocalDateStr(sixtyDaysAgo);

    const toolActivityRes = await pool.query(`
        SELECT DISTINCT
            al.log_date::text as activity_date,
            tools.id as tool_id,
            tools.name as tool_name,
            tools.tool_type
        FROM activity_logs al
        JOIN tools ON al.tool_id = tools.id
        WHERE al.user_id = $1 AND al.log_date >= $2
        ORDER BY activity_date DESC
    `, [userId, sixtyDaysAgoStr]);

    // Group by day
    const toolsByDay = {};
    for (const row of toolActivityRes.rows) {
        const dateKey = row.activity_date;
        if (!toolsByDay[dateKey]) toolsByDay[dateKey] = [];
        if (!toolsByDay[dateKey].find(t => t.id === row.tool_id)) {
            toolsByDay[dateKey].push({
                id: row.tool_id,
                name: row.tool_name,
                type: row.tool_type
            });
        }
    }

    return {
        currentStreak,
        activeDays: allActiveDays.slice(0, 90),
        toolsByDay
    };
};

module.exports = { getToolStreak, getUserStreak };
