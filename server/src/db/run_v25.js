const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigration() {
    const client = await pool.pool.connect();
    try {
        console.log('Running Migration v25: AI Generation Mode...');
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v25_ai_generation_mode.sql'), 'utf8');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('Migration v25 completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration v25 failed:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

runMigration();
