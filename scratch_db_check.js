const db = require('../server/src/config/db');

async function checkDB() {
    try {
        const res = await db.query('SELECT id, year, branch, title, is_published FROM pyq_papers');
        console.log('Papers in DB:', res.rows);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        process.exit(0);
    }
}

checkDB();
