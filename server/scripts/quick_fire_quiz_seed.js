const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

function unslugify(slug) {
    if (!slug) return '';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function seedDiagnosticQuestions() {
    try {
        console.log('Seeding diagnostic questions...');
        const jsonPath = path.join(__dirname, '../quick_fire_quiz.json');
        
        if (!fs.existsSync(jsonPath)) {
            console.log('No quick_fire_quiz.json found, skipping seed.');
            return;
        }

        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let insertedCount = 0;

        for (const subjectBlock of data) {
            // Find subject ID by slug
            let subjectRes = await db.query('SELECT id FROM exam_subjects WHERE slug = $1', [subjectBlock.subject_slug]);
            let subjectId;
            
            if (subjectRes.rows.length === 0) {
                console.log(`Subject not found: ${subjectBlock.subject_slug}. Creating it...`);
                const name = unslugify(subjectBlock.subject_slug);
                const insertSub = await db.query(
                    'INSERT INTO exam_subjects (name, slug) VALUES ($1, $2) RETURNING id',
                    [name, subjectBlock.subject_slug]
                );
                subjectId = insertSub.rows[0].id;
            } else {
                subjectId = subjectRes.rows[0].id;
            }

            for (const q of subjectBlock.questions) {
                // Find topic ID by slug
                let topicRes = await db.query('SELECT id FROM exam_topics WHERE slug = $1 AND subject_id = $2', [q.topic_slug, subjectId]);
                let topicId;
                
                if (topicRes.rows.length === 0) {
                    console.log(`Topic not found: ${q.topic_slug}. Creating it...`);
                    const topicName = unslugify(q.topic_slug);
                    const insertTopic = await db.query(
                        'INSERT INTO exam_topics (subject_id, name, slug) VALUES ($1, $2, $3) RETURNING id',
                        [subjectId, topicName, q.topic_slug]
                    );
                    topicId = insertTopic.rows[0].id;
                } else {
                    topicId = topicRes.rows[0].id;
                }

                // Upsert question
                const existingRes = await db.query('SELECT id FROM diagnostic_questions WHERE subject_id = $1 AND topic_id = $2 AND question_text = $3', [subjectId, topicId, q.question_text]);
                
                if (existingRes.rows.length === 0) {
                    await db.query(`
                        INSERT INTO diagnostic_questions 
                        (subject_id, topic_id, difficulty, question_text, options, correct_option_id, explanation, related_feature_recommendation)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [
                        subjectId,
                        topicId,
                        q.difficulty || 'medium',
                        q.question_text,
                        JSON.stringify(q.options),
                        q.correct_option_id,
                        q.explanation,
                        q.related_feature_recommendation ? JSON.stringify(q.related_feature_recommendation) : null
                    ]);
                    insertedCount++;
                }
            }
        }

        console.log(`Successfully seeded ${insertedCount} new diagnostic questions.`);
    } catch (err) {
        console.error('Error seeding diagnostic questions:', err);
    } finally {
        await db.end();
    }
}

if (require.main === module) {
    seedDiagnosticQuestions().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedDiagnosticQuestions;
