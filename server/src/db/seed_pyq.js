/**
 * seed_pyq.js — Ingest PYQ questions from a JSON file into the database.
 *
 * Usage:
 *   node seed_pyq.js ./pyq_data/gate_ee_2024.json
 *   node seed_pyq.js ./pyq_data/gate_ee_2023.json --publish
 *
 * JSON format:
 * {
 *   "paper": {
 *     "year": 2024,
 *     "session": "Session 1",
 *     "branch": "EE",
 *     "title": "GATE EE 2024 — Session 1",
 *     "total_marks": 100,
 *     "duration_minutes": 180,
 *     "pdf_url": "https://drive.google.com/..."
 *   },
 *   "questions": [
 *     {
 *       "question_number": 1,
 *       "section": "General Aptitude",
 *       "question_type": "mcq",
 *       "question_text": "...",
 *       "options": ["A", "B", "C", "D"],
 *       "correct": [0],
 *       "explanation": "...",
 *       "marks": 1,
 *       "negative": 0.33,
 *       "subject_tag": "Quantitative Aptitude",
 *       "topic_tag": "Percentages",
 *       "difficulty": "easy"
 *     }
 *   ]
 * }
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedPYQ(filePath, publish = false) {
    const client = await pool.connect();

    try {
        const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
        const data = JSON.parse(raw);

        if (!data.paper || !data.questions) {
            throw new Error('JSON must have "paper" and "questions" keys');
        }

        const p = data.paper;
        console.log(`\nSeeding: ${p.title || `${p.branch} ${p.year} ${p.session}`}`);
        console.log(`Questions: ${data.questions.length}`);

        await client.query('BEGIN');

        // Check if paper already exists
        const existing = await client.query(
            `SELECT id FROM pyq_papers WHERE year = $1 AND session = $2 AND branch = $3`,
            [p.year, p.session || 'Session 1', p.branch || 'EE']
        );

        let paperId;
        if (existing.rows.length > 0) {
            paperId = existing.rows[0].id;
            console.log(`Paper already exists (id=${paperId}). Deleting old questions...`);
            await client.query(`DELETE FROM pyq_questions WHERE paper_id = $1`, [paperId]);
            // Update paper metadata
            await client.query(
                `UPDATE pyq_papers SET title=$1, total_marks=$2, duration_minutes=$3, pdf_url=$4, question_count=$5, is_published=$6 WHERE id=$7`,
                [p.title, p.total_marks || 100, p.duration_minutes || 180, p.pdf_url || null, data.questions.length, publish, paperId]
            );
        } else {
            const insertResult = await client.query(
                `INSERT INTO pyq_papers (year, session, branch, title, total_marks, duration_minutes, pdf_url, question_count, is_published)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [p.year, p.session || 'Session 1', p.branch || 'EE', p.title,
                 p.total_marks || 100, p.duration_minutes || 180, p.pdf_url || null,
                 data.questions.length, publish]
            );
            paperId = insertResult.rows[0].id;
            console.log(`Created paper (id=${paperId})`);
        }

        // Insert questions
        let inserted = 0;
        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            await client.query(
                `INSERT INTO pyq_questions
                 (paper_id, question_number, section, question_type, question_text, options, correct_answer,
                  explanation, marks, negative_marks, subject_tag, topic_tag, difficulty, sort_order)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
                [
                    paperId,
                    q.question_number || (i + 1),
                    q.section || 'Technical',
                    q.question_type || q.type || 'mcq',
                    q.question_text || q.question,
                    q.options ? JSON.stringify(q.options) : null,
                    JSON.stringify(q.correct || q.correct_answer),
                    q.explanation || null,
                    q.marks || 1,
                    q.negative || q.negative_marks || 0,
                    q.subject_tag || null,
                    q.topic_tag || null,
                    q.difficulty || 'medium',
                    i
                ]
            );
            inserted++;
        }

        await client.query('COMMIT');
        console.log(`✅ Inserted ${inserted} questions into paper ${paperId}`);
        if (!publish) console.log(`⚠  Paper is NOT published. Use --publish flag or update is_published in DB.`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// CLI
const args = process.argv.slice(2);
const filePath = args.find(a => !a.startsWith('--'));
const publish = args.includes('--publish');

if (!filePath) {
    console.log('Usage: node seed_pyq.js <path-to-json> [--publish]');
    console.log('Example: node seed_pyq.js ./pyq_data/gate_ee_2024.json --publish');
    process.exit(1);
}

seedPYQ(filePath, publish);
