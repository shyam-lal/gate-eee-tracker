const pool = require('../config/db');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════
// Daily Battle Plan Engine
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
//   1. Inactivity >3 days → light restart (50% load)
//   2. Max 6 tasks per day
//   3. At least 1 easy task guaranteed
//   4. Buffer day every 7th consecutive day (revision only)
//   5. Never generate empty plan
//   6. Smart first plan (easy mode for new users)
//
// Task lifecycle: PENDING → ACTIVE → COMPLETED | SKIPPED
//   - Only ONE task ACTIVE at a time
//   - Auto-progression on complete
// ═══════════════════════════════════════════════════

const CARRYOVER_BOOST = 0.15;
const PERF_UNDERPERFORM_THRESHOLD = 0.6;
const PERF_OVERPERFORM_THRESHOLD = 0.95;
const FATIGUE_HIGH_THRESHOLD = 0.75;
const MAX_TASKS_PER_DAY = 6;
const FIRST_PLAN_MAX_TASKS = 4;
const INACTIVITY_THRESHOLD_DAYS = 3;
const BUFFER_DAY_INTERVAL = 7;

/**
 * Generate (or return cached) today's Daily Battle Plan.
 * If plan exists, returns it. Otherwise generates a new one.
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

    // 2. Check for existing plan (cache)
    const existingRes = await pool.query(
        `SELECT * FROM user_daily_plans
         WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
        [userId, examId, today]
    );

    if (existingRes.rows.length) {
        return existingRes.rows[0];
    }

    // 3. Resolve yesterday's stale ACTIVE tasks → mark PENDING in yesterday's plan
    await resolveStaleActiveTasks(userId, examId, today);

    // 4. Fetch adaptive signals
    const [yesterdayData, fatigueScore, inactivityDays, consecutiveActiveDays, streak] = await Promise.all([
        fetchYesterdayPerformance(userId, examId),
        computeFatigueScore(userId),
        computeInactivityDays(userId),
        computeConsecutiveActiveDays(userId),
        computeStreak(userId, examId),
    ]);

    // Detect if this is the user's first-ever plan
    const isFirstPlan = await checkIsFirstPlan(userId, examId);

    const isInactive = inactivityDays >= INACTIVITY_THRESHOLD_DAYS;
    const isBufferDay = consecutiveActiveDays > 0 && consecutiveActiveDays % BUFFER_DAY_INTERVAL === 0;

    // 5. Fetch all topic states + metadata
    const topicsRes = await pool.query(
        `SELECT et.id as topic_id, et.name as topic_name,
                et.difficulty_level, et.weightage as topic_weightage,
                et.estimated_hours, et.prerequisites,
                es.id as subject_id, es.name as subject_name,
                es.weightage as subject_weightage,
                COALESCE(uts.confidence, 0) as confidence,
                COALESCE(uts.status, 'NOT_STARTED') as status,
                COALESCE(uts.total_time_spent_minutes, 0) as time_spent,
                uts.last_studied_at
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

    // 6. Normalization
    const maxWeightage = Math.max(...topics.map(t => parseFloat(t.topic_weightage) || 1));
    const maxDifficulty = 5;
    const maxConfidence = 5;

    const daysRemaining = enrollment.target_date
        ? Math.max(1, Math.ceil((new Date(enrollment.target_date) - new Date()) / (1000 * 60 * 60 * 24)))
        : 180;

    // 7. Build carryover set (unfinished + skipped from yesterday)
    const unfinishedTopicIds = new Set(yesterdayData.unfinishedTopicIds);

    // 8. Score all topics (apply time decay for accurate prioritization)
    const { computeTimeDecay } = require('./taskService');
    const scoredTopics = topics.map(t => {
        const rawConfidence = parseInt(t.confidence);
        const effectiveConfidence = computeTimeDecay(rawConfidence, t.last_studied_at);

        const weightageNorm = (parseFloat(t.topic_weightage) || 1) / maxWeightage;
        const difficultyNorm = (parseInt(t.difficulty_level) || 3) / maxDifficulty;
        const confidenceNorm = effectiveConfidence / maxConfidence;

        const completionRatio = effectiveConfidence >= 5 ? 1.0
            : effectiveConfidence >= 4 ? 0.7
            : effectiveConfidence >= 1 ? 0.3
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

    // 9. Sort by priority DESC
    scoredTopics.sort((a, b) => b.priority_score - a.priority_score);

    // 10. Separate pools
    const learnPool = scoredTopics.filter(t => t.status === 'NOT_STARTED' || t.status === 'LEARNING');
    const revisePool = scoredTopics.filter(t => t.status === 'REVISING' || t.status === 'MASTERED');

    // 11. Compute daily minutes
    let baseDailyMinutes = (parseFloat(enrollment.daily_available_hours) || 2) * 60;
    let perfMultiplier = computePerformanceMultiplier(yesterdayData.completionRate);

    // ── SAFEGUARD 1: Inactivity → 50% load ──
    if (isInactive) perfMultiplier = 0.50;

    // ── SAFEGUARD 6: First plan → 60% load ──
    if (isFirstPlan) perfMultiplier = 0.60;

    const adjustedDailyMinutes = Math.round(baseDailyMinutes * perfMultiplier);

    // 12. Learn/revise split
    let learnRatio, reviseRatio;
    if (isBufferDay) {
        learnRatio = 0.0;
        reviseRatio = 0.90;
    } else {
        ({ learnRatio, reviseRatio } = computeFatigueRatios(fatigueScore));
    }

    const learnMinutes = Math.floor(adjustedDailyMinutes * learnRatio);
    const reviseMinutes = Math.floor(adjustedDailyMinutes * reviseRatio);

    // Task cap — fewer for first plan
    const taskCap = isFirstPlan ? FIRST_PLAN_MAX_TASKS : MAX_TASKS_PER_DAY;

    // 13. Generate raw tasks
    let rawTasks = [];

    if (!isBufferDay) {
        let learnRemaining = learnMinutes;
        for (const topic of learnPool) {
            if (learnRemaining <= 0 || rawTasks.length >= taskCap) break;

            // First plan: skip hard topics (difficulty 4-5)
            if (isFirstPlan && topic.difficulty_level_raw >= 4) continue;

            const allocation = Math.min(
                Math.max(15, Math.round(topic.priority_score * 60)),
                60,
                learnRemaining
            );

            const reasons = computeTaskReasons(topic);
            rawTasks.push({
                topic_id: topic.topic_id,
                topic_name: topic.topic_name,
                subject_name: topic.subject_name,
                type: 'LEARN',
                duration_minutes: allocation,
                priority_score: topic.priority_score,
                carryover: topic.carryover,
                difficulty_level: topic.difficulty_level_raw,
                reasons,
            });

            learnRemaining -= allocation;
        }
    }

    // Revise tasks
    let reviseRemaining = reviseMinutes;
    for (const topic of revisePool) {
        if (reviseRemaining <= 0 || rawTasks.length >= taskCap) break;

        const allocation = Math.min(
            Math.max(10, Math.round(topic.priority_score * 30)),
            30,
            reviseRemaining
        );

        const reasons = computeTaskReasons(topic);
        rawTasks.push({
            topic_id: topic.topic_id,
            topic_name: topic.topic_name,
            subject_name: topic.subject_name,
            type: 'REVISE',
            duration_minutes: allocation,
            priority_score: topic.priority_score,
            carryover: topic.carryover,
            difficulty_level: topic.difficulty_level_raw,
            reasons,
        });

        reviseRemaining -= allocation;
    }

    // Cap
    if (rawTasks.length > taskCap) rawTasks = rawTasks.slice(0, taskCap);

    // ── SAFEGUARD 3: Easy task guarantee ──
    rawTasks = guaranteeEasyTask(rawTasks, scoredTopics, isBufferDay);

    // ── SAFEGUARD 5: No empty plan ──
    if (rawTasks.length === 0) rawTasks = generateFallbackPlan(scoredTopics);

    // 14. Assign UUIDs, order_index, and status
    const tasks = rawTasks.map((t, idx) => ({
        id: crypto.randomUUID(),
        order_index: idx,
        type: t.type,
        topic_id: t.topic_id,
        topic_name: t.topic_name,
        subject_name: t.subject_name,
        duration_minutes: t.duration_minutes,
        priority_score: t.priority_score,
        carryover: t.carryover || false,
        difficulty_level: t.difficulty_level,
        reasons: t.reasons || [],
        status: idx === 0 ? 'ACTIVE' : 'PENDING', // First task auto-activated
    }));

    // 15. Summary
    const totalLearn = tasks.filter(t => t.type === 'LEARN').reduce((sum, t) => sum + t.duration_minutes, 0);
    const totalRevise = tasks.filter(t => t.type === 'REVISE').reduce((sum, t) => sum + t.duration_minutes, 0);
    const totalMinutes = totalLearn + totalRevise;

    // 16. Metadata
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
            is_first_plan: isFirstPlan,
            is_inactive_restart: isInactive,
            inactivity_days: inactivityDays,
            is_buffer_day: isBufferDay,
            consecutive_active_days: consecutiveActiveDays,
            tasks_capped: rawTasks.length >= taskCap,
        },
    };

    // 17. Save to DB
    const planRes = await pool.query(
        `INSERT INTO user_daily_plans
            (user_id, exam_id, plan_date, tasks, total_minutes, learn_minutes, revise_minutes, status, total_completed_minutes, streak)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'NOT_STARTED', 0, $8)
         ON CONFLICT (user_id, exam_id, plan_date) DO UPDATE SET
            tasks = $4, total_minutes = $5, learn_minutes = $6, revise_minutes = $7,
            status = 'NOT_STARTED', total_completed_minutes = 0, streak = $8, updated_at = NOW()
         RETURNING *`,
        [userId, examId, today, JSON.stringify({ tasks, metadata }), totalMinutes, totalLearn, totalRevise, streak]
    );

    const plan = planRes.rows[0];
    plan.tasks = { tasks, metadata };
    return plan;
};


// ═══════════════════════════════════════════════════
// Safeguard Helpers
// ═══════════════════════════════════════════════════

function guaranteeEasyTask(tasks, scoredTopics, isBufferDay) {
    const hasEasy = tasks.some(t => t.difficulty_level <= 2);
    if (hasEasy || tasks.length === 0) return tasks;

    const taskTopicIds = new Set(tasks.map(t => t.topic_id));
    const statusFilter = isBufferDay ? 'REVISING' : null;

    const easyCandidate = scoredTopics.find(t =>
        t.difficulty_level_raw <= 2 &&
        !taskTopicIds.has(t.topic_id) &&
        (statusFilter === null || t.status === statusFilter || t.status === 'MASTERED')
    ) || scoredTopics.find(t =>
        t.difficulty_level_raw <= 2 && !taskTopicIds.has(t.topic_id)
    );

    if (!easyCandidate) return tasks;

    const result = [...tasks];
    result.sort((a, b) => a.priority_score - b.priority_score);
    result[0] = {
        topic_id: easyCandidate.topic_id,
        topic_name: easyCandidate.topic_name,
        subject_name: easyCandidate.subject_name,
        type: (easyCandidate.status === 'REVISING' || easyCandidate.status === 'MASTERED') ? 'REVISE' : 'LEARN',
        duration_minutes: 20,
        priority_score: easyCandidate.priority_score,
        carryover: false,
        difficulty_level: easyCandidate.difficulty_level_raw,
    };

    result.sort((a, b) => b.priority_score - a.priority_score);
    return result;
}

function generateFallbackPlan(scoredTopics) {
    const tasks = [];
    const learnCandidate = scoredTopics.find(t => t.status === 'NOT_STARTED' || t.status === 'LEARNING');
    const reviseCandidate = scoredTopics.find(t => t.status === 'REVISING' || t.status === 'MASTERED');

    if (learnCandidate) {
        tasks.push({
            topic_id: learnCandidate.topic_id, topic_name: learnCandidate.topic_name,
            subject_name: learnCandidate.subject_name, type: 'LEARN',
            duration_minutes: 30, priority_score: learnCandidate.priority_score,
            carryover: false, difficulty_level: learnCandidate.difficulty_level_raw,
        });
    }
    if (reviseCandidate) {
        tasks.push({
            topic_id: reviseCandidate.topic_id, topic_name: reviseCandidate.topic_name,
            subject_name: reviseCandidate.subject_name, type: 'REVISE',
            duration_minutes: 20, priority_score: reviseCandidate.priority_score,
            carryover: false, difficulty_level: reviseCandidate.difficulty_level_raw,
        });
    }
    if (tasks.length === 0 && scoredTopics.length > 0) {
        const t = scoredTopics[0];
        tasks.push({
            topic_id: t.topic_id, topic_name: t.topic_name,
            subject_name: t.subject_name, type: 'REVISE',
            duration_minutes: 20, priority_score: t.priority_score,
            carryover: false, difficulty_level: t.difficulty_level_raw,
        });
    }
    return tasks;
}


// ═══════════════════════════════════════════════════
// Adaptive Signal Fetchers
// ═══════════════════════════════════════════════════

async function fetchYesterdayPerformance(userId, examId) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const planRes = await pool.query(
        `SELECT tasks FROM user_daily_plans WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
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

    // With battle plan, tasks have status in JSONB
    const completedCount = plannedTasks.filter(t => t.status === 'COMPLETED').length;
    const skippedIds = plannedTasks.filter(t => t.status === 'SKIPPED').map(t => t.topic_id);
    const pendingIds = plannedTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'SKIPPED').map(t => t.topic_id);
    const unfinishedTopicIds = [...skippedIds, ...pendingIds];

    // Also check old-format plans (before battle plan upgrade)
    if (!plannedTasks[0].status) {
        const logsRes = await pool.query(
            `SELECT topic_id, task_type, actual_duration, completed FROM user_task_logs WHERE user_id = $1 AND plan_date = $2`,
            [userId, yesterdayStr]
        );
        const completedSet = new Set(logsRes.rows.filter(l => l.completed).map(l => `${l.topic_id}-${l.task_type}`));
        const actualMinutes = logsRes.rows.reduce((sum, l) => sum + (l.actual_duration || 0), 0);
        const oldCompletedCount = plannedTasks.filter(t => completedSet.has(`${t.topic_id}-${t.type}`)).length;
        const oldUnfinished = plannedTasks.filter(t => !completedSet.has(`${t.topic_id}-${t.type}`)).map(t => t.topic_id);
        return {
            completionRate: plannedTasks.length > 0 ? oldCompletedCount / plannedTasks.length : 1.0,
            completedCount: oldCompletedCount, totalCount: plannedTasks.length,
            actualMinutes, unfinishedTopicIds: oldUnfinished,
        };
    }

    const logsRes = await pool.query(
        `SELECT COALESCE(SUM(actual_duration), 0) as total FROM user_task_logs WHERE user_id = $1 AND plan_date = $2`,
        [userId, yesterdayStr]
    );

    return {
        completionRate: plannedTasks.length > 0 ? completedCount / plannedTasks.length : 1.0,
        completedCount,
        totalCount: plannedTasks.length,
        actualMinutes: parseInt(logsRes.rows[0].total) || 0,
        unfinishedTopicIds,
    };
}

async function computeFatigueScore(userId) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const res = await pool.query(
        `SELECT plan_date, COALESCE(SUM(actual_duration), 0) as actual_minutes,
                COALESCE(SUM(planned_duration), 0) as planned_minutes, COUNT(*) as task_count
         FROM user_task_logs WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3
         GROUP BY plan_date ORDER BY plan_date DESC`,
        [userId, threeDaysAgoStr, yesterdayStr]
    );

    if (!res.rows.length) return 0.0;

    const days = res.rows;
    let fatigue = 0;
    const totalActual = days.reduce((s, d) => s + parseInt(d.actual_minutes), 0);
    const totalPlanned = days.reduce((s, d) => s + Math.max(parseInt(d.planned_minutes), 1), 0);
    fatigue += Math.min(1.0, totalActual / Math.max(totalPlanned, 1)) * 0.5;
    fatigue += (days.length / 3) * 0.3;
    if (days.length >= 2) {
        const recent = parseInt(days[0].actual_minutes);
        const older = parseInt(days[days.length - 1].actual_minutes);
        if (older > 0 && recent > older) fatigue += Math.min(0.2, ((recent - older) / older) * 0.2);
    }
    return Math.min(1.0, Math.round(fatigue * 100) / 100);
}

async function computeInactivityDays(userId) {
    const res = await pool.query(
        `SELECT MAX(plan_date) as last_active FROM user_task_logs WHERE user_id = $1 AND completed = TRUE`,
        [userId]
    );
    if (!res.rows[0].last_active) {
        const enrollRes = await pool.query(
            `SELECT enrolled_at FROM user_enrollments WHERE user_id = $1 AND is_active = TRUE ORDER BY enrolled_at DESC LIMIT 1`,
            [userId]
        );
        if (!enrollRes.rows.length) return 999;
        return Math.floor((new Date() - new Date(enrollRes.rows[0].enrolled_at)) / (1000 * 60 * 60 * 24));
    }
    return Math.floor((new Date() - new Date(res.rows[0].last_active)) / (1000 * 60 * 60 * 24));
}

async function computeConsecutiveActiveDays(userId) {
    const res = await pool.query(
        `SELECT DISTINCT plan_date FROM user_task_logs WHERE user_id = $1 AND completed = TRUE ORDER BY plan_date DESC LIMIT 14`,
        [userId]
    );
    if (!res.rows.length) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);

    const activeDates = new Set(res.rows.map(r => {
        const d = r.plan_date instanceof Date ? r.plan_date : new Date(r.plan_date);
        return d.toISOString().split('T')[0];
    }));

    for (let i = 0; i < 14; i++) {
        if (activeDates.has(checkDate.toISOString().split('T')[0])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else break;
    }
    return streak;
}

/**
 * Compute streak: consecutive days with COMPLETED plans.
 */
