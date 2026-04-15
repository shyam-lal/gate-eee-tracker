const pool = require('../config/db');

// ═══════════════════════════════════════════════════
// Planning Engine — Adaptive Daily Study Plan
// ═══════════════════════════════════════════════════
//
// Priority formula:
//   priority_score =
//     (weightage_norm * 0.4) +
//     (difficulty_norm * 0.2) +
//     ((1 - confidence_norm) * 0.3) +
//     (urgency_factor * 0.1) +
//     (carryover_boost)
//
// Safeguards:
//   1. Inactivity >3 days → light restart mode (reduce load 50%)
//   2. Max 6 tasks per day
//   3. At least 1 easy task guaranteed
//   4. Buffer day every 7th consecutive day (revision only)
//   5. Never generate empty plan
// ═══════════════════════════════════════════════════

const CARRYOVER_BOOST = 0.15;
const PERF_UNDERPERFORM_THRESHOLD = 0.6;
const PERF_OVERPERFORM_THRESHOLD = 0.95;
const FATIGUE_HIGH_THRESHOLD = 0.75;
const MAX_TASKS_PER_DAY = 6;
const INACTIVITY_THRESHOLD_DAYS = 3;
const BUFFER_DAY_INTERVAL = 7;

/**
 * Generate (or return cached) daily plan for today.
 */
