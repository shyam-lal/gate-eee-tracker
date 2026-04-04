const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const runMigration = async () => {
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, 'migration_v19_aptitude_skill_tree.sql'),
            'utf8'
        );
        await pool.query(sql);
        console.log('✅ Migration v19 (Aptitude Skill Tree) completed successfully.');
    } catch (err) {
        console.error('❌ Migration v19 failed:', err.message);
    } finally {
        await pool.end();
    }
};

runMigration();
