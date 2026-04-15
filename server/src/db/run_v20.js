const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const run = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v20_daily_plans.sql'), 'utf8');
        await pool.query(sql);
        console.log('✓ migration_v20_daily_plans.sql completed');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

run();
