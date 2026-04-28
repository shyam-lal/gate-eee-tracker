const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const estimates = {
    // Math
    'Linear Algebra (Matrices, Rank, Eigenvalues, Eigenvectors)': 12,
    'Calculus (Limits, Continuity, Differentiation, Integration)': 15,
    'Differential Equations (First Order, Higher Order)': 10,
    'Complex Variables (Analytic Functions, Cauchy-Riemann, Integration)': 8,
    'Probability & Statistics': 12,

    // Network Theory
    'Basic Circuit Laws (KCL, KVL)': 6,
    'Network Theorems (Thevenin, Norton, Superposition, Maximum Power Transfer)': 12,
    'Transient Analysis (RL, RC, RLC Circuits)': 15,
    'Sinusoidal Steady State Analysis': 8,
    'Two-Port Networks': 6,

    // Machines
    'Transformers': 15,
    'DC Machines': 18,
    'Induction Machines': 25,
    'Synchronous Machines': 25,

    // CS Topics (for variety/coverage)
    'Discrete Mathematics (Propositional Logic, Sets, Relations, Functions, Graph Theory)': 35,
    'Programming in C': 20,
    'Data Structures': 25,
};

async function run() {
    console.log('🚀 Starting Estimate Update...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        for (const [name, hours] of Object.entries(estimates)) {
            const res = await client.query(
                'UPDATE exam_topics SET estimated_hours = $1 WHERE name = $2',
                [hours, name]
            );
            if (res.rowCount > 0) {
                console.log(`  ✓ Updated "${name}" -> ${hours}h`);
            }
        }

        await client.query('COMMIT');
        console.log('\n✅ Successfully updated GATE estimates.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Update failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