async function computeStreak(userId, examId) {
    const res = await pool.query(
        `SELECT plan_date FROM user_daily_plans
         WHERE user_id = $1 AND exam_id = $2 AND status = 'COMPLETED'
         ORDER BY plan_date DESC LIMIT 30`,
        [userId, examId]
    );

    if (!res.rows.length) return 0;

    let streak = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);

    const completedDates = new Set(res.rows.map(r => {
        const d = r.plan_date instanceof Date ? r.plan_date : new Date(r.plan_date);
        return d.toISOString().split('T')[0];
    }));

    for (let i = 0; i < 30; i++) {
        if (completedDates.has(checkDate.toISOString().split('T')[0])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else break;
    }
    return streak;
}

/**
 * Check if user has any previous plans (for smart first-plan defaults).
 */
async function checkIsFirstPlan(userId, examId) {
    const res = await pool.query(
        `SELECT COUNT(*) as count FROM user_daily_plans WHERE user_id = $1 AND exam_id = $2`,
        [userId, examId]
    );
    return parseInt(res.rows[0].count) === 0;
}

/**
 * Edge case: when generating new day's plan, resolve yesterday's
 * leftover ACTIVE tasks by marking them PENDING in the JSONB.
 */
async function resolveStaleActiveTasks(userId, examId, today) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const res = await pool.query(
        `SELECT id, tasks FROM user_daily_plans WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
        [userId, examId, yesterdayStr]
    );

    if (!res.rows.length) return;

    const raw = res.rows[0].tasks;
    const taskData = Array.isArray(raw) ? { tasks: raw, metadata: {} } : raw;
    let changed = false;

    for (const task of taskData.tasks) {
        if (task.status === 'ACTIVE') {
            task.status = 'PENDING';
            changed = true;
        }
    }

    if (changed) {
        await pool.query(
            `UPDATE user_daily_plans SET tasks = $1, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(taskData), res.rows[0].id]
        );
    }
}


