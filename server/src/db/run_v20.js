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
            path.join(__dirname, 'migration_v20_aptitude_content.sql'),
            'utf8'
        );
        await pool.query(sql);
        console.log('✅ Migration v20 (Aptitude Content) completed successfully.');
    } catch (err) {
        console.error('❌ Migration v20 failed:', err.message);
    } finally {
        await pool.end();
    }
};

runMigration();
