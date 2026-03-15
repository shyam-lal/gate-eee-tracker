const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const migrate = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v12_global_streak.sql'), 'utf8');
        await pool.query(sql);
        console.log('Migration v12 (Global Streak) successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