// ═══════════════════════════════════════════════════
// Adjustment Computations
// ═══════════════════════════════════════════════════

function computePerformanceMultiplier(completionRate) {
    if (completionRate < PERF_UNDERPERFORM_THRESHOLD) {
        return 0.80 + (completionRate / PERF_UNDERPERFORM_THRESHOLD) * 0.20;
    }
    if (completionRate > PERF_OVERPERFORM_THRESHOLD) return 1.05;
    return 1.0;
}

function computeFatigueRatios(fatigueScore) {
    if (fatigueScore >= FATIGUE_HIGH_THRESHOLD) return { learnRatio: 0.50, reviseRatio: 0.40 };
    if (fatigueScore >= 0.5) return { learnRatio: 0.60, reviseRatio: 0.30 };
    return { learnRatio: 0.70, reviseRatio: 0.20 };
}


// ═══════════════════════════════════════════════════
// Query & Regeneration
// ═══════════════════════════════════════════════════

const getPlanByDate = async (userId, date) => {
    const res = await pool.query(
        `SELECT * FROM user_daily_plans WHERE user_id = $1 AND plan_date = $2 ORDER BY created_at DESC LIMIT 1`,
        [userId, date]
    );
    return res.rows[0] || null;
};

const getPlanHistory = async (userId, startDate, endDate) => {
    const res = await pool.query(
        `SELECT * FROM user_daily_plans WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3 ORDER BY plan_date DESC`,
        [userId, startDate, endDate]
    );
    return res.rows;
};

