const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// ═══════════════════════════════════════════════════
// Exam Categories
// ═══════════════════════════════════════════════════

const categories = [
    {
        name: 'Engineering Entrance',
        slug: 'engineering',
        description: 'Graduate and post-graduate engineering competitive exams',
        country: 'IN',
        icon: 'cpu',
        sort_order: 1,
    },
    {
        name: 'Civil Services',
        slug: 'civil-services',
        description: 'Government civil services examinations',
        country: 'IN',
        icon: 'landmark',
        sort_order: 2,
    },
    {
        name: 'Banking & Finance',
        slug: 'banking',
        description: 'Banking and financial services recruitment exams',
        country: 'IN',
        icon: 'banknote',
        sort_order: 3,
    },
    {
        name: 'Medical',
        slug: 'medical',
        description: 'Medical entrance and post-graduate exams',
        country: 'IN',
        icon: 'heart-pulse',
        sort_order: 4,
    },
    {
        name: 'Custom',
        slug: 'custom',
        description: 'Create your own exam syllabus and study plan',
        country: 'ALL',
        icon: 'settings',
        sort_order: 99,
    },
];

// ═══════════════════════════════════════════════════
// Exams with syllabi
// ═══════════════════════════════════════════════════

const exams = [
    // ─── GATE EE ───────────────────────────────────
    {
        category_slug: 'engineering',
        name: 'GATE EE',
        slug: 'gate-ee',
        full_name: 'Graduate Aptitude Test in Engineering — Electrical Engineering',
        description: 'National-level exam for M.Tech/PSU recruitment in Electrical Engineering',
        primary_color: '#6366f1',
        accent_color: '#818cf8',
        config: {
            total_marks: 100,
            duration_minutes: 180,
            sections: ['General Aptitude', 'Technical'],
            negative_marking: true,
            negative_marks_ratio: 1/3,
        },
        available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'],
        subjects: [
            {
                name: 'Engineering Mathematics',
                sort_order: 1,
                weightage: 13,
                topics: [
                    'Linear Algebra (Matrices, Rank, Eigenvalues, Eigenvectors)',
                    'Calculus (Limits, Continuity, Differentiation, Integration)',
                    'Differential Equations (First Order, Higher Order)',
                    'Complex Variables (Analytic Functions, Cauchy-Riemann, Integration)',
                    'Probability & Statistics',
                ],
            },
            {
                name: 'Network Theory (Electrical Circuits)',
                sort_order: 2,
                weightage: 8,
                topics: [
                    'Basic Circuit Laws (KCL, KVL)',
                    'Network Theorems (Thevenin, Norton, Superposition, Maximum Power Transfer)',
                    'Transient Analysis (RL, RC, RLC Circuits)',
                    'Sinusoidal Steady State Analysis',
                    'Resonance & Coupled Circuits',
                    'Two-Port Networks',
                    'Three Phase Circuits',
                ],
            },
            {
                name: 'Signals & Systems',
                sort_order: 3,
                weightage: 8,
                topics: [
                    'Classification of Signals and Systems',
                    'LTI Systems and Convolution',
                    'Fourier Series',
                    'Fourier Transform',
                    'Laplace Transform',
                    'Z-Transform',
                    'Sampling Theorem',
                ],
            },
            {
                name: 'Control Systems',
                sort_order: 4,
                weightage: 8,
                topics: [
                    'Mathematical Modeling of Systems',
                    'Block Diagram Reduction',
                    'Signal Flow Graphs',
                    'Time Response Analysis',
                    'Stability Analysis (Routh-Hurwitz)',
                    'Root Locus Technique',
                    'Frequency Response (Bode, Nyquist, Polar Plots)',
                    'State Space Analysis',
                ],
            },
            {
                name: 'Electrical Machines',
                sort_order: 5,
                weightage: 10,
                topics: [
                    'Magnetic Circuits',
                    'Transformers',
                    'DC Machines',
                    'Induction Machines',
                    'Synchronous Machines',
                    'Special Machines (Basics)',
                ],
            },
            {
                name: 'Power Systems',
                sort_order: 6,
                weightage: 12,
                topics: [
                    'Power Generation',
                    'Transmission Line Parameters',
                    'Performance of Transmission Lines',
                    'Power System Analysis (Load Flow)',
                    'Fault Analysis',
                    'Stability of Power Systems',
                    'Power System Protection',
                    'Distribution Systems',
                ],
            },
            {
                name: 'Power Electronics',
                sort_order: 7,
                weightage: 8,
                topics: [
                    'Power Semiconductor Devices',
                    'Controlled Rectifiers',
                    'DC-DC Converters (Choppers)',
                    'Inverters',
                    'AC Voltage Controllers',
                    'Power Supplies',
                ],
            },
            {
                name: 'Analog Electronics',
                sort_order: 8,
                weightage: 6,
                topics: [
                    'Diodes and Applications',
                    'BJT and MOSFET Characteristics',
                    'Amplifiers (Small Signal Analysis)',
                    'Operational Amplifiers',
                    'Linear and Non-Linear Applications of Op-Amps',
                    'Oscillators and Feedback Amplifiers',
                ],
            },
            {
                name: 'Digital Electronics',
                sort_order: 9,
                weightage: 6,
                topics: [
                    'Number Systems',
                    'Boolean Algebra and Logic Gates',
                    'Combinational Circuits',
                    'Sequential Circuits',
                    'Flip-Flops and Counters',
                    'Memories',
                    'A/D and D/A Converters',
                ],
            },
            {
                name: 'Electrical Measurements',
                sort_order: 10,
                weightage: 6,
                topics: [
                    'Measurement of Voltage, Current, Power',
                    'Errors and Calibration',
                    'Analog Instruments',
                    'Digital Instruments',
                    'Bridges',
                    'Transducers',
                ],
            },
            {
                name: 'General Aptitude',
                sort_order: 11,
                weightage: 15,
                topics: [
                    'Quantitative Aptitude',
                    'Logical Reasoning',
                    'Verbal Ability',
                ],
            },
        ],
    },

    // ─── GATE CS ───────────────────────────────────
    {
        category_slug: 'engineering',
        name: 'GATE CS',
        slug: 'gate-cs',
        full_name: 'Graduate Aptitude Test in Engineering — Computer Science',
        description: 'National-level exam for M.Tech/PSU recruitment in Computer Science',
        primary_color: '#10b981',
        accent_color: '#34d399',
        config: {
            total_marks: 100,
            duration_minutes: 180,
            sections: ['General Aptitude', 'Technical'],
            negative_marking: true,
            negative_marks_ratio: 1/3,
        },
        available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'],
        subjects: [
            {
                name: 'Engineering Mathematics',
                sort_order: 1,
                weightage: 13,
                topics: [
                    'Discrete Mathematics (Propositional Logic, Sets, Relations, Functions, Graph Theory)',
                    'Linear Algebra (Matrices, Eigenvalues, LU Decomposition)',
                    'Calculus (Mean Value Theorems, Integration)',
                    'Probability & Statistics',
                    'Combinatorics',
                ],
            },
            {
                name: 'Digital Logic',
                sort_order: 2,
                weightage: 5,
                topics: [
                    'Boolean Algebra & Minimization',
                    'Combinational Circuits',
                    'Sequential Circuits',
                    'Number Representations',
                ],
            },
            {
                name: 'Computer Organization & Architecture',
                sort_order: 3,
                weightage: 8,
                topics: [
                    'Machine Instructions & Addressing Modes',
                    'ALU, Data Path & Control Unit',
                    'Memory Hierarchy (Cache, Main Memory)',
                    'I/O Interface (Interrupt, DMA)',
                    'Instruction Pipelining',
                ],
            },
            {
                name: 'Programming & Data Structures',
                sort_order: 4,
                weightage: 10,
                topics: [
                    'Programming in C',
                    'Recursion',
                    'Arrays, Stacks, Queues, Linked Lists',
                    'Trees (Binary, BST, AVL)',
                    'Graphs',
                    'Hashing',
                ],
            },
            {
                name: 'Algorithms',
                sort_order: 5,
                weightage: 8,
                topics: [
                    'Asymptotic Analysis',
                    'Searching, Sorting, Hashing',
                    'Divide and Conquer',
                    'Greedy Algorithms',
                    'Dynamic Programming',
                    'Graph Algorithms (BFS, DFS, MST, Shortest Path)',
                    'NP-Completeness',
                ],
            },
            {
                name: 'Theory of Computation',
                sort_order: 6,
                weightage: 8,
                topics: [
                    'Regular Languages & Finite Automata',
                    'Context-Free Languages & Pushdown Automata',
                    'Turing Machines',
                    'Undecidability',
                ],
            },
            {
                name: 'Compiler Design',
                sort_order: 7,
                weightage: 5,
                topics: [
                    'Lexical Analysis',
                    'Parsing (Top-Down, Bottom-Up)',
                    'Syntax-Directed Translation',
                    'Intermediate Code Generation',
                    'Runtime Environments',
                    'Code Optimization',
                ],
            },
            {
                name: 'Operating Systems',
                sort_order: 8,
                weightage: 10,
                topics: [
                    'Processes, Threads, Scheduling',
                    'Synchronization (Semaphores, Monitors, Deadlocks)',
                    'Memory Management (Paging, Segmentation, Virtual Memory)',
                    'File Systems',
                    'I/O Systems',
                ],
            },
            {
                name: 'Databases',
                sort_order: 9,
                weightage: 8,
                topics: [
                    'ER Model',
                    'Relational Model & Algebra',
                    'SQL',
                    'Normalization',
                    'Transactions & Concurrency Control',
                    'Indexing & File Organization',
                ],
            },
            {
                name: 'Computer Networks',
                sort_order: 10,
                weightage: 8,
                topics: [
                    'OSI & TCP/IP Models',
                    'Data Link Layer (Framing, Error Detection, MAC)',
                    'Network Layer (Routing, IP Addressing, Subnetting)',
                    'Transport Layer (TCP, UDP, Flow/Congestion Control)',
                    'Application Layer (DNS, HTTP, FTP, Email)',
                    'Network Security Basics',
                ],
            },
            {
                name: 'General Aptitude',
                sort_order: 11,
                weightage: 15,
                topics: [
                    'Quantitative Aptitude',
                    'Logical Reasoning',
                    'Verbal Ability',
                ],
            },
        ],
    },

    // ─── UPSC CSE ──────────────────────────────────
    {
        category_slug: 'civil-services',
        name: 'UPSC CSE',
        slug: 'upsc-cse',
        full_name: 'Union Public Service Commission — Civil Services Examination',
        description: 'India\'s premier civil services exam for IAS, IPS, IFS and other services',
        primary_color: '#f59e0b',
        accent_color: '#fbbf24',
        config: {
            stages: ['Prelims', 'Mains', 'Interview'],
            prelims_papers: 2,
            mains_papers: 9,
            negative_marking: true,
            negative_marks_ratio: 1/3,
        },
        available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'],
        subjects: [
            {
                name: 'Indian History',
                sort_order: 1,
                topics: [
                    'Ancient India',
                    'Medieval India',
                    'Modern India (British Period)',
                    'Indian National Movement',
                    'Post-Independence India',
                    'Art & Culture',
                ],
            },
            {
                name: 'Indian Polity & Governance',
                sort_order: 2,
                topics: [
                    'Constitution of India',
                    'Fundamental Rights & Duties',
                    'Parliament & State Legislatures',
                    'Judiciary',
                    'Federalism & Centre-State Relations',
                    'Panchayati Raj & Local Governance',
                    'Statutory & Constitutional Bodies',
                ],
            },
            {
                name: 'Geography',
                sort_order: 3,
                topics: [
                    'Physical Geography',
                    'Indian Geography',
                    'World Geography',
                    'Climatology',
                    'Oceanography',
                    'Environmental Geography',
                ],
            },
            {
                name: 'Indian Economy',
                sort_order: 4,
                topics: [
                    'Economic Planning & NITI Aayog',
                    'Agriculture & Food Processing',
                    'Industry & Infrastructure',
                    'Banking & Finance',
                    'External Trade & BOP',
                    'Poverty, Inequality & Unemployment',
                    'Government Budgeting & Fiscal Policy',
                ],
            },
            {
                name: 'Science & Technology',
                sort_order: 5,
                topics: [
                    'Space Technology (ISRO)',
                    'Defence Technology (DRDO)',
                    'Nuclear Technology',
                    'Biotechnology',
                    'Information Technology & Cyber Security',
                    'Health & Medicine',
                ],
            },
            {
                name: 'Environment & Ecology',
                sort_order: 6,
                topics: [
                    'Biodiversity & Conservation',
                    'Climate Change & Global Warming',
                    'Environmental Laws & Policies',
                    'Pollution & Waste Management',
                    'Sustainable Development',
                ],
            },
            {
                name: 'Current Affairs',
                sort_order: 7,
                topics: [
                    'National Affairs',
                    'International Affairs',
                    'Awards & Honours',
                    'Sports & Events',
                    'Government Schemes & Policies',
                ],
            },
            {
                name: 'Ethics, Integrity & Aptitude',
                sort_order: 8,
                topics: [
                    'Ethics & Human Interface',
                    'Attitude',
                    'Aptitude & Foundational Values',
                    'Emotional Intelligence',
                    'Public/Civil Service Values',
                    'Probity in Governance',
                    'Case Studies',
                ],
            },
            {
                name: 'CSAT (Paper II)',
                sort_order: 9,
                topics: [
                    'Comprehension',
                    'Interpersonal Skills',
                    'Logical Reasoning & Analytical Ability',
                    'Decision Making & Problem Solving',
                    'Basic Numeracy & Data Interpretation',
                ],
            },
        ],
    },

    // ─── SSC CGL ───────────────────────────────────
    {
        category_slug: 'civil-services',
        name: 'SSC CGL',
        slug: 'ssc-cgl',
        full_name: 'Staff Selection Commission — Combined Graduate Level Examination',
        description: 'National-level exam for Group B and Group C posts in Government of India',
        primary_color: '#ef4444',
        accent_color: '#f87171',
        config: {
            tiers: ['Tier I', 'Tier II'],
            negative_marking: true,
        },
        available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'],
        subjects: [
            {
                name: 'Quantitative Aptitude',
                sort_order: 1,
                topics: [
                    'Number System',
                    'Percentage, Profit & Loss',
                    'Ratio & Proportion',
                    'Time, Speed & Distance',
                    'Time & Work',
                    'Algebra',
                    'Geometry & Mensuration',
                    'Trigonometry',
                    'Data Interpretation',
                ],
            },
            {
                name: 'English Language',
                sort_order: 2,
                topics: [
                    'Reading Comprehension',
                    'Error Detection & Correction',
                    'Fill in the Blanks',
                    'Synonyms & Antonyms',
                    'Idioms & Phrases',
                    'One Word Substitution',
                    'Sentence Improvement',
                ],
            },
            {
                name: 'General Intelligence & Reasoning',
                sort_order: 3,
                topics: [
                    'Analogy & Classification',
                    'Series (Number, Letter, Figure)',
                    'Coding-Decoding',
                    'Blood Relations',
                    'Direction & Distance',
                    'Syllogism',
                    'Venn Diagrams',
                    'Non-Verbal Reasoning',
                ],
            },
            {
                name: 'General Awareness',
                sort_order: 4,
                topics: [
                    'Indian History',
                    'Geography',
                    'Indian Polity',
                    'Indian Economy',
                    'General Science',
                    'Current Affairs',
                    'Static GK',
                ],
            },
        ],
    },

    // ─── IBPS PO ───────────────────────────────────
    {
        category_slug: 'banking',
        name: 'IBPS PO',
        slug: 'ibps-po',
        full_name: 'Institute of Banking Personnel Selection — Probationary Officer',
        description: 'Recruitment exam for Probationary Officers in public sector banks',
        primary_color: '#0ea5e9',
        accent_color: '#38bdf8',
        config: {
            stages: ['Prelims', 'Mains', 'Interview'],
            negative_marking: true,
            negative_marks_ratio: 1/4,
        },
        available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'],
        subjects: [
            {
                name: 'Quantitative Aptitude',
                sort_order: 1,
                topics: [
                    'Number Series',
                    'Simplification & Approximation',
                    'Data Interpretation',
                    'Percentage, Profit & Loss',
                    'Time & Work, Pipes & Cisterns',
                    'Ratio, Proportion & Partnership',
                    'Probability',
                ],
            },
            {
                name: 'Reasoning Ability',
                sort_order: 2,
                topics: [
                    'Seating Arrangement (Linear & Circular)',
                    'Puzzles',
                    'Syllogism',
                    'Blood Relations',
                    'Coding-Decoding',
                    'Inequality',
                    'Data Sufficiency',
                    'Input-Output',
                ],
            },
            {
                name: 'English Language',
                sort_order: 3,
                topics: [
                    'Reading Comprehension',
                    'Cloze Test',
                    'Error Detection',
                    'Sentence Rearrangement',
                    'Fill in the Blanks',
                    'Vocabulary',
                ],
            },
            {
                name: 'General/Financial Awareness',
                sort_order: 4,
                topics: [
                    'Banking Awareness',
                    'Financial Awareness',
                    'Current Affairs',
                    'Static GK',
                    'RBI & Monetary Policy',
                ],
            },
            {
                name: 'Computer Aptitude',
                sort_order: 5,
                topics: [
                    'Computer Fundamentals',
                    'Networking',
                    'Internet & Security',
                    'MS Office',
                    'Database Basics',
                ],
            },
        ],
    },

    // ─── NEET ──────────────────────────────────────
    {
        category_slug: 'medical',
        name: 'NEET UG',
        slug: 'neet-ug',
        full_name: 'National Eligibility cum Entrance Test — Undergraduate',
        description: 'National-level entrance exam for MBBS, BDS, and other medical courses',
        primary_color: '#ec4899',
        accent_color: '#f472b6',
        config: {
            total_marks: 720,
            duration_minutes: 200,
            questions: 200,
            attempted: 180,
            negative_marking: true,
            negative_marks_ratio: 1/4,
        },
        available_tools: ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'],
        subjects: [
            {
                name: 'Physics',
                sort_order: 1,
                weightage: 25,
                topics: [
                    'Mechanics',
                    'Thermodynamics',
                    'Waves & Oscillations',
                    'Optics',
                    'Electrostatics & Current Electricity',
                    'Magnetism & Electromagnetic Induction',
                    'Modern Physics',
                    'Semiconductor Devices',
                ],
            },
            {
                name: 'Chemistry',
                sort_order: 2,
                weightage: 25,
                topics: [
                    'Physical Chemistry (Atomic Structure, Equilibrium, Thermodynamics)',
                    'Inorganic Chemistry (Classification, Bonding, Coordination Compounds)',
                    'Organic Chemistry (Hydrocarbons, Polymers, Biomolecules)',
                ],
            },
            {
                name: 'Biology (Botany)',
                sort_order: 3,
                weightage: 25,
                topics: [
                    'Cell Biology',
                    'Plant Anatomy & Morphology',
                    'Plant Physiology',
                    'Genetics & Evolution',
                    'Ecology & Environment',
                    'Biotechnology',
                ],
            },
            {
                name: 'Biology (Zoology)',
                sort_order: 4,
                weightage: 25,
                topics: [
                    'Animal Diversity',
                    'Structural Organisation in Animals',
                    'Human Physiology',
                    'Reproductive Health',
                    'Human Health & Disease',
                    'Microbes in Human Welfare',
                ],
            },
        ],
    },
];