const generateDailyPlan = async (userId) => {
    // 1. Fetch active enrollment
    const enrollmentRes = await pool.query(
        `SELECT ue.*, e.name as exam_name
         FROM user_enrollments ue
         JOIN exams e ON e.id = ue.exam_id
         WHERE ue.user_id = $1 AND ue.is_active = TRUE
         ORDER BY ue.enrolled_at DESC LIMIT 1`,
        [userId]
    );

    if (!enrollmentRes.rows.length) {
        throw new Error('No active enrollment found');
    }

    const enrollment = enrollmentRes.rows[0];
    const examId = enrollment.exam_id;
    const today = new Date().toISOString().split('T')[0];

    // 2. Check cache
    const existingRes = await pool.query(
        `SELECT * FROM user_daily_plans
         WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
        [userId, examId, today]
    );

    if (existingRes.rows.length) {
        return existingRes.rows[0];
    }

    // 3. Fetch adaptive signals
    const [yesterdayData, fatigueScore, inactivityDays, consecutiveActiveDays] = await Promise.all([
        fetchYesterdayPerformance(userId, examId),
        computeFatigueScore(userId),
        computeInactivityDays(userId),
        computeConsecutiveActiveDays(userId),
    ]);

    // ── SAFEGUARD 1: Inactivity detection ──
    const isInactive = inactivityDays >= INACTIVITY_THRESHOLD_DAYS;

    // ── SAFEGUARD 4: Buffer day every 7 consecutive days ──
    const isBufferDay = consecutiveActiveDays > 0 && consecutiveActiveDays % BUFFER_DAY_INTERVAL === 0;

    // 4. Fetch all topic states + metadata
    const topicsRes = await pool.query(
        `SELECT et.id as topic_id, et.name as topic_name,
                et.difficulty_level, et.weightage as topic_weightage,
                et.estimated_hours, et.prerequisites,
                es.id as subject_id, es.name as subject_name,
                es.weightage as subject_weightage,
                COALESCE(uts.confidence, 0) as confidence,
                COALESCE(uts.status, 'NOT_STARTED') as status,
                COALESCE(uts.total_time_spent_minutes, 0) as time_spent
         FROM exam_topics et
         JOIN exam_subjects es ON es.id = et.subject_id
         LEFT JOIN user_topic_states uts ON uts.topic_id = et.id AND uts.user_id = $1
         WHERE es.exam_id = $2
         ORDER BY es.sort_order ASC, et.sort_order ASC`,
        [userId, examId]
    );

    const topics = topicsRes.rows;
    if (!topics.length) {
        throw new Error('No topics found for this exam');
    }

    // 5. Compute normalization ranges
    const maxWeightage = Math.max(...topics.map(t => parseFloat(t.topic_weightage) || 1));
    const maxDifficulty = 5;
    const maxConfidence = 5;

    const daysRemaining = enrollment.target_date
        ? Math.max(1, Math.ceil((new Date(enrollment.target_date) - new Date()) / (1000 * 60 * 60 * 24)))
        : 180;

    // 6. Build set of unfinished topic IDs from yesterday
    const unfinishedTopicIds = new Set(yesterdayData.unfinishedTopicIds);

    // 7. Score all topics
    const scoredTopics = topics.map(t => {
        const weightageNorm = (parseFloat(t.topic_weightage) || 1) / maxWeightage;
        const difficultyNorm = (parseInt(t.difficulty_level) || 3) / maxDifficulty;
        const confidenceNorm = parseInt(t.confidence) / maxConfidence;

        const completionRatio = t.status === 'MASTERED' ? 1.0
            : t.status === 'REVISING' ? 0.7
            : t.status === 'LEARNING' ? 0.3
            : 0.0;
        const urgencyFactor = Math.min(1.0, (1 - completionRatio) * (90 / daysRemaining));

        const carryoverBoost = unfinishedTopicIds.has(t.topic_id) ? CARRYOVER_BOOST : 0;

        const priorityScore =
            (weightageNorm * 0.4) +
            (difficultyNorm * 0.2) +
            ((1 - confidenceNorm) * 0.3) +
            (urgencyFactor * 0.1) +
            carryoverBoost;

        return {
            ...t,
            difficulty_level_raw: parseInt(t.difficulty_level) || 3,
            weightage_norm: weightageNorm,
            difficulty_norm: difficultyNorm,
            confidence_norm: confidenceNorm,
            urgency_factor: urgencyFactor,
            carryover: unfinishedTopicIds.has(t.topic_id),
            priority_score: Math.round(priorityScore * 1000) / 1000,
        };
    });

    // 8. Sort by priority DESC
    scoredTopics.sort((a, b) => b.priority_score - a.priority_score);

    // 9. Separate into LEARN and REVISE pools
    const learnPool = scoredTopics.filter(t =>
        t.status === 'NOT_STARTED' || t.status === 'LEARNING'
    );
    const revisePool = scoredTopics.filter(t =>
        t.status === 'REVISING' || t.status === 'MASTERED'
    );

    // 10. Compute adjusted daily minutes
    let baseDailyMinutes = (parseFloat(enrollment.daily_available_hours) || 2) * 60;
    let perfMultiplier = computePerformanceMultiplier(yesterdayData.completionRate);

    // ── SAFEGUARD 1: Inactivity → light restart mode (50% load) ──
    if (isInactive) {
        perfMultiplier = 0.50;
    }

    const adjustedDailyMinutes = Math.round(baseDailyMinutes * perfMultiplier);

    // 11. Compute learn/revise split
    let learnRatio, reviseRatio;

    if (isBufferDay) {
        // ── SAFEGUARD 4: Buffer day → revision only ──
        learnRatio = 0.0;
        reviseRatio = 0.90;
    } else {
        ({ learnRatio, reviseRatio } = computeFatigueRatios(fatigueScore));
    }

    const learnMinutes = Math.floor(adjustedDailyMinutes * learnRatio);
    const reviseMinutes = Math.floor(adjustedDailyMinutes * reviseRatio);

    // 12. Generate tasks
    let tasks = [];

    if (!isBufferDay) {
        // Fill LEARN tasks
        let learnRemaining = learnMinutes;
        for (const topic of learnPool) {
            if (learnRemaining <= 0 || tasks.length >= MAX_TASKS_PER_DAY) break;

            const allocation = Math.min(
                Math.max(15, Math.round(topic.priority_score * 60)),
                60,
                learnRemaining
            );

            tasks.push({
                topic_id: topic.topic_id,
                topic_name: topic.topic_name,
                subject_name: topic.subject_name,
                type: 'LEARN',
                duration_minutes: allocation,
                priority_score: topic.priority_score,
                carryover: topic.carryover,
                difficulty_level: topic.difficulty_level_raw,
            });

            learnRemaining -= allocation;
        }
    }

    // Fill REVISE tasks
    let reviseRemaining = reviseMinutes;
    for (const topic of revisePool) {
        if (reviseRemaining <= 0 || tasks.length >= MAX_TASKS_PER_DAY) break;

        const allocation = Math.min(
            Math.max(10, Math.round(topic.priority_score * 30)),
            30,
            reviseRemaining
        );

        tasks.push({
            topic_id: topic.topic_id,
            topic_name: topic.topic_name,
            subject_name: topic.subject_name,
            type: 'REVISE',
            duration_minutes: allocation,
            priority_score: topic.priority_score,
            carryover: topic.carryover,
            difficulty_level: topic.difficulty_level_raw,
        });

        reviseRemaining -= allocation;
    }

    // ── SAFEGUARD 2: Cap at MAX_TASKS_PER_DAY ──
    // (already enforced in loops above, but safety trim)
    if (tasks.length > MAX_TASKS_PER_DAY) {
        tasks = tasks.slice(0, MAX_TASKS_PER_DAY);
    }

    // ── SAFEGUARD 3: Guarantee at least 1 easy task ──
    tasks = guaranteeEasyTask(tasks, scoredTopics, isBufferDay);

    // ── SAFEGUARD 5: Never generate empty plan ──
    if (tasks.length === 0) {
        tasks = generateFallbackPlan(scoredTopics);
    }

    // 13. Calculate summary
    const totalLearn = tasks.filter(t => t.type === 'LEARN').reduce((sum, t) => sum + t.duration_minutes, 0);
    const totalRevise = tasks.filter(t => t.type === 'REVISE').reduce((sum, t) => sum + t.duration_minutes, 0);
    const totalMinutes = totalLearn + totalRevise;

    // 14. Build metadata
    const metadata = {
        adjustments: {
            performance_multiplier: perfMultiplier,
            fatigue_score: fatigueScore,
            learn_ratio: learnRatio,
            revise_ratio: reviseRatio,
            base_daily_minutes: baseDailyMinutes,
            adjusted_daily_minutes: adjustedDailyMinutes,
            carryover_count: tasks.filter(t => t.carryover).length,
        },
        safeguards: {
            is_inactive_restart: isInactive,
            inactivity_days: inactivityDays,
            is_buffer_day: isBufferDay,
            consecutive_active_days: consecutiveActiveDays,
            tasks_capped: tasks.length >= MAX_TASKS_PER_DAY,
            easy_task_guaranteed: true,
        },
        yesterday: {
            completion_rate: yesterdayData.completionRate,
            completed_tasks: yesterdayData.completedCount,
            total_tasks: yesterdayData.totalCount,
            actual_minutes: yesterdayData.actualMinutes,
        },
    };

    // 15. Save to DB
    const planRes = await pool.query(
        `INSERT INTO user_daily_plans (user_id, exam_id, plan_date, tasks, total_minutes, learn_minutes, revise_minutes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id, exam_id, plan_date) DO UPDATE SET
            tasks = $4,
            total_minutes = $5,
            learn_minutes = $6,
            revise_minutes = $7,
            updated_at = NOW()
         RETURNING *`,
        [userId, examId, today, JSON.stringify({ tasks, metadata }), totalMinutes, totalLearn, totalRevise]
    );

    const plan = planRes.rows[0];
    plan.tasks = { tasks, metadata };
    return plan;
};


// ═══════════════════════════════════════════════════
// Safeguard Helpers
// ═══════════════════════════════════════════════════

/**
 * SAFEGUARD 3: Ensure at least one easy task (difficulty_level 1-2) in the plan.
 * If none exist, swap out the lowest-priority task for an easy one.
 */
function guaranteeEasyTask(tasks, scoredTopics, isBufferDay) {
    const hasEasy = tasks.some(t => t.difficulty_level <= 2);
    if (hasEasy || tasks.length === 0) return tasks;

    // Find easiest topic not already in plan
    const taskTopicIds = new Set(tasks.map(t => t.topic_id));
    const pool = isBufferDay ? 'REVISING' : null;

    const easyCandidate = scoredTopics.find(t =>
        t.difficulty_level_raw <= 2 &&
        !taskTopicIds.has(t.topic_id) &&
        (pool === null || t.status === pool || t.status === 'MASTERED')
    ) || scoredTopics.find(t =>
        t.difficulty_level_raw <= 2 && !taskTopicIds.has(t.topic_id)
    );

    if (!easyCandidate) return tasks; // no easy topics exist at all

    // Replace the lowest-priority task
    const result = [...tasks];
    result.sort((a, b) => a.priority_score - b.priority_score);
    result[0] = {
        topic_id: easyCandidate.topic_id,
        topic_name: easyCandidate.topic_name,
        subject_name: easyCandidate.subject_name,
        type: (easyCandidate.status === 'REVISING' || easyCandidate.status === 'MASTERED') ? 'REVISE' : 'LEARN',
        duration_minutes: 20, // easy task = short
        priority_score: easyCandidate.priority_score,
        carryover: false,
        difficulty_level: easyCandidate.difficulty_level_raw,
        easy_guarantee: true,
    };

    // Re-sort by priority DESC for final output
    result.sort((a, b) => b.priority_score - a.priority_score);
    return result;
}

/**
 * SAFEGUARD 5: Generate a minimal fallback plan when normal generation yields empty.
 * Picks top 2 topics: 1 learn + 1 revise (or 2 of whatever's available).
 */
function generateFallbackPlan(scoredTopics) {
    const tasks = [];
    const learnCandidate = scoredTopics.find(t =>
        t.status === 'NOT_STARTED' || t.status === 'LEARNING'
    );
    const reviseCandidate = scoredTopics.find(t =>
        t.status === 'REVISING' || t.status === 'MASTERED'
    );

    if (learnCandidate) {
        tasks.push({
            topic_id: learnCandidate.topic_id,
            topic_name: learnCandidate.topic_name,
            subject_name: learnCandidate.subject_name,
            type: 'LEARN',
            duration_minutes: 30,
            priority_score: learnCandidate.priority_score,
            carryover: false,
            difficulty_level: learnCandidate.difficulty_level_raw,
            fallback: true,
        });
    }

    if (reviseCandidate) {
        tasks.push({
            topic_id: reviseCandidate.topic_id,
            topic_name: reviseCandidate.topic_name,
            subject_name: reviseCandidate.subject_name,
            type: 'REVISE',
            duration_minutes: 20,
            priority_score: reviseCandidate.priority_score,
            carryover: false,
            difficulty_level: reviseCandidate.difficulty_level_raw,
            fallback: true,
        });
    }

    // If still empty (all mastered, no learn available), pick any top topic
    if (tasks.length === 0 && scoredTopics.length > 0) {
        const t = scoredTopics[0];
        tasks.push({
            topic_id: t.topic_id,
            topic_name: t.topic_name,
            subject_name: t.subject_name,
            type: 'REVISE',
            duration_minutes: 20,
            priority_score: t.priority_score,
            carryover: false,
            difficulty_level: t.difficulty_level_raw,
            fallback: true,
        });
    }

    return tasks;
}


// ═══════════════════════════════════════════════════
// Adaptive Signal Fetchers
// ═══════════════════════════════════════════════════

/**
 * Fetch yesterday's plan + completion data.
 */
async function fetchYesterdayPerformance(userId, examId) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const planRes = await pool.query(
        `SELECT tasks FROM user_daily_plans
         WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
        [userId, examId, yesterdayStr]
    );

    if (!planRes.rows.length) {
        return { completionRate: 1.0, completedCount: 0, totalCount: 0, actualMinutes: 0, unfinishedTopicIds: [] };
    }

    const rawTasks = planRes.rows[0].tasks;
    const plannedTasks = Array.isArray(rawTasks) ? rawTasks : (rawTasks.tasks || []);

    if (!plannedTasks.length) {
        return { completionRate: 1.0, completedCount: 0, totalCount: 0, actualMinutes: 0, unfinishedTopicIds: [] };
    }

    const logsRes = await pool.query(
        `SELECT topic_id, task_type, actual_duration, completed
         FROM user_task_logs
         WHERE user_id = $1 AND plan_date = $2`,
        [userId, yesterdayStr]
    );

    const completedSet = new Set(
        logsRes.rows.filter(l => l.completed).map(l => `${l.topic_id}-${l.task_type}`)
    );

    const actualMinutes = logsRes.rows.reduce((sum, l) => sum + (l.actual_duration || 0), 0);
    const totalCount = plannedTasks.length;
    const completedCount = plannedTasks.filter(t => completedSet.has(`${t.topic_id}-${t.type}`)).length;

    const unfinishedTopicIds = plannedTasks
        .filter(t => !completedSet.has(`${t.topic_id}-${t.type}`))
        .map(t => t.topic_id);

    return {
        completionRate: totalCount > 0 ? completedCount / totalCount : 1.0,
        completedCount,
        totalCount,
        actualMinutes,
        unfinishedTopicIds,
    };
}

