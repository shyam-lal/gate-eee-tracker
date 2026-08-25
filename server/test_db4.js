const pool = require('./src/config/db');
async function test() {
    try {
        const res = await pool.query("SELECT id, title, exam_id, subject_id, topic_id FROM study_materials WHERE subject_id IN (SELECT id FROM exam_subjects WHERE exam_id = 2)");
        console.log("Flashcards for gate-cs (exam_id=2):", res.rows);

        const resAll = await pool.query("SELECT COUNT(*) FROM study_materials WHERE content_type = 'flashcard_json'");
        console.log("Total flashcards:", resAll.rows[0].count);

        const resNull = await pool.query("SELECT COUNT(*) FROM study_materials WHERE exam_id IS NULL AND content_type = 'flashcard_json'");
        console.log("Flashcards with NULL exam_id:", resNull.rows[0].count);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
