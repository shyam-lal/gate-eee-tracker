// server/src/db/migrate_bootstrap.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const bootstrapMigrations = [
    'migration_v1.sql',
    'migration_v2.sql',
    'migration_v3_tools.sql',
    'migration_v4_flashcards.sql',
    // add any other early migrations you discover missing
];

const run = async () => {
    try {
        for (const file of bootstrapMigrations) {
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
            console.log(`Applying ${file}...`);
            await pool.query(sql);
            console.log(`${file} applied`);
        }
        console.log('Bootstrap migrations complete.');
    } catch (e) {
        console.error('Bootstrap failed:', e);
    } finally {
        await pool.end();
    }
};

run();
