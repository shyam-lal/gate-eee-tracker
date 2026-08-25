const pool = require('./src/config/db');

async function test() {
    try {
        const query = `
             SELECT s.id, s.title, s.content, es.name as subject_name, et.name as topic_name, s.topic_id 
             FROM study_materials s 
             JOIN exam_subjects es ON es.id = s.subject_id 
             JOIN exam_topics et ON et.id = s.topic_id 
             JOIN exams e ON e.id = s.exam_id
             WHERE s.content_type = 'flashcard_json' AND s.is_published = TRUE
             AND e.slug = $1
             ORDER BY es.sort_order ASC, et.sort_order ASC
        `;
        const res = await pool.query(query, ['gate-cs']);
        console.log("Rows returned:", res.rows.length);
        console.log(JSON.stringify(res.rows.map(r => r.title), null, 2));

        const examRes = await pool.query("SELECT id, slug FROM exams WHERE slug = 'gate-cs'");
        console.log("Exam ID for gate-cs:", examRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
