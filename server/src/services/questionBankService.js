const pool = require('../config/db');

/**
 * Import an array of questions into the question_bank for a specific exam.
 * 
 * @param {number} examId - ID of the exam
 * @param {Array} questions - Array of question objects
 *   {
 *     "question_text": "...",
 *     "question_type": "mcq",
 *     "options": ["A", "B"],
 *     "correct": [0],
 *     "explanation": "...",
 *     "year": 2024,
 *     "marks": 2,
 *     "negative": 0.66,
 *     "difficulty": "medium",
 *     "subject_id": 1, 
 *     "topic_id": 5
 *   }
 * @param {boolean} clearExisting - If true, deletes existing questions for this exam
 * @returns {Object} Stats about the import
 */
const importQuestions = async (examId, questions, clearExisting = false) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        if (clearExisting) {
            await client.query('DELETE FROM question_bank WHERE exam_id = $1', [examId]);
        }

        let createdCount = 0;
        const errors = [];

        for (const [index, q] of questions.entries()) {
            try {
                if (!q.question_text || !q.question_type) {
                    throw new Error('Missing required fields (question_text or question_type)');
                }

                await client.query(
                    `INSERT INTO question_bank (
                        exam_id, subject_id, topic_id,
                        question_text, question_type, options, correct, explanation,
                        year, marks, negative, difficulty, tags
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        examId,
                        q.subject_id || null,
                        q.topic_id || null,
                        q.question_text,
                        q.question_type,
                        q.options ? JSON.stringify(q.options) : null,
                        q.correct ? JSON.stringify(q.correct) : null,
                        q.explanation || null,
                        q.year || null,
                        q.marks || 1,
                        q.negative || 0,
                        q.difficulty || 'medium',
                        JSON.stringify(q.tags || [])
                    ]
                );
                createdCount++;
            } catch (err) {
                errors.push(`Row ${index + 1} (${q.question_text?.substring(0,20)}...): ${err.message}`);
            }
        }

        await client.query('COMMIT');
        
        return {
            success: true,
            created: createdCount,
            errors: errors.length > 0 ? errors : null
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error importing questions:', error);
        throw new Error('Failed to import questions: ' + error.message);
    } finally {
        client.release();
    }
};

/**
 * Get questions for an exam, optionally filtered
 */
const getQuestions = async (examId, filters = {}) => {
    let query = `
        SELECT q.*, 
               s.name as subject_name, 
               t.name as topic_name 
        FROM question_bank q
        LEFT JOIN exam_subjects s ON q.subject_id = s.id
        LEFT JOIN exam_topics t ON q.topic_id = t.id
        WHERE q.exam_id = $1
    `;
    const values = [examId];
    let idx = 2;

    if (filters.subject_id) { query += ` AND q.subject_id = $${idx++}`; values.push(filters.subject_id); }
    if (filters.topic_id) { query += ` AND q.topic_id = $${idx++}`; values.push(filters.topic_id); }
    if (filters.year) { query += ` AND q.year = $${idx++}`; values.push(filters.year); }
    if (filters.question_type) { query += ` AND q.question_type = $${idx++}`; values.push(filters.question_type); }
    
    query += ` ORDER BY q.year DESC, q.id ASC LIMIT 500`;

    const res = await pool.query(query, values);
    return res.rows;
};

module.exports = {
    importQuestions,
    getQuestions
};