/**
 * Compute fatigue score from last 3 days. 0.0 (rested) → 1.0 (exhausted).
 */
async function computeFatigueScore(userId) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const res = await pool.query(
        `SELECT plan_date,
                COALESCE(SUM(actual_duration), 0) as actual_minutes,
                COALESCE(SUM(planned_duration), 0) as planned_minutes,
                COUNT(*) as task_count
         FROM user_task_logs
         WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3
         GROUP BY plan_date
         ORDER BY plan_date DESC`,
        [userId, threeDaysAgoStr, yesterdayStr]
    );

    if (!res.rows.length) return 0.0;

    const days = res.rows;
    let fatigue = 0;

    const totalActual = days.reduce((s, d) => s + parseInt(d.actual_minutes), 0);
    const totalPlanned = days.reduce((s, d) => s + Math.max(parseInt(d.planned_minutes), 1), 0);
    const volumeRatio = Math.min(1.0, totalActual / Math.max(totalPlanned, 1));
    fatigue += volumeRatio * 0.5;

    const activeDays = days.length;
    fatigue += (activeDays / 3) * 0.3;

    if (days.length >= 2) {
        const recent = parseInt(days[0].actual_minutes);
        const older = parseInt(days[days.length - 1].actual_minutes);
        if (older > 0 && recent > older) {
            fatigue += Math.min(0.2, ((recent - older) / older) * 0.2);
        }
    }

    return Math.min(1.0, Math.round(fatigue * 100) / 100);
}

