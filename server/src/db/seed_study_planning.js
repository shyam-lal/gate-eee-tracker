const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// ═══════════════════════════════════════════════════
// GATE EE — Enhanced Topic Metadata
// difficulty_level: 1=easy, 2=moderate, 3=medium, 4=hard, 5=very hard
// weightage: approximate marks weight within the subject
// estimated_hours: refined study time estimates
// prerequisites: topic names (resolved to IDs at runtime)
// ═══════════════════════════════════════════════════

const gateEETopicMetadata = {
    'Engineering Mathematics': {
        topics: [
            { name: 'Linear Algebra (Matrices, Rank, Eigenvalues, Eigenvectors)', difficulty_level: 3, weightage: 3.0, estimated_hours: 20 },
            { name: 'Calculus (Limits, Continuity, Differentiation, Integration)', difficulty_level: 2, weightage: 3.0, estimated_hours: 18 },
            { name: 'Differential Equations (First Order, Higher Order)', difficulty_level: 3, weightage: 2.5, estimated_hours: 16 },
            { name: 'Complex Variables (Analytic Functions, Cauchy-Riemann, Integration)', difficulty_level: 4, weightage: 2.5, estimated_hours: 15, prerequisites: ['Calculus (Limits, Continuity, Differentiation, Integration)'] },
            { name: 'Probability & Statistics', difficulty_level: 2, weightage: 2.0, estimated_hours: 12 },
        ]
    },
    'Network Theory (Electrical Circuits)': {
        topics: [
            { name: 'Basic Circuit Laws (KCL, KVL)', difficulty_level: 1, weightage: 1.5, estimated_hours: 8 },
            { name: 'Network Theorems (Thevenin, Norton, Superposition, Maximum Power Transfer)', difficulty_level: 2, weightage: 2.0, estimated_hours: 14, prerequisites: ['Basic Circuit Laws (KCL, KVL)'] },
            { name: 'Transient Analysis (RL, RC, RLC Circuits)', difficulty_level: 4, weightage: 1.5, estimated_hours: 16, prerequisites: ['Basic Circuit Laws (KCL, KVL)', 'Differential Equations (First Order, Higher Order)'] },
            { name: 'Sinusoidal Steady State Analysis', difficulty_level: 3, weightage: 1.0, estimated_hours: 12, prerequisites: ['Basic Circuit Laws (KCL, KVL)', 'Complex Variables (Analytic Functions, Cauchy-Riemann, Integration)'] },
            { name: 'Resonance & Coupled Circuits', difficulty_level: 3, weightage: 0.5, estimated_hours: 8, prerequisites: ['Sinusoidal Steady State Analysis'] },
            { name: 'Two-Port Networks', difficulty_level: 4, weightage: 1.0, estimated_hours: 10, prerequisites: ['Network Theorems (Thevenin, Norton, Superposition, Maximum Power Transfer)'] },
            { name: 'Three Phase Circuits', difficulty_level: 3, weightage: 0.5, estimated_hours: 6, prerequisites: ['Sinusoidal Steady State Analysis'] },
        ]
    },
    'Signals & Systems': {
        topics: [
            { name: 'Classification of Signals and Systems', difficulty_level: 2, weightage: 1.0, estimated_hours: 8 },
            { name: 'LTI Systems and Convolution', difficulty_level: 3, weightage: 1.5, estimated_hours: 12, prerequisites: ['Classification of Signals and Systems'] },
            { name: 'Fourier Series', difficulty_level: 3, weightage: 1.0, estimated_hours: 10, prerequisites: ['Calculus (Limits, Continuity, Differentiation, Integration)'] },
            { name: 'Fourier Transform', difficulty_level: 4, weightage: 1.5, estimated_hours: 12, prerequisites: ['Fourier Series'] },
            { name: 'Laplace Transform', difficulty_level: 3, weightage: 1.5, estimated_hours: 12, prerequisites: ['Complex Variables (Analytic Functions, Cauchy-Riemann, Integration)'] },
            { name: 'Z-Transform', difficulty_level: 4, weightage: 1.0, estimated_hours: 10, prerequisites: ['Laplace Transform'] },
            { name: 'Sampling Theorem', difficulty_level: 3, weightage: 0.5, estimated_hours: 4, prerequisites: ['Fourier Transform'] },
        ]
    },
    'Control Systems': {
        topics: [
            { name: 'Mathematical Modeling of Systems', difficulty_level: 2, weightage: 1.0, estimated_hours: 8, prerequisites: ['Laplace Transform'] },
            { name: 'Block Diagram Reduction', difficulty_level: 2, weightage: 0.5, estimated_hours: 4, prerequisites: ['Mathematical Modeling of Systems'] },
            { name: 'Signal Flow Graphs', difficulty_level: 2, weightage: 0.5, estimated_hours: 4, prerequisites: ['Mathematical Modeling of Systems'] },
            { name: 'Time Response Analysis', difficulty_level: 3, weightage: 1.5, estimated_hours: 10, prerequisites: ['Mathematical Modeling of Systems'] },
            { name: 'Stability Analysis (Routh-Hurwitz)', difficulty_level: 3, weightage: 1.0, estimated_hours: 8, prerequisites: ['Time Response Analysis'] },
            { name: 'Root Locus Technique', difficulty_level: 4, weightage: 1.0, estimated_hours: 10, prerequisites: ['Stability Analysis (Routh-Hurwitz)'] },
            { name: 'Frequency Response (Bode, Nyquist, Polar Plots)', difficulty_level: 4, weightage: 1.5, estimated_hours: 14, prerequisites: ['Stability Analysis (Routh-Hurwitz)', 'Fourier Transform'] },
            { name: 'State Space Analysis', difficulty_level: 5, weightage: 1.0, estimated_hours: 12, prerequisites: ['Linear Algebra (Matrices, Rank, Eigenvalues, Eigenvectors)', 'Mathematical Modeling of Systems'] },
        ]
    },
    'Electrical Machines': {
        topics: [
            { name: 'Magnetic Circuits', difficulty_level: 2, weightage: 1.0, estimated_hours: 6 },
            { name: 'Transformers', difficulty_level: 3, weightage: 2.5, estimated_hours: 16, prerequisites: ['Magnetic Circuits', 'Sinusoidal Steady State Analysis'] },
            { name: 'DC Machines', difficulty_level: 3, weightage: 2.0, estimated_hours: 14, prerequisites: ['Magnetic Circuits'] },
            { name: 'Induction Machines', difficulty_level: 4, weightage: 2.5, estimated_hours: 18, prerequisites: ['Transformers', 'Three Phase Circuits'] },
            { name: 'Synchronous Machines', difficulty_level: 4, weightage: 1.5, estimated_hours: 14, prerequisites: ['Three Phase Circuits', 'Magnetic Circuits'] },
            { name: 'Special Machines (Basics)', difficulty_level: 2, weightage: 0.5, estimated_hours: 4 },
        ]
    },
    'Power Systems': {
        topics: [
            { name: 'Power Generation', difficulty_level: 2, weightage: 1.0, estimated_hours: 6 },
            { name: 'Transmission Line Parameters', difficulty_level: 3, weightage: 1.5, estimated_hours: 10 },
            { name: 'Performance of Transmission Lines', difficulty_level: 4, weightage: 2.0, estimated_hours: 14, prerequisites: ['Transmission Line Parameters'] },
            { name: 'Power System Analysis (Load Flow)', difficulty_level: 5, weightage: 2.5, estimated_hours: 18, prerequisites: ['Linear Algebra (Matrices, Rank, Eigenvalues, Eigenvectors)', 'Three Phase Circuits'] },
            { name: 'Fault Analysis', difficulty_level: 4, weightage: 2.0, estimated_hours: 14, prerequisites: ['Power System Analysis (Load Flow)'] },
            { name: 'Stability of Power Systems', difficulty_level: 5, weightage: 1.5, estimated_hours: 12, prerequisites: ['Power System Analysis (Load Flow)'] },
            { name: 'Power System Protection', difficulty_level: 3, weightage: 1.0, estimated_hours: 8 },
            { name: 'Distribution Systems', difficulty_level: 2, weightage: 0.5, estimated_hours: 4 },
        ]
    },
    'Power Electronics': {
        topics: [
            { name: 'Power Semiconductor Devices', difficulty_level: 2, weightage: 1.0, estimated_hours: 6 },
            { name: 'Controlled Rectifiers', difficulty_level: 3, weightage: 2.0, estimated_hours: 14, prerequisites: ['Power Semiconductor Devices', 'Sinusoidal Steady State Analysis'] },
            { name: 'DC-DC Converters (Choppers)', difficulty_level: 3, weightage: 2.0, estimated_hours: 12, prerequisites: ['Power Semiconductor Devices'] },
            { name: 'Inverters', difficulty_level: 4, weightage: 1.5, estimated_hours: 12, prerequisites: ['Controlled Rectifiers'] },
            { name: 'AC Voltage Controllers', difficulty_level: 3, weightage: 1.0, estimated_hours: 6, prerequisites: ['Controlled Rectifiers'] },
            { name: 'Power Supplies', difficulty_level: 2, weightage: 0.5, estimated_hours: 4 },
        ]
    },
    'Analog Electronics': {
        topics: [
            { name: 'Diodes and Applications', difficulty_level: 1, weightage: 0.5, estimated_hours: 6 },
            { name: 'BJT and MOSFET Characteristics', difficulty_level: 3, weightage: 1.0, estimated_hours: 10, prerequisites: ['Diodes and Applications'] },
            { name: 'Amplifiers (Small Signal Analysis)', difficulty_level: 4, weightage: 1.5, estimated_hours: 14, prerequisites: ['BJT and MOSFET Characteristics'] },
            { name: 'Operational Amplifiers', difficulty_level: 2, weightage: 1.5, estimated_hours: 10 },
            { name: 'Linear and Non-Linear Applications of Op-Amps', difficulty_level: 3, weightage: 1.0, estimated_hours: 8, prerequisites: ['Operational Amplifiers'] },
            { name: 'Oscillators and Feedback Amplifiers', difficulty_level: 3, weightage: 0.5, estimated_hours: 6, prerequisites: ['Amplifiers (Small Signal Analysis)'] },
        ]
    },
    'Digital Electronics': {
        topics: [
            { name: 'Number Systems', difficulty_level: 1, weightage: 0.5, estimated_hours: 4 },
            { name: 'Boolean Algebra and Logic Gates', difficulty_level: 1, weightage: 1.0, estimated_hours: 6, prerequisites: ['Number Systems'] },
            { name: 'Combinational Circuits', difficulty_level: 2, weightage: 1.5, estimated_hours: 10, prerequisites: ['Boolean Algebra and Logic Gates'] },
            { name: 'Sequential Circuits', difficulty_level: 3, weightage: 1.0, estimated_hours: 10, prerequisites: ['Combinational Circuits'] },
            { name: 'Flip-Flops and Counters', difficulty_level: 3, weightage: 1.0, estimated_hours: 8, prerequisites: ['Sequential Circuits'] },
            { name: 'Memories', difficulty_level: 2, weightage: 0.5, estimated_hours: 4 },
            { name: 'A/D and D/A Converters', difficulty_level: 3, weightage: 0.5, estimated_hours: 6, prerequisites: ['Operational Amplifiers'] },
        ]
    },
    'Electrical Measurements': {
        topics: [
            { name: 'Measurement of Voltage, Current, Power', difficulty_level: 2, weightage: 1.5, estimated_hours: 8 },
            { name: 'Errors and Calibration', difficulty_level: 2, weightage: 1.0, estimated_hours: 6 },
            { name: 'Analog Instruments', difficulty_level: 2, weightage: 1.0, estimated_hours: 6 },
            { name: 'Digital Instruments', difficulty_level: 2, weightage: 0.5, estimated_hours: 4 },
            { name: 'Bridges', difficulty_level: 3, weightage: 1.0, estimated_hours: 8, prerequisites: ['Sinusoidal Steady State Analysis'] },
            { name: 'Transducers', difficulty_level: 2, weightage: 1.0, estimated_hours: 6 },
        ]
    },
    'General Aptitude': {
        topics: [
            { name: 'Quantitative Aptitude', difficulty_level: 2, weightage: 5.0, estimated_hours: 20 },
            { name: 'Logical Reasoning', difficulty_level: 2, weightage: 5.0, estimated_hours: 15 },
            { name: 'Verbal Ability', difficulty_level: 2, weightage: 5.0, estimated_hours: 15 },
        ]
    },
};


