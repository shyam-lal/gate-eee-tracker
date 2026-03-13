const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v9_revision_mode.sql'), 'utf8');
        await pool.query(sql);
        console.log('V9 Migration (Revision Mode) applied successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
