const pool = require('./src/config/db');

async function test() {
    try {
        const res = await pool.query("SELECT id, title, exam_id, subject_id, topic_id FROM study_materials WHERE content_type = 'flashcard_json'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
test();
