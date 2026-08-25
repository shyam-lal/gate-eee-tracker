const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const migrate = async () => {
    try {
        // Ordered list of migrations
        const migrations = [
            'migration_v2.sql',
            'migration_v3_tools.sql',
            'migration_v4_flashcards.sql',
            'migration_v5_focus_tracker.sql',
            'migration_v6_planner.sql',
            'migration_v7_planner.sql',
            'migration_v8_revision.sql',
            'migration_v9_revision_mode.sql',
            'migration_v10_default_revision.sql',
            'migration_v11_flashcard_groups.sql',
            'migration_v12_global_streak.sql',
            'migration_v13_fix_log_dates.sql',
            'migration_v14_multi_exam_core.sql',
            'migration_v15_alter_existing.sql',
            'migration_v16_materials_expansion.sql',
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
            'migration_v27_increase_name_lengths.sql',
            'migration_v28_active_sessions.sql',
            'migration_v29_diagnostic_tests.sql'
        ];

        for (const file of migrations) {
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
