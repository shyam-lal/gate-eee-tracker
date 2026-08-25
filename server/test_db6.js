const pool = require('./src/config/db');
async function test() {
    try {
        const query = `
            SELECT e.id, e.name, e.slug, COUNT(s.id) as flashcard_count
            FROM exams e
            LEFT JOIN study_materials s ON s.exam_id = e.id AND s.content_type = 'flashcard_json'
            GROUP BY e.id, e.name, e.slug
            ORDER BY e.id ASC
        `;
        const res = await pool.query(query);
        console.log("Flashcard counts by exam:");
        res.rows.forEach(row => {
            console.log(`ID: ${row.id.toString().padEnd(3)} | Name: ${row.name.padEnd(20)} | Slug: ${row.slug.padEnd(15)} | Count: ${row.flashcard_count}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