const regeneratePlan = async (userId) => {
    const enrollmentRes = await pool.query(
        `SELECT exam_id FROM user_enrollments WHERE user_id = $1 AND is_active = TRUE ORDER BY enrolled_at DESC LIMIT 1`,
        [userId]
    );
    if (!enrollmentRes.rows.length) throw new Error('No active enrollment found');

    const today = new Date().toISOString().split('T')[0];
    await pool.query(
        `DELETE FROM user_daily_plans WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
        [userId, enrollmentRes.rows[0].exam_id, today]
    );
    return generateDailyPlan(userId);
};

/**
 * Update the plan's JSONB tasks in-place. Used by taskService for lifecycle ops.
 */
const updatePlanTasks = async (planId, taskData, updates = {}) => {
    const setClauses = ['tasks = $1', 'updated_at = NOW()'];
    const params = [JSON.stringify(taskData)];
    let idx = 2;

    for (const [key, value] of Object.entries(updates)) {
        setClauses.push(`${key} = $${idx}`);
        params.push(value);
        idx++;
    }

    params.push(planId);
    const res = await pool.query(
        `UPDATE user_daily_plans SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
        params
    );
    return res.rows[0];
};

/**
 * Get today's plan row (raw, for service-level operations).
 */
const getTodayPlanRaw = async (userId) => {
    const enrollmentRes = await pool.query(
        `SELECT exam_id FROM user_enrollments WHERE user_id = $1 AND is_active = TRUE ORDER BY enrolled_at DESC LIMIT 1`,
        [userId]
    );
    if (!enrollmentRes.rows.length) throw new Error('No active enrollment found');

    const today = new Date().toISOString().split('T')[0];
    const res = await pool.query(
        `SELECT * FROM user_daily_plans WHERE user_id = $1 AND exam_id = $2 AND plan_date = $3`,
        [userId, enrollmentRes.rows[0].exam_id, today]
    );
    return res.rows[0] || null;
};

