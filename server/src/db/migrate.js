const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const migrate = async () => {
    try {
        const files = fs.readdirSync(__dirname)
            .filter(file => file.startsWith('migration_') && file.endsWith('.sql'))
            .sort(); // Very basic sort, assuming names format is somewhat ordered or they don't depend strictly on numbering

        for (const file of files) {
            console.log(`Running migration: ${file}...`);
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
            await pool.query(sql);
            console.log(`✓ ${file} completed`);
        }
        console.log('All migrations executed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
