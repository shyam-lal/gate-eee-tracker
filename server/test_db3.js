const pool = require('./src/config/db');
async function test() {
    try {
        const res = await pool.query("SELECT id, name, slug FROM exams WHERE id BETWEEN 14 AND 37");
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