/**
 * SAFEGUARD 1: How many days since the user's last task log.
 * Returns 0 if active today/yesterday, up to N for N days inactive.
 */
async function computeInactivityDays(userId) {
    const res = await pool.query(
        `SELECT MAX(plan_date) as last_active
         FROM user_task_logs
         WHERE user_id = $1 AND completed = TRUE`,
        [userId]
    );

    if (!res.rows[0].last_active) {
        // No activity ever — check enrollment date as fallback
        const enrollRes = await pool.query(
            `SELECT enrolled_at FROM user_enrollments
             WHERE user_id = $1 AND is_active = TRUE
             ORDER BY enrolled_at DESC LIMIT 1`,
            [userId]
        );
        if (!enrollRes.rows.length) return 999;
        const enrollDate = new Date(enrollRes.rows[0].enrolled_at);
        return Math.floor((new Date() - enrollDate) / (1000 * 60 * 60 * 24));
    }

    const lastActive = new Date(res.rows[0].last_active);
    return Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24));
}

/**
 * SAFEGUARD 4: Count consecutive active days up to today.
 * An "active day" = has at least 1 completed task log.
 */
async function computeConsecutiveActiveDays(userId) {
    const res = await pool.query(
        `SELECT DISTINCT plan_date
         FROM user_task_logs
         WHERE user_id = $1 AND completed = TRUE
         ORDER BY plan_date DESC
         LIMIT 14`,
        [userId]
    );

    if (!res.rows.length) return 0;

    let streak = 0;
    // Start from yesterday and go backwards
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);

    const activeDates = new Set(
        res.rows.map(r => {
            const d = r.plan_date instanceof Date ? r.plan_date : new Date(r.plan_date);
            return d.toISOString().split('T')[0];
        })
    );

    for (let i = 0; i < 14; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}


