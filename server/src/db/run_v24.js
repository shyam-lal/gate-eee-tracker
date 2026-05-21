const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigration() {
    const client = await pool.pool.connect();
    try {
        console.log('Running Migration v24: Study Preferences...');
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v24_study_preferences.sql'), 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Migration v24 completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration v24 failed:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

runMigration();
