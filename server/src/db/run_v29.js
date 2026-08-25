const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function run() {
    try {
        console.log('Running Migration v29 (Diagnostic Tests)...');
        const sqlPath = path.join(__dirname, 'migration_v29_diagnostic_tests.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sql);
        console.log('Migration v29 completed successfully.');
    } catch (err) {
        console.error('Error running Migration v29:', err);
        throw err;
    }
}

if (require.main === module) {
    run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = run;
