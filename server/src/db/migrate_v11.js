const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
    console.log('Starting Migration v11 (Flashcard Groups)...');
    try {
        const sqlPath = path.join(__dirname, 'migration_v11_flashcard_groups.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query('COMMIT');

        console.log('Migration v11 completed successfully.');
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Migration v11 failed:', err);
    } finally {
        pool.end();
    }
}

runMigration();
