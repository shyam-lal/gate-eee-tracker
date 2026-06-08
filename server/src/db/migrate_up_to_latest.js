// server/src/db/migrate_up_to_latest.js
// ---------------------------------------------------------------
// Migration runner that applies pending migrations up to v26.
// ---------------------------------------------------------------
// NOTE: This script intentionally skips any migration file that
//       contains the word "vector" in its filename, because the
//       staging server does not have the pgvector extension.
// ---------------------------------------------------------------

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// ----------------------------------------------------------------
// PostgreSQL connection pool (uses DATABASE_URL from .env)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// ----------------------------------------------------------------

// ----------------------------------------------------------------
// Ordered list of migration files to apply (v17 → v26)
// ----------------------------------------------------------------
const migrations = [
  // v17‑v26 migrations – vector‑related files are omitted
  // ---------------------------------------------------------
  // migration_v17_pyq.sql                – pyq data
  // migration_v18_subscriptions.sql      – subscription tables
  // migration_v19_study_planning.sql     – study‑planning tables
  // migration_v20_daily_plans.sql        – daily‑plan tables
  // migration_v21_task_logs.sql          – task‑log tables
  // migration_v22_battle_plan.sql        – battle‑plan tables
  // migration_v23_fix_estimates.sql      – estimate fixes
  // migration_v24_study_preferences.sql – preferences table
  // migration_v25_ai_generation_mode.sql – AI generation mode flag
  // migration_v26_credits_system.sql     – credits tables & triggers
  // ---------------------------------------------------------
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

// ----------------------------------------------------------------
// Helper: run a single migration file
// ----------------------------------------------------------------
const runMigration = async (file) => {
  const filePath = path.join(__dirname, file);
  console.log(`Applying ${file}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
  console.log(`${file} applied successfully.`);
};

// ----------------------------------------------------------------
// Main driver
// ----------------------------------------------------------------
const migrate = async () => {
  try {
    for (const file of migrations) {
      // Defensive check – skip any file that mentions “vector”
      if (file.toLowerCase().includes('vector')) {
        console.log(`⚠️ Skipping ${file} (vector feature not enabled)`);
        continue;
      }
      await runMigration(file);
    }
    console.log('All pending migrations up to v26 have been applied (vector migrations excluded).');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
};

migrate();
