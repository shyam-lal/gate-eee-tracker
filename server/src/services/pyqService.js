const db = require('../config/db');

function getLocalDateStr(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── PAPERS ──────────────────────────────────────────────────────────────

async function getPapers(filters = {}) {
    let query = `SELECT pp.*,
            (SELECT COUNT(*) FROM pyq_attempts pa WHERE pa.paper_id = pp.id AND pa.status = 'completed') as total_attempts
         FROM pyq_papers pp
         WHERE pp.is_published = TRUE`;
    const params = [];
    let idx = 1;

    if (filters.year) {
        query += ` AND pp.year = $${idx++}`;
        params.push(filters.year);
    }
    if (filters.branch) {
        query += ` AND pp.branch = $${idx++}`;
        params.push(filters.branch);
    }
    if (filters.exam_id) {
        query += ` AND pp.exam_id = $${idx++}`;
        params.push(filters.exam_id);
    }

    query += ' ORDER BY pp.year DESC, pp.session ASC';
    const result = await db.query(query, params);
    return result.rows;
}

async function getPaper(paperId) {
    const paperResult = await db.query(`SELECT * FROM pyq_papers WHERE id = $1`, [paperId]);
    if (paperResult.rows.length === 0) return null;

    const questionsResult = await db.query(
        `SELECT * FROM pyq_questions WHERE paper_id = $1 ORDER BY sort_order, question_number`,
        [paperId]
    );

    return { ...paperResult.rows[0], questions: questionsResult.rows };
}

async function getUserPaperStats(userId, paperId) {
    const result = await db.query(
        `SELECT id, status, score, max_score, time_taken_seconds, started_at, finished_at, mode
         FROM pyq_attempts WHERE user_id = $1 AND paper_id = $2 ORDER BY started_at DESC`,
        [userId, paperId]
    );
    return result.rows;
}

// ─── ATTEMPTS ────────────────────────────────────────────────────────────

async function createAttempt(userId, paperId, questionOrder, mode = 'exam') {
    const result = await db.query(
        `INSERT INTO pyq_attempts (user_id, paper_id, question_order, mode)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, paperId, JSON.stringify(questionOrder), mode]
    );
    return result.rows[0];
}

async function getAttempt(attemptId) {
    const attemptResult = await db.query(`SELECT * FROM pyq_attempts WHERE id = $1`, [attemptId]);
    if (attemptResult.rows.length === 0) return null;

    const answersResult = await db.query(
        `SELECT pa.*, pq.question_text, pq.question_type, pq.options, pq.correct_answer, pq.explanation, pq.marks, pq.negative_marks
         FROM pyq_answers pa
         JOIN pyq_questions pq ON pq.id = pa.question_id
         WHERE pa.attempt_id = $1`,
        [attemptId]
    );

    return { ...attemptResult.rows[0], answers: answersResult.rows };
}

async function getInProgressAttempt(userId, paperId) {
    const result = await db.query(
        `SELECT * FROM pyq_attempts WHERE user_id = $1 AND paper_id = $2 AND status IN ('in_progress', 'paused') ORDER BY started_at DESC LIMIT 1`,
        [userId, paperId]
    );
    return result.rows[0] || null;
}

async function saveAnswer(attemptId, questionId, userAnswer, timeSpent) {
    // Check correctness
    const qResult = await db.query(`SELECT correct_answer, question_type FROM pyq_questions WHERE id = $1`, [questionId]);
    if (qResult.rows.length === 0) throw new Error('Question not found');

    const q = qResult.rows[0];
    const correctAnswer = q.correct_answer;
    let isCorrect = false;

    if (q.question_type === 'nat') {
        const userVal = parseFloat(userAnswer?.value);
        const correctVal = correctAnswer.value;
        const tolerance = correctAnswer.tolerance || 0;
        if (!isNaN(userVal)) {
            isCorrect = Math.abs(userVal - correctVal) <= tolerance;
        }
    } else if (q.question_type === 'msq') {
        const userArr = (Array.isArray(userAnswer) ? userAnswer : []).sort();
        const correctArr = (Array.isArray(correctAnswer) ? correctAnswer : []).sort();
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
    } else {
        const userArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const correctArr = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
        isCorrect = JSON.stringify(userArr.sort()) === JSON.stringify(correctArr.sort());
    }

    const result = await db.query(
        `INSERT INTO pyq_answers (attempt_id, question_id, user_answer, is_correct, time_spent_seconds)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (attempt_id, question_id)
         DO UPDATE SET user_answer = $3, is_correct = $4, time_spent_seconds = $5
         RETURNING *`,
        [attemptId, questionId, JSON.stringify(userAnswer), isCorrect, timeSpent]
    );
    return result.rows[0];
}

async function pauseAttempt(attemptId, currentIndex, timeTaken) {
    await db.query(
        `UPDATE pyq_attempts SET status = 'paused', current_question_index = $1, time_taken_seconds = $2 WHERE id = $3`,
        [currentIndex, timeTaken, attemptId]
    );
}

async function completeAttempt(attemptId, toolId, userId) {
    const answersResult = await db.query(
        `SELECT pa.is_correct, pa.time_spent_seconds, pa.user_answer, pq.marks, pq.negative_marks
         FROM pyq_answers pa
         JOIN pyq_questions pq ON pq.id = pa.question_id
         WHERE pa.attempt_id = $1`,
        [attemptId]
    );

    let score = 0;
    let totalTime = 0;

    for (const ans of answersResult.rows) {
        totalTime += ans.time_spent_seconds || 0;
        if (ans.is_correct) {
            score += ans.marks;
        } else if (ans.user_answer !== null) {
            score -= ans.negative_marks || 0;
        }
    }

    // Max score from paper's total marks
    const attemptData = await db.query(`SELECT paper_id FROM pyq_attempts WHERE id = $1`, [attemptId]);
    let maxScore = 100;
    if (attemptData.rows.length > 0) {
        const paperResult = await db.query(`SELECT total_marks FROM pyq_papers WHERE id = $1`, [attemptData.rows[0].paper_id]);
        if (paperResult.rows[0]) maxScore = paperResult.rows[0].total_marks;
    }

    await db.query(
        `UPDATE pyq_attempts SET status = 'completed', finished_at = NOW(), score = $1, max_score = $2, time_taken_seconds = $3 WHERE id = $4`,
        [score, maxScore, totalTime, attemptId]
    );

    // Track activity for streaks
    if (toolId && userId) {
        const minutesLog = Math.max(1, Math.round(totalTime / 60));
        await db.query(`
            INSERT INTO activity_logs (user_id, tool_id, minutes_logged, log_date)
            SELECT $1, $2, $3, $4
            WHERE NOT EXISTS (
                SELECT 1 FROM activity_logs
                WHERE user_id = $1 AND tool_id = $2 AND log_date = $4
            )`, [userId, toolId, minutesLog, getLocalDateStr()]
        );
    }

    return { score, maxScore, totalTime };
}

async function getAttemptHistory(userId, paperId) {
    const result = await db.query(
        `SELECT * FROM pyq_attempts WHERE user_id = $1 AND paper_id = $2 ORDER BY started_at DESC`,
        [userId, paperId]
    );
    return result.rows;
}

module.exports = {
    getPapers, getPaper, getUserPaperStats,
    createAttempt, getAttempt, getInProgressAttempt,
    saveAnswer, pauseAttempt, completeAttempt, getAttemptHistory
};
