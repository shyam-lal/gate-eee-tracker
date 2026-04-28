const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const run = async () => {
    try {
        console.log('🚀 Running migration_v23_fix_estimates.sql...');
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v23_fix_estimates.sql'), 'utf8');
        await pool.query(sql);
        console.log('✓ migration_v23_fix_estimates.sql completed');
        
        // Verify results
        const res = await pool.query(`
            SELECT 
                COUNT(*) as total_topics,
                COUNT(*) FILTER (WHERE estimated_hours IS NOT NULL) as has_hours,
                COUNT(*) FILTER (WHERE estimated_hours IS NULL) as null_hours,
                COUNT(*) FILTER (WHERE difficulty_level = 2) as easy,
                COUNT(*) FILTER (WHERE difficulty_level = 3) as medium,
                COUNT(*) FILTER (WHERE difficulty_level = 4) as hard
            FROM exam_topics
        `);
        const r = res.rows[0];
        console.log(`\n📊 Results:`);
        console.log(`  Total topics: ${r.total_topics}`);
        console.log(`  With estimated_hours: ${r.has_hours}`);
        console.log(`  Set to NULL (using fallback): ${r.null_hours}`);
        console.log(`  Easy (level 2): ${r.easy}`);
        console.log(`  Medium (level 3): ${r.medium}`);
        console.log(`  Hard (level 4): ${r.hard}`);
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
};

run();
