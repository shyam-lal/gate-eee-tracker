const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const syllabusData = [
    {
        subject: "Engineering Mathematics",
        topics: [
            "Linear Algebra (Matrices, Rank, Eigenvalues, Eigenvectors)",
            "Calculus (Limits, Continuity, Differentiation, Integration)",
            "Differential Equations (First Order, Higher Order)",
            "Complex Variables (Analytic Functions, Cauchy-Riemann, Integration)",
            "Probability & Statistics"
        ]
    },
    {
        subject: "Network Theory (Electrical Circuits)",
        topics: [
            "Basic Circuit Laws (KCL, KVL)",
            "Network Theorems (Thevenin, Norton, Superposition, Maximum Power Transfer)",
            "Transient Analysis (RL, RC, RLC Circuits)",
            "Sinusoidal Steady State Analysis",
            "Resonance & Coupled Circuits",
            "Two-Port Networks",
            "Three Phase Circuits"
        ]
    },
    {
        subject: "Signals & Systems",
        topics: [
            "Classification of Signals and Systems",
            "LTI Systems and Convolution",
            "Fourier Series",
            "Fourier Transform",
            "Laplace Transform",
            "Z-Transform",
            "Sampling Theorem"
        ]
    },
    {
        subject: "Control Systems",
        topics: [
            "Mathematical Modeling of Systems",
            "Block Diagram Reduction",
            "Signal Flow Graphs",
            "Time Response Analysis",
            "Stability Analysis (Routh-Hurwitz)",
            "Root Locus Technique",
            "Frequency Response (Bode, Nyquist, Polar Plots)",
            "State Space Analysis"
        ]
    },
    {
        subject: "Electrical Machines",
        topics: [
            "Magnetic Circuits",
            "Transformers",
            "DC Machines",
            "Induction Machines",
            "Synchronous Machines",
            "Special Machines (Basics)"
        ]
    },
    {
        subject: "Power Systems",
        topics: [
            "Power Generation",
            "Transmission Line Parameters",
            "Performance of Transmission Lines",
            "Power System Analysis (Load Flow)",
            "Fault Analysis",
            "Stability of Power Systems",
            "Power System Protection",
            "Distribution Systems"
        ]
    },
    {
        subject: "Power Electronics",
        topics: [
            "Power Semiconductor Devices",
            "Controlled Rectifiers",
            "DC-DC Converters (Choppers)",
            "Inverters",
            "AC Voltage Controllers",
            "Power Supplies"
        ]
    },
    {
        subject: "Analog Electronics",
        topics: [
            "Diodes and Applications",
            "BJT and MOSFET Characteristics",
            "Amplifiers (Small Signal Analysis)",
            "Operational Amplifiers",
            "Linear and Non-Linear Applications of Op-Amps",
            "Oscillators and Feedback Amplifiers"
        ]
    },
    {
        subject: "Digital Electronics",
        topics: [
            "Number Systems",
            "Boolean Algebra and Logic Gates",
            "Combinational Circuits",
            "Sequential Circuits",
            "Flip-Flops and Counters",
            "Memories",
            "A/D and D/A Converters"
        ]
    },
    {
        subject: "Electrical Measurements",
        topics: [
            "Measurement of Voltage, Current, Power",
            "Errors and Calibration",
            "Analog Instruments",
            "Digital Instruments",
            "Bridges",
            "Transducers"
        ]
    },
    {
        subject: "General Aptitude",
        topics: [
            "Quantitative Aptitude",
            "Logical Reasoning",
            "Verbal Ability"
        ]
    }
];

const seed = async (email = 'test@example.com') => {
    try {
        console.log(`Seeding data for ${email}...`);

        // 1. Get or Create User
        let userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        let userId;

        if (userRes.rows.length === 0) {
            console.log('User not found. Creating test user...');
            const hashedPassword = await bcrypt.hash('password123', 10);
            const newUserRes = await pool.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
                ['testuser', email, hashedPassword]
            );
            userId = newUserRes.rows[0].id;
        } else {
            userId = userRes.rows[0].id;
        }

        // 2. Clear existing syllabus for this user (Optional, set to false if you want to append)
        const clearExisting = true;
        if (clearExisting) {
            console.log('Clearing existing syllabus data for user...');
            await pool.query('DELETE FROM subjects WHERE user_id = $1', [userId]);
        }

        // 3. Insert Syllabus
        for (const sub of syllabusData) {
            console.log(`Inserting Subject: ${sub.subject}`);
            const subjectRes = await pool.query(
                'INSERT INTO subjects (user_id, name) VALUES ($1, $2) RETURNING id',
                [userId, sub.subject]
            );
            const subjectId = subjectRes.rows[0].id;

            for (const topicName of sub.topics) {
                await pool.query(
                    'INSERT INTO topics (subject_id, name, estimated_minutes) VALUES ($1, $2, $3)',
                    [subjectId, topicName, 720] // Default 12 hours as per previous requirement
                );
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

// Check if email is passed as argument
const targetEmail = process.argv[2] || 'test@example.com';
seed(targetEmail);