// ═══════════════════════════════════════════════════
// Adjustment Computations
// ═══════════════════════════════════════════════════

function computePerformanceMultiplier(completionRate) {
    if (completionRate < PERF_UNDERPERFORM_THRESHOLD) {
        return 0.80 + (completionRate / PERF_UNDERPERFORM_THRESHOLD) * 0.20;
    }
    if (completionRate > PERF_OVERPERFORM_THRESHOLD) {
        return 1.05;
    }
    return 1.0;
}

function computeFatigueRatios(fatigueScore) {
    if (fatigueScore >= FATIGUE_HIGH_THRESHOLD) {
        return { learnRatio: 0.50, reviseRatio: 0.40 };
    }
    if (fatigueScore >= 0.5) {
        return { learnRatio: 0.60, reviseRatio: 0.30 };
    }
    return { learnRatio: 0.70, reviseRatio: 0.20 };
}


// ═══════════════════════════════════════════════════
// Query & Regeneration Functions
// ═══════════════════════════════════════════════════

const getPlanByDate = async (userId, date) => {
    const res = await pool.query(
        `SELECT * FROM user_daily_plans
         WHERE user_id = $1 AND plan_date = $2
         ORDER BY created_at DESC LIMIT 1`,
        [userId, date]
    );
    return res.rows[0] || null;
};

const getPlanHistory = async (userId, startDate, endDate) => {
    const res = await pool.query(
        `SELECT * FROM user_daily_plans
         WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3
         ORDER BY plan_date DESC`,
        [userId, startDate, endDate]
    );
    return res.rows;
};

const regeneratePlan = async (userId) => {
    const enrollmentRes = await pool.query(
        `SELECT exam_id FROM user_enrollments
         WHERE user_id = $1 AND is_active = TRUE
         ORDER BY enrolled_at DESC LIMIT 1`,
        [userId]
    );

    if (!enrollmentRes.rows.length) {
        throw new Error('No active enrollment found');
    }

    const today = new Date().toISOString().split('T')[0];

    await pool.query(
        `DELETE FROM user_daily_plans
         WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
        [userId, enrollmentRes.rows[0].exam_id, today]
    );

    return generateDailyPlan(userId);
};

module.exports = {
    generateDailyPlan,
    getPlanByDate,
    getPlanHistory,
    regeneratePlan,
};
