const pool = require('./src/config/db');
async function test() {
    try {
        const res = await pool.query("SELECT exam_id, COUNT(*) FROM study_materials WHERE content_type = 'flashcard_json' GROUP BY exam_id ORDER BY exam_id ASC");
        console.log("Flashcards count by exam_id:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