// ═══════════════════════════════════════════════════
// Seed Execution
// ═══════════════════════════════════════════════════

const seedExams = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🚀 Starting exam seed...\n');

        // 1. Insert categories
        const categoryIdMap = {};
        for (const cat of categories) {
            const res = await client.query(
                `INSERT INTO exam_categories (name, slug, description, country, icon, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (slug) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    description = EXCLUDED.description,
                    icon = EXCLUDED.icon,
                    sort_order = EXCLUDED.sort_order
                 RETURNING id`,
                [cat.name, cat.slug, cat.description, cat.country, cat.icon, cat.sort_order]
            );
            categoryIdMap[cat.slug] = res.rows[0].id;
            console.log(`  ✓ Category: ${cat.name}`);
        }
        console.log('');

        // 2. Insert exams with subjects and topics
        for (const exam of exams) {
            const categoryId = categoryIdMap[exam.category_slug];

            const examRes = await client.query(
                `INSERT INTO exams (category_id, name, slug, full_name, description, primary_color, accent_color, config, available_tools)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    full_name = EXCLUDED.full_name,
                    description = EXCLUDED.description,
                    primary_color = EXCLUDED.primary_color,
                    accent_color = EXCLUDED.accent_color,
                    config = EXCLUDED.config,
                    available_tools = EXCLUDED.available_tools,
                    updated_at = NOW()
                 RETURNING id`,
                [
                    categoryId, exam.name, exam.slug, exam.full_name, exam.description,
                    exam.primary_color, exam.accent_color,
                    JSON.stringify(exam.config),
                    JSON.stringify(exam.available_tools),
                ]
            );
            const examId = examRes.rows[0].id;
            console.log(`  📝 Exam: ${exam.name} (id: ${examId})`);

            // Delete existing subjects for this exam (to allow re-seeding)
            await client.query('DELETE FROM exam_subjects WHERE exam_id = $1', [examId]);

            // Insert subjects and topics
            for (const subject of exam.subjects) {
                const subRes = await client.query(
                    `INSERT INTO exam_subjects (exam_id, name, slug, sort_order, weightage)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [
                        examId,
                        subject.name,
                        subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                        subject.sort_order,
                        subject.weightage || null,
                    ]
                );
                const subjectId = subRes.rows[0].id;

                for (let i = 0; i < subject.topics.length; i++) {
                    await client.query(
                        `INSERT INTO exam_topics (subject_id, name, slug, sort_order, estimated_hours)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [
                            subjectId,
                            subject.topics[i],
                            subject.topics[i].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                            i + 1,
                            12, // default 12 hours per topic
                        ]
                    );
                }
                console.log(`     └─ ${subject.name} (${subject.topics.length} topics)`);
            }
            console.log('');
        }

        // 3. Set existing users to have the GATE EE exam as active (data migration)
        const gateEeRes = await client.query("SELECT id FROM exams WHERE slug = 'gate-ee'");
        if (gateEeRes.rows.length > 0) {
            const gateEeId = gateEeRes.rows[0].id;

            // Set GATE EE as active exam for all existing users who don't have one set
            const updateRes = await client.query(
                `UPDATE users SET active_exam_id = $1, onboarding_completed = TRUE 
                 WHERE active_exam_id IS NULL`,
                [gateEeId]
            );
            console.log(`  🔗 Linked ${updateRes.rowCount} existing users to GATE EE`);

            // Create enrollments for existing users
            await client.query(
                `INSERT INTO user_enrollments (user_id, exam_id)
                 SELECT id, $1 FROM users
                 ON CONFLICT (user_id, exam_id) DO NOTHING`,
                [gateEeId]
            );
            console.log('  🔗 Created enrollments for existing users');

            // Link existing tools to GATE EE
            const toolUpdateRes = await client.query(
                `UPDATE tools SET exam_id = $1 WHERE exam_id IS NULL`,
                [gateEeId]
            );
            console.log(`  🔗 Linked ${toolUpdateRes.rowCount} existing tools to GATE EE`);
        }

        await client.query('COMMIT');
        console.log('\n✅ Exam seeding completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
};

seedExams();