// ═══════════════════════════════════════════════════
// Seed Execution
// ═══════════════════════════════════════════════════

const seedStudyPlanning = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🚀 Seeding GATE EE study planning metadata...\n');

        // 1. Get the GATE EE exam
        const examRes = await client.query(`SELECT id FROM exams WHERE slug = 'gate-ee'`);
        if (!examRes.rows.length) {
            console.error('❌ GATE EE exam not found. Run seed_exams.js first.');
            return;
        }
        const examId = examRes.rows[0].id;

        // 2. Build a map of ALL topic names → IDs across all subjects for prerequisite resolution
        const allTopicsRes = await client.query(
            `SELECT et.id, et.name, es.name as subject_name
             FROM exam_topics et
             JOIN exam_subjects es ON es.id = et.subject_id
             WHERE es.exam_id = $1`,
            [examId]
        );
        const topicNameToId = {};
        for (const row of allTopicsRes.rows) {
            topicNameToId[row.name] = row.id;
        }

        // 3. Update each topic with metadata
        let updated = 0;
        for (const [subjectName, subjectData] of Object.entries(gateEETopicMetadata)) {
            // Get subject ID
            const subjectRes = await client.query(
                `SELECT id FROM exam_subjects WHERE exam_id = $1 AND name = $2`,
                [examId, subjectName]
            );
            if (!subjectRes.rows.length) {
                console.warn(`  ⚠ Subject "${subjectName}" not found, skipping.`);
                continue;
            }
            const subjectId = subjectRes.rows[0].id;

            for (const topic of subjectData.topics) {
                // Resolve prerequisite names to IDs
                const prerequisiteIds = (topic.prerequisites || [])
                    .map(name => topicNameToId[name])
                    .filter(id => id !== undefined);

                await client.query(
                    `UPDATE exam_topics SET
                        difficulty_level = $1,
                        weightage = $2,
                        estimated_hours = $3,
                        prerequisites = $4
                     WHERE subject_id = $5 AND name = $6`,
                    [
                        topic.difficulty_level,
                        topic.weightage,
                        topic.estimated_hours,
                        prerequisiteIds.length > 0 ? prerequisiteIds : '{}',
                        subjectId,
                        topic.name,
                    ]
                );
                updated++;
            }
            console.log(`  ✓ ${subjectName} (${subjectData.topics.length} topics)`);
        }

        await client.query('COMMIT');
        console.log(`\n✅ Updated ${updated} topics with study planning metadata.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
};

seedStudyPlanning();
