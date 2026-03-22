const db = require('../config/db');

function getLocalDateStr(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ─── SETS ────────────────────────────────────────────────────────────────

async function createSet(userId, title, topics, questionCount, timePerQuestion = 180, examId = null) {
    const result = await db.query(
        `INSERT INTO revision_sets (user_id, title, topics, question_count, time_per_question, exam_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, title, topics, questionCount, timePerQuestion, examId]
    );
    return result.rows[0];
}

async function getUserSets(userId, examId = null) {
    let query = `SELECT rs.*,
            (SELECT COUNT(*) FROM revision_questions rq WHERE rq.set_id = rs.id) as actual_question_count,
            (SELECT COUNT(*) FROM revision_attempts ra WHERE ra.set_id = rs.id AND ra.status = 'completed') as attempt_count,
            (SELECT MAX(ra.score) FROM revision_attempts ra WHERE ra.set_id = rs.id AND ra.status = 'completed') as best_score,
            (SELECT MAX(ra.max_score) FROM revision_attempts ra WHERE ra.set_id = rs.id AND ra.status = 'completed') as best_max_score
         FROM revision_sets rs
         WHERE rs.user_id = $1`;
    const params = [userId];
    if (examId) {
        query += ' AND rs.exam_id = $2';
        params.push(examId);
    }
    query += ' ORDER BY rs.created_at DESC';
    const result = await db.query(query, params);
    return result.rows;
}

async function getSet(setId) {
    const setResult = await db.query(`SELECT * FROM revision_sets WHERE id = $1`, [setId]);
    if (setResult.rows.length === 0) return null;

    const questionsResult = await db.query(
        `SELECT * FROM revision_questions WHERE set_id = $1 ORDER BY sort_order, id`,
        [setId]
    );

    return { ...setResult.rows[0], questions: questionsResult.rows };
}

async function deleteSet(setId) {
    await db.query(`DELETE FROM revision_sets WHERE id = $1`, [setId]);
}

async function updateSet(setId, fields) {
    const { title, time_per_question } = fields;
    await db.query(
        `UPDATE revision_sets SET title = COALESCE($1, title), time_per_question = COALESCE($2, time_per_question) WHERE id = $3`,
        [title, time_per_question, setId]
    );
}

// ─── QUESTIONS ───────────────────────────────────────────────────────────

async function importQuestions(setId, questionsJson) {
    const questions = questionsJson.questions || questionsJson;
    const inserted = [];

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const result = await db.query(
            `INSERT INTO revision_questions (set_id, question_type, question_text, options, correct_answer, explanation, marks, negative_marks, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                setId,
                q.type || 'mcq',
                q.question,
                q.options ? JSON.stringify(q.options) : null,
                JSON.stringify(q.correct),
                q.explanation || '',
                q.marks || 1,
                q.negative || 0,
                i
            ]
        );
        inserted.push(result.rows[0]);
    }

    return inserted;
}

async function deleteQuestion(questionId) {
    await db.query(`DELETE FROM revision_questions WHERE id = $1`, [questionId]);
}

// ─── ATTEMPTS ────────────────────────────────────────────────────────────

async function createAttempt(setId, questionOrder, mode = 'exam') {
    const result = await db.query(
        `INSERT INTO revision_attempts (set_id, question_order, mode)
         VALUES ($1, $2, $3) RETURNING *`,
        [setId, JSON.stringify(questionOrder), mode]
    );
    return result.rows[0];
}

async function getAttempt(attemptId) {
    const attemptResult = await db.query(`SELECT * FROM revision_attempts WHERE id = $1`, [attemptId]);
    if (attemptResult.rows.length === 0) return null;

    const answersResult = await db.query(
        `SELECT ra.*, rq.question_text, rq.question_type, rq.options, rq.correct_answer, rq.explanation, rq.marks, rq.negative_marks
         FROM revision_answers ra
         JOIN revision_questions rq ON rq.id = ra.question_id
         WHERE ra.attempt_id = $1`,
        [attemptId]
    );

    return { ...attemptResult.rows[0], answers: answersResult.rows };
}

