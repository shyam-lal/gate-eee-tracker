require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function migrate() {
    try {
        console.log('Running V7 Migration (Planner Notes V3)...');
        const sqlPath = path.join(__dirname, 'migration_v7_planner.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sql);
        console.log('V7 Migration applied successfully!');
    } catch (err) {
        console.error('Migration V7 failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
