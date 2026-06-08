const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// PostgreSQL pool using DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// List of migration files to apply in order (v17 -> v26)
const migrations = [
  'migration_v17_pyq.sql',
  'migration_v18_subscriptions.sql',
  'migration_v19_study_planning.sql',
  'migration_v20_daily_plans.sql',
  'migration_v21_task_logs.sql',
  'migration_v22_battle_plan.sql',
  'migration_v23_fix_estimates.sql',
  'migration_v24_study_preferences.sql',
  'migration_v25_ai_generation_mode.sql',
  'migration_v26_credits_system.sql',
];

const runMigration = async (file) => {
  const filePath = path.join(__dirname, file);
  console.log(`Applying ${file}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
  console.log(`${file} applied successfully.`);
};

const migrate = async () => {
  try {
    for (const file of migrations) {
      await runMigration(file);
    }
    console.log('All pending migrations up to v26 have been applied.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

migrate();
