const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const migrate = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v15_alter_existing.sql'), 'utf8');
        await pool.query(sql);
        console.log('Migration v15 (Alter Existing Tables) successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