async function saveAnswer(attemptId, questionId, userAnswer, timeSpent) {
    // Check correctness
    const qResult = await db.query(`SELECT correct_answer, question_type FROM revision_questions WHERE id = $1`, [questionId]);
    if (qResult.rows.length === 0) throw new Error('Question not found');

    const q = qResult.rows[0];
    const correctAnswer = q.correct_answer;
    let isCorrect = false;

    if (q.question_type === 'nat') {
        // NAT: check if within tolerance
        const userVal = parseFloat(userAnswer?.value);
        const correctVal = correctAnswer.value;
        const tolerance = correctAnswer.tolerance || 0;
        if (!isNaN(userVal)) {
            isCorrect = Math.abs(userVal - correctVal) <= tolerance;
        }
    } else if (q.question_type === 'msq') {
        // MSQ: must match exactly (sorted arrays)
        const userArr = (Array.isArray(userAnswer) ? userAnswer : []).sort();
        const correctArr = (Array.isArray(correctAnswer) ? correctAnswer : []).sort();
        isCorrect = JSON.stringify(userArr) === JSON.stringify(correctArr);
    } else {
        // MCQ: single correct
        const userArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const correctArr = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
        isCorrect = JSON.stringify(userArr.sort()) === JSON.stringify(correctArr.sort());
    }

    const result = await db.query(
        `INSERT INTO revision_answers (attempt_id, question_id, user_answer, is_correct, time_spent_seconds)
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
        `UPDATE revision_attempts SET status = 'paused', current_question_index = $1, time_taken_seconds = $2 WHERE id = $3`,
        [currentIndex, timeTaken, attemptId]
    );
}

async function completeAttempt(attemptId, toolId, userId) {
    // Calculate score from answers
    const answersResult = await db.query(
        `SELECT ra.is_correct, ra.time_spent_seconds, rq.marks, rq.negative_marks
         FROM revision_answers ra
         JOIN revision_questions rq ON rq.id = ra.question_id
         WHERE ra.attempt_id = $1`,
        [attemptId]
    );

    let score = 0;
    let maxScore = 0;
    let totalTime = 0;

    for (const ans of answersResult.rows) {
        maxScore += ans.marks;
        totalTime += ans.time_spent_seconds || 0;
        if (ans.is_correct) {
            score += ans.marks;
        } else if (ans.user_answer !== null) {
            // Only apply negative if user actually answered
            score -= ans.negative_marks || 0;
        }
    }

    // Also count unanswered questions toward max_score
    const attemptData = await db.query(`SELECT set_id FROM revision_attempts WHERE id = $1`, [attemptId]);
    if (attemptData.rows.length > 0) {
        const allQResult = await db.query(
            `SELECT SUM(marks) as total_marks FROM revision_questions WHERE set_id = $1`,
            [attemptData.rows[0].set_id]
        );
        if (allQResult.rows[0]?.total_marks) {
            maxScore = parseFloat(allQResult.rows[0].total_marks);
        }
    }

    await db.query(
        `UPDATE revision_attempts SET status = 'completed', finished_at = NOW(), score = $1, max_score = $2, time_taken_seconds = $3 WHERE id = $4`,
        [score, maxScore, totalTime, attemptId]
    );

    // Track activity for global streaks
    if (toolId && userId) {
        // Log the actual minutes spent (minimum 1 minute if they spent any time)
        const minutesLog = Math.max(1, Math.round(totalTime / 60));
        await db.query(`
             INSERT INTO activity_logs (user_id, tool_id, minutes_logged, log_date) 
             SELECT $1, $2, $3, $4
             WHERE NOT EXISTS (
                SELECT 1 FROM activity_logs 
                WHERE user_id = $1 AND tool_id = $2 AND log_date = $4
             )`,
            [userId, toolId, minutesLog, getLocalDateStr()]
        );
    }

    return { score, maxScore, totalTime };
}

async function getAttemptHistory(setId) {
    const result = await db.query(
        `SELECT * FROM revision_attempts WHERE set_id = $1 ORDER BY started_at DESC`,
        [setId]
    );
    return result.rows;
}

async function getInProgressAttempt(setId) {
    const result = await db.query(
        `SELECT * FROM revision_attempts WHERE set_id = $1 AND status IN ('in_progress', 'paused') ORDER BY started_at DESC LIMIT 1`,
        [setId]
    );
    return result.rows[0] || null;
}

module.exports = {
    createSet, getUserSets, getSet, deleteSet, updateSet,
    importQuestions, deleteQuestion,
    createAttempt, getAttempt, saveAnswer, pauseAttempt, completeAttempt,
    getAttemptHistory, getInProgressAttempt
};