// ═══════════════════════════════════════════════════
// Task Reasoning
// ═══════════════════════════════════════════════════

function computeTaskReasons(topic) {
    const reasons = [];
    if (topic.carryover) reasons.push('CARRYOVER');
    if (topic.weightage_norm > 0.7) reasons.push('HIGH_WEIGHTAGE');
    if (topic.confidence_norm < 0.3) reasons.push('LOW_CONFIDENCE');
    if (topic.urgency_factor > 0.5) reasons.push('URGENT');
    if (topic.difficulty_level_raw <= 2) reasons.push('EASY_WIN');
    if (topic.difficulty_level_raw >= 4) reasons.push('CHALLENGING');
    // If none of the above triggered, it's a standard priority pick
    if (reasons.length === 0) reasons.push('PRIORITY_PICK');
    return reasons;
}


// ═══════════════════════════════════════════════════
// Roadmap Data (Strategic Overview)
// ═══════════════════════════════════════════════════

const getRoadmapData = async (userId) => {
    // 1. Active enrollment
    const enrollmentRes = await pool.query(
        `SELECT ue.*, e.name as exam_name, e.full_name as exam_full_name
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
    const today = new Date();
    const targetDate = enrollment.target_date ? new Date(enrollment.target_date) : null;
    const daysRemaining = targetDate
        ? Math.max(0, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)))
        : null;

    // 2. Subject + topic progress
    const subjectRes = await pool.query(
        `SELECT es.id as subject_id, es.name as subject_name, es.weightage,
                et.id as topic_id, et.name as topic_name,
                et.difficulty_level, et.weightage as topic_weightage,
                et.estimated_hours,
                COALESCE(uts.confidence, 0) as confidence,
                COALESCE(uts.status, 'NOT_STARTED') as status,
                COALESCE(uts.total_time_spent_minutes, 0) as time_spent,
                uts.last_studied_at
         FROM exam_subjects es
         JOIN exam_topics et ON et.subject_id = es.id
         LEFT JOIN user_topic_states uts ON uts.topic_id = et.id AND uts.user_id = $1
         WHERE es.exam_id = $2
         ORDER BY es.sort_order ASC, et.sort_order ASC`,
        [userId, examId]
    );

    // 3. Aggregate by subject
    const subjectMap = new Map();
    let totalTopics = 0, totalMastered = 0, totalRevising = 0, totalLearning = 0, totalNotStarted = 0;
    let weightedConfidenceSum = 0, totalWeightage = 0;

    for (const row of subjectRes.rows) {
        totalTopics++;
        const topicWeight = parseFloat(row.topic_weightage) || 1;
        const rawConfidence = parseInt(row.confidence) || 0;

        // Apply time decay for display (read-only, does not mutate DB)
        const { computeTimeDecay } = require('./taskService');
        const effectiveConfidence = computeTimeDecay(rawConfidence, row.last_studied_at);

        weightedConfidenceSum += effectiveConfidence * topicWeight;
        totalWeightage += topicWeight;

        // Derive effective status from decayed confidence
        const effectiveStatus = effectiveConfidence <= 0 ? 'NOT_STARTED'
            : effectiveConfidence <= 3 ? 'LEARNING'
            : effectiveConfidence === 4 ? 'REVISING'
            : 'MASTERED';

        if (effectiveStatus === 'MASTERED') totalMastered++;
        else if (effectiveStatus === 'REVISING') totalRevising++;
        else if (effectiveStatus === 'LEARNING') totalLearning++;
        else totalNotStarted++;

        if (!subjectMap.has(row.subject_id)) {
            subjectMap.set(row.subject_id, {
                id: row.subject_id,
                name: row.subject_name,
                weightage: parseFloat(row.weightage) || 0,
                total_topics: 0,
                mastered: 0,
                revising: 0,
                learning: 0,
                not_started: 0,
                topics: [],
                total_time_spent_minutes: 0,
                confidence_sum: 0,
            });
        }

        const subj = subjectMap.get(row.subject_id);
        subj.total_topics++;
        subj.total_time_spent_minutes += parseInt(row.time_spent) || 0;
        subj.confidence_sum += effectiveConfidence;
        if (effectiveStatus === 'MASTERED') subj.mastered++;
        else if (effectiveStatus === 'REVISING') subj.revising++;
        else if (effectiveStatus === 'LEARNING') subj.learning++;
        else subj.not_started++;

        const baseHours = computeEstimatedHours({
            estimated_hours: row.estimated_hours,
            difficulty: row.difficulty_level,
            weightage: topicWeight
        });

        const personalized = computePersonalizedHours(
            baseHours,
            effectiveConfidence,
            parseInt(row.time_spent) || 0
        );

        subj.topics.push({
            id: row.topic_id,
            name: row.topic_name,
            difficulty: row.difficulty_level,
            weightage: topicWeight,
            confidence: effectiveConfidence,
            status: effectiveStatus,
            time_spent: parseInt(row.time_spent) || 0,
            base_hours: baseHours,
            estimated_hours: personalized.remaining_hours,
            multiplier: personalized.multiplier,
            adaptive_message: personalized.message,
        });
    }

    const subjects = Array.from(subjectMap.values()).map(s => ({
        ...s,
        avg_confidence: s.total_topics > 0
            ? Math.round((s.confidence_sum / (s.total_topics * 5)) * 100) / 100
            : 0,
        completion_percent: s.total_topics > 0
            ? Math.round(((s.mastered + s.revising) / s.total_topics) * 100)
            : 0,
    }));

    // Remove internal field
    subjects.forEach(s => delete s.confidence_sum);

    // Overall readiness: weighted confidence as percentage of max (5 * totalWeightage)
    const maxPossible = totalWeightage * 5;
    const overallScore = maxPossible > 0
        ? Math.round((weightedConfidenceSum / maxPossible) * 100)
        : 0;

    // 4. Weekly summary (this week vs last week)
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

    const [thisWeekRes, lastWeekRes] = await Promise.all([
        pool.query(
            `SELECT COUNT(*) as total_tasks,
                    COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
                    COUNT(*) FILTER (WHERE skipped = TRUE) as skipped_tasks,
                    COALESCE(SUM(actual_duration), 0) as total_minutes
             FROM user_task_logs WHERE user_id = $1 AND plan_date > $2 AND plan_date <= $3`,
            [userId, weekAgoStr, todayStr]
        ),
        pool.query(
            `SELECT COUNT(*) as total_tasks,
                    COUNT(*) FILTER (WHERE completed = TRUE) as completed_tasks,
                    COUNT(*) FILTER (WHERE skipped = TRUE) as skipped_tasks,
                    COALESCE(SUM(actual_duration), 0) as total_minutes
             FROM user_task_logs WHERE user_id = $1 AND plan_date > $2 AND plan_date <= $3`,
            [userId, twoWeeksAgoStr, weekAgoStr]
        ),
    ]);

    const thisWeek = thisWeekRes.rows[0];
    const lastWeek = lastWeekRes.rows[0];

    const thisWeekTotal = parseInt(thisWeek.total_tasks) || 0;
    const thisWeekCompleted = parseInt(thisWeek.completed_tasks) || 0;
    const lastWeekTotal = parseInt(lastWeek.total_tasks) || 0;
    const lastWeekCompleted = parseInt(lastWeek.completed_tasks) || 0;

    const thisWeekRate = thisWeekTotal > 0 ? Math.round((thisWeekCompleted / thisWeekTotal) * 100) / 100 : 0;
    const lastWeekRate = lastWeekTotal > 0 ? Math.round((lastWeekCompleted / lastWeekTotal) * 100) / 100 : 0;

    let trend = 'stable';
    if (thisWeekRate > lastWeekRate + 0.05) trend = 'improving';
    else if (thisWeekRate < lastWeekRate - 0.05) trend = 'declining';

    // 5. Estimated completion
    const topicsNeedingWork = totalLearning + totalNotStarted;
    // Average time per topic based on completed topics
    const completedTopicCount = totalMastered + totalRevising;
    const totalTimeSpent = subjectRes.rows.reduce((s, r) => s + (parseInt(r.time_spent) || 0), 0);
    const avgTimePerTopic = completedTopicCount > 0
        ? totalTimeSpent / completedTopicCount
        : 60; // default 60 min estimate
    const dailyMinutes = (parseFloat(enrollment.daily_available_hours) || 2) * 60;
    const estimatedDaysRemaining = dailyMinutes > 0
        ? Math.ceil((topicsNeedingWork * avgTimePerTopic) / dailyMinutes)
        : 999;

    // 6. Streak
    const streak = await computeStreak(userId, examId);

    return {
        exam: {
            name: enrollment.exam_name,
            full_name: enrollment.exam_full_name,
            target_date: targetDate ? targetDate.toISOString().split('T')[0] : null,
            days_remaining: daysRemaining,
        },

        readiness: {
            overall_score: overallScore,
            total_topics: totalTopics,
            mastered: totalMastered,
            revising: totalRevising,
            learning: totalLearning,
            not_started: totalNotStarted,
        },

        subjects,

        weekly_summary: {
            this_week: {
                total_minutes: parseInt(thisWeek.total_minutes) || 0,
                completed_tasks: thisWeekCompleted,
                skipped_tasks: parseInt(thisWeek.skipped_tasks) || 0,
                completion_rate: thisWeekRate,
            },
            last_week: {
                total_minutes: parseInt(lastWeek.total_minutes) || 0,
                completed_tasks: lastWeekCompleted,
                skipped_tasks: parseInt(lastWeek.skipped_tasks) || 0,
                completion_rate: lastWeekRate,
            },
            trend,
        },

        settings: {
            daily_available_hours: parseFloat(enrollment.daily_available_hours) || 2,
            target_date: targetDate ? targetDate.toISOString().split('T')[0] : null,
        },

        estimated_completion: {
            at_current_pace_days: estimatedDaysRemaining,
            on_track: daysRemaining !== null ? estimatedDaysRemaining <= daysRemaining : true,
        },

        streak,
    };
};


// ═══════════════════════════════════════════════════
// Settings Update
// ═══════════════════════════════════════════════════

const updateSettings = async (userId, { daily_available_hours, target_date }) => {
    const setClauses = [];
    const values = [];
    let idx = 1;

    if (daily_available_hours !== undefined) {
        const hours = parseFloat(daily_available_hours);
        if (isNaN(hours) || hours < 0.5 || hours > 12) {
            throw new Error('daily_available_hours must be between 0.5 and 12');
        }
        setClauses.push(`daily_available_hours = $${idx++}`);
        values.push(hours);
    }

    if (target_date !== undefined) {
        if (target_date && new Date(target_date) < new Date()) {
            throw new Error('target_date must be in the future');
        }
        setClauses.push(`target_date = $${idx++}`);
        values.push(target_date || null);
    }

    if (setClauses.length === 0) {
        throw new Error('No settings to update');
    }

    values.push(userId);
    const res = await pool.query(
        `UPDATE user_enrollments SET ${setClauses.join(', ')}
         WHERE user_id = $${idx} AND is_active = TRUE
         RETURNING daily_available_hours, target_date`,
        values
    );

    if (!res.rows.length) {
        throw new Error('No active enrollment found');
    }

    return {
        daily_available_hours: parseFloat(res.rows[0].daily_available_hours) || 2,
        target_date: res.rows[0].target_date
            ? new Date(res.rows[0].target_date).toISOString().split('T')[0]
            : null,
    };
};


/**
 * Smart estimation for topics when database hours are missing.
 * Factors in difficulty (1-5 scale) and subject weightage.
 */
function computeEstimatedHours({ estimated_hours, difficulty, weightage }) {
    if (estimated_hours && parseFloat(estimated_hours) > 0) {
        return parseFloat(estimated_hours);
    }

    // Baseline based on difficulty
    // 1: 4h, 2: 6h, 3: 10h, 4: 18h, 5: 30h
    const difficultyLevel = parseInt(difficulty) || 3;
    const baseHoursMap = {
        1: 4,
        2: 6,
        3: 10,
        4: 18,
        5: 30
    };

    let estimate = baseHoursMap[difficultyLevel] || 10;

    // Weightage adjustment (topics in heavy subjects need more depth)
    const weight = parseFloat(weightage) || 0;
    if (weight > 10) estimate *= 1.3;
    else if (weight > 7) estimate *= 1.1;
    else if (weight < 5) estimate *= 0.7;

    return Math.round(estimate * 10) / 10;
}

/**
 * Compute personalized remaining study hours for a topic.
 * Adjusts based on user's confidence — weak areas get more time, strong areas less.
 *
 * @param {number} baseHours - Static estimated hours from DB/fallback
 * @param {number} confidence - Effective confidence (0-5, after decay)
 * @param {number} timeSpentMinutes - Total time already spent (minutes)
 * @returns {{ remaining_hours: number, multiplier: number, message: string|null }}
 */
function computePersonalizedHours(baseHours, confidence, timeSpentMinutes) {
    const timeSpentHours = timeSpentMinutes / 60;
    const remaining = Math.max(0, baseHours - timeSpentHours);

    // Confidence-based multiplier
    const multiplierMap = {
        0: 1.5,  // No idea → 50% extra time
        1: 1.3,  // Weak → 30% extra
        2: 1.1,  // Below average → slight bump
        3: 1.0,  // On track
        4: 0.85, // Good → needs less
        5: 0.5,  // Strong → mostly revision
    };

    const multiplier = multiplierMap[confidence] ?? 1.0;
    const adjustedRemaining = Math.round(remaining * multiplier * 10) / 10;

    // Adaptive message for the user
    let message = null;
    if (confidence <= 1 && remaining > 0) {
        message = 'Weak area — extra time allocated';
    } else if (confidence === 2) {
        message = 'Needs more practice';
    } else if (confidence >= 4 && remaining > 0) {
        message = 'Strong — reduced time';
    } else if (remaining <= 0) {
        message = 'Target hours reached';
    }

    return {
        remaining_hours: adjustedRemaining,
        multiplier,
        message,
    };
}

module.exports = {
    generateDailyPlan,
    getPlanByDate,
    getPlanHistory,
    regeneratePlan,
    updatePlanTasks,
    getTodayPlanRaw,
    getRoadmapData,
    updateSettings,
};
