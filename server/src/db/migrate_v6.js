const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigration() {
    try {
        console.log("Starting DB Migration v6 (Study Planner)...");
        const sqlPath = path.join(__dirname, 'migration_v6_planner.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await db.query(sql);
        console.log("Migration v6 completed successfully! Created tables `weekly_goals` and `daily_notes`.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        process.exit();
    }
}

runMigration();
