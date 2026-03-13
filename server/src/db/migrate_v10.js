const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
    console.log('Starting Migration v10 (Default Revision Tool)...');
    try {
        const sqlPath = path.join(__dirname, 'migration_v10_default_revision.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('Migration v10 completed successfully. Inserted default Revision tools for users who needed them.');
    } catch (err) {
        console.error('Migration v10 failed:', err);
    } finally {
        pool.end();
    }
}

runMigration();
