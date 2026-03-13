require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function migrate() {
    try {
        console.log('Running V8 Migration (Revision Mock Test System)...');
        const sqlPath = path.join(__dirname, 'migration_v8_revision.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sql);
        console.log('V8 Migration applied successfully!');
    } catch (err) {
        console.error('Migration V8 failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
