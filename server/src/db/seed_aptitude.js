const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// ═══════════════════════════════════════════════════
// 3 Units
// ═══════════════════════════════════════════════════
const units = [
    {
        name: 'Quantitative Aptitude',
        slug: 'quant',
        description: 'Master numbers, ratios, percentages, and data — the backbone of every competitive exam.',
        icon: 'calculator',
        color: '#6366f1',
        estimated_hours: 51,
        sort_order: 1,
    },
    {
        name: 'Reasoning',
        slug: 'reasoning',
        description: 'Decode patterns, structures, and logical frameworks — think in systems.',
        icon: 'brain',
        color: '#10b981',
        estimated_hours: 29,
        sort_order: 2,
    },
    {
        name: 'Verbal Aptitude',
        slug: 'verbal',
        description: 'Command language, context, and comprehension — precision in every word.',
        icon: 'book-open',
        color: '#f59e0b',
        estimated_hours: 45,
        sort_order: 3,
    },
];

// ═══════════════════════════════════════════════════
// 54 Nodes (Topics) — hex_row/hex_col for grid layout
// ═══════════════════════════════════════════════════

const nodes = {
    quant: [
        // Row 0 — Foundations
        { name: 'Number Systems', slug: 'number-systems', description: 'Divisibility, remainders, HCF/LCM, and prime factorization.', difficulty: 'easy', estimated_minutes: 180, hex_row: 0, hex_col: 0, prerequisites: [], interaction_type: 'relativity_engine', sort_order: 1 },
        { name: 'Surds & Indices', slug: 'surds-indices', description: 'Simplify radicals and exponent rules for fast computation.', difficulty: 'easy', estimated_minutes: 120, hex_row: 0, hex_col: 1, prerequisites: ['number-systems'], interaction_type: 'relativity_engine', sort_order: 2 },
        { name: 'Logarithms', slug: 'logarithms', description: 'Log rules, change of base, and computation shortcuts.', difficulty: 'medium', estimated_minutes: 150, hex_row: 0, hex_col: 2, prerequisites: ['surds-indices'], interaction_type: 'relativity_engine', sort_order: 3 },

        // Row 1 — Arithmetic Core
        { name: 'Averages', slug: 'averages', description: 'Weighted averages and the deviation method.', difficulty: 'easy', estimated_minutes: 120, hex_row: 1, hex_col: 0, prerequisites: ['number-systems'], interaction_type: 'relativity_engine', sort_order: 4 },
        { name: 'Percentages', slug: 'percentages', description: 'Percentage change, successive percentages, and mental math.', difficulty: 'easy', estimated_minutes: 150, hex_row: 1, hex_col: 1, prerequisites: ['averages'], interaction_type: 'relativity_engine', sort_order: 5 },
        { name: 'Ratio & Proportion', slug: 'ratio-proportion', description: 'Ratios, proportional reasoning, and the unitary method.', difficulty: 'easy', estimated_minutes: 150, hex_row: 1, hex_col: 2, prerequisites: ['percentages'], interaction_type: 'relativity_engine', sort_order: 6 },

        // Row 2 — Applied Arithmetic
        { name: 'Profit & Loss', slug: 'profit-loss', description: 'Cost price, selling price, markup, discount chains.', difficulty: 'medium', estimated_minutes: 180, hex_row: 2, hex_col: 0, prerequisites: ['percentages'], interaction_type: 'relativity_engine', sort_order: 7 },
        { name: 'Simple Interest', slug: 'simple-interest', description: 'PRT formula and time-value of money basics.', difficulty: 'easy', estimated_minutes: 120, hex_row: 2, hex_col: 1, prerequisites: ['percentages'], interaction_type: 'relativity_engine', sort_order: 8 },
        { name: 'Compound Interest', slug: 'compound-interest', description: 'Compounding periods, effective rate, and population growth.', difficulty: 'medium', estimated_minutes: 150, hex_row: 2, hex_col: 2, prerequisites: ['simple-interest'], interaction_type: 'relativity_engine', sort_order: 9 },

        // Row 3 — Mixtures & Partners
        { name: 'Partnership', slug: 'partnership', description: 'Profit-sharing by capital and time ratios.', difficulty: 'medium', estimated_minutes: 120, hex_row: 3, hex_col: 0, prerequisites: ['ratio-proportion'], interaction_type: 'relativity_engine', sort_order: 10 },
        { name: 'Mixtures & Alligation', slug: 'mixtures-alligation', description: 'The weighted balance — visual alligation for concentration problems.', difficulty: 'medium', estimated_minutes: 180, hex_row: 3, hex_col: 1, prerequisites: ['ratio-proportion', 'averages'], interaction_type: 'relativity_engine', sort_order: 11 },
        { name: 'Ages', slug: 'ages', description: 'Age-ratio problems and equation setup strategies.', difficulty: 'easy', estimated_minutes: 120, hex_row: 3, hex_col: 2, prerequisites: ['ratio-proportion'], interaction_type: 'relativity_engine', sort_order: 12 },

        // Row 4 — Time-based
        { name: 'Time & Work', slug: 'time-work', description: 'Efficiency, pipes & cisterns, and work equivalence.', difficulty: 'medium', estimated_minutes: 180, hex_row: 4, hex_col: 0, prerequisites: ['ratio-proportion'], interaction_type: 'relativity_engine', sort_order: 13 },
        { name: 'Time, Speed & Distance', slug: 'time-speed-distance', description: 'Relative speed, trains, boats & streams.', difficulty: 'medium', estimated_minutes: 200, hex_row: 4, hex_col: 1, prerequisites: ['ratio-proportion'], interaction_type: 'relativity_engine', sort_order: 14 },

        // Row 5 — Advanced Quant
        { name: 'Progressions', slug: 'progressions', description: 'AP, GP, HP — sum formulas and pattern recognition.', difficulty: 'medium', estimated_minutes: 150, hex_row: 5, hex_col: 0, prerequisites: ['number-systems'], interaction_type: 'relativity_engine', sort_order: 15 },
        { name: 'P & C', slug: 'permutations-combinations', description: 'Counting principles, arrangements, and selections.', difficulty: 'hard', estimated_minutes: 200, hex_row: 5, hex_col: 1, prerequisites: ['number-systems'], interaction_type: 'relativity_engine', sort_order: 16 },
        { name: 'Probability', slug: 'probability', description: 'Classical, conditional, and Bayes theorem basics.', difficulty: 'hard', estimated_minutes: 200, hex_row: 5, hex_col: 2, prerequisites: ['permutations-combinations'], interaction_type: 'relativity_engine', sort_order: 17 },

        // Row 6 — Data & Geometry
        { name: 'Data Interpretation — Tables', slug: 'di-tables', description: 'Extract, compare, and calculate from tabular data.', difficulty: 'medium', estimated_minutes: 150, hex_row: 6, hex_col: 0, prerequisites: ['percentages'], interaction_type: 'relativity_engine', sort_order: 18 },
        { name: 'Data Interpretation — Charts', slug: 'di-charts', description: 'Bar, pie, and line chart analysis techniques.', difficulty: 'medium', estimated_minutes: 150, hex_row: 6, hex_col: 1, prerequisites: ['di-tables'], interaction_type: 'relativity_engine', sort_order: 19 },
        { name: 'Mensuration', slug: 'mensuration', description: 'Areas, volumes, and surface areas of standard shapes.', difficulty: 'medium', estimated_minutes: 180, hex_row: 6, hex_col: 2, prerequisites: ['number-systems'], interaction_type: 'relativity_engine', sort_order: 20 },
    ],

    reasoning: [
        // Row 0 — Pattern Foundation
        { name: 'Series Completion', slug: 'series-completion', description: 'Number, letter, and figure series — find the rule.', difficulty: 'easy', estimated_minutes: 120, hex_row: 0, hex_col: 0, prerequisites: [], interaction_type: 'structure_lab', sort_order: 1 },
        { name: 'Analogy', slug: 'analogy', description: 'A is to B as C is to ? — relational reasoning.', difficulty: 'easy', estimated_minutes: 100, hex_row: 0, hex_col: 1, prerequisites: [], interaction_type: 'structure_lab', sort_order: 2 },
        { name: 'Odd One Out', slug: 'odd-one-out', description: 'Classification — find the element that doesn\'t belong.', difficulty: 'easy', estimated_minutes: 100, hex_row: 0, hex_col: 2, prerequisites: [], interaction_type: 'structure_lab', sort_order: 3 },

        // Row 1 — Coding & Relations
        { name: 'Coding-Decoding', slug: 'coding-decoding', description: 'Letter shifts, number codes, and symbolic substitution.', difficulty: 'easy', estimated_minutes: 120, hex_row: 1, hex_col: 0, prerequisites: ['series-completion'], interaction_type: 'structure_lab', sort_order: 4 },
        { name: 'Blood Relations', slug: 'blood-relations', description: 'Family tree logic and generational reasoning.', difficulty: 'medium', estimated_minutes: 150, hex_row: 1, hex_col: 1, prerequisites: [], interaction_type: 'structure_lab', sort_order: 5 },
        { name: 'Directions & Distance', slug: 'directions-distance', description: 'Cardinal turns, displacement, and shortest path.', difficulty: 'easy', estimated_minutes: 120, hex_row: 1, hex_col: 2, prerequisites: [], interaction_type: 'structure_lab', sort_order: 6 },

        // Row 2 — Logic Core
        { name: 'Inequalities', slug: 'inequalities', description: 'Coded inequality chains and definite conclusions.', difficulty: 'medium', estimated_minutes: 120, hex_row: 2, hex_col: 0, prerequisites: ['coding-decoding'], interaction_type: 'structure_lab', sort_order: 7 },
        { name: 'Syllogism', slug: 'syllogism', description: 'The Set Overlapper — Venn-based logical conclusions.', difficulty: 'medium', estimated_minutes: 150, hex_row: 2, hex_col: 1, prerequisites: [], interaction_type: 'structure_lab', sort_order: 8 },
        { name: 'Venn Diagrams', slug: 'venn-diagrams', description: 'Set relationships and region-based reasoning.', difficulty: 'medium', estimated_minutes: 120, hex_row: 2, hex_col: 2, prerequisites: ['syllogism'], interaction_type: 'structure_lab', sort_order: 9 },

        // Row 3 — Arrangement
        { name: 'Seating Arrangement — Linear', slug: 'seating-linear', description: 'The Constraint Anchor — pin data, eliminate positions.', difficulty: 'medium', estimated_minutes: 180, hex_row: 3, hex_col: 0, prerequisites: ['inequalities'], interaction_type: 'structure_lab', sort_order: 10 },
        { name: 'Seating Arrangement — Circular', slug: 'seating-circular', description: 'Circular table constraints and relative positioning.', difficulty: 'hard', estimated_minutes: 180, hex_row: 3, hex_col: 1, prerequisites: ['seating-linear'], interaction_type: 'structure_lab', sort_order: 11 },
        { name: 'Missing Characters', slug: 'missing-characters', description: 'Matrix and grid pattern completion.', difficulty: 'medium', estimated_minutes: 100, hex_row: 3, hex_col: 2, prerequisites: ['series-completion'], interaction_type: 'structure_lab', sort_order: 12 },

        // Row 4 — Spatial
        { name: 'Cube & Dice', slug: 'cube-dice', description: 'Net folding, opposite faces, and 3D reasoning.', difficulty: 'medium', estimated_minutes: 150, hex_row: 4, hex_col: 0, prerequisites: ['directions-distance'], interaction_type: 'structure_lab', sort_order: 13 },
        { name: 'Calendar', slug: 'calendar', description: 'Day-of-week calculations and leap year logic.', difficulty: 'easy', estimated_minutes: 100, hex_row: 4, hex_col: 1, prerequisites: [], interaction_type: 'structure_lab', sort_order: 14 },
        { name: 'Clocks', slug: 'clocks', description: 'Angle between hands, gain/loss, and meeting problems.', difficulty: 'medium', estimated_minutes: 120, hex_row: 4, hex_col: 2, prerequisites: ['calendar'], interaction_type: 'structure_lab', sort_order: 15 },

        // Row 5 — Advanced
        { name: 'Spatial Aptitude', slug: 'spatial-aptitude', description: 'Mirror images, water images, and embedded figures.', difficulty: 'medium', estimated_minutes: 150, hex_row: 5, hex_col: 0, prerequisites: ['cube-dice'], interaction_type: 'structure_lab', sort_order: 16 },
        { name: 'Input-Output', slug: 'input-output', description: 'Machine logic — trace step-by-step transformations.', difficulty: 'hard', estimated_minutes: 150, hex_row: 5, hex_col: 1, prerequisites: ['series-completion', 'coding-decoding'], interaction_type: 'structure_lab', sort_order: 17 },
        { name: 'Data Sufficiency', slug: 'data-sufficiency', description: 'Is the information enough? Statement analysis mastery.', difficulty: 'hard', estimated_minutes: 150, hex_row: 5, hex_col: 2, prerequisites: ['inequalities', 'syllogism'], interaction_type: 'structure_lab', sort_order: 18 },
    ],

    verbal: [
        // Row 0 — Grammar Foundation
        { name: 'Articles & Determiners', slug: 'articles-determiners', description: 'A, an, the — and the subtle rules behind them.', difficulty: 'easy', estimated_minutes: 120, hex_row: 0, hex_col: 0, prerequisites: [], interaction_type: 'context_weaver', sort_order: 1 },
        { name: 'Nouns & Pronouns', slug: 'nouns-pronouns', description: 'Number, gender, case, and pronoun-antecedent agreement.', difficulty: 'easy', estimated_minutes: 150, hex_row: 0, hex_col: 1, prerequisites: ['articles-determiners'], interaction_type: 'context_weaver', sort_order: 2 },
        { name: 'Verbs & Tenses', slug: 'verbs-tenses', description: 'Tense consistency, subject-verb agreement, and voice.', difficulty: 'medium', estimated_minutes: 180, hex_row: 0, hex_col: 2, prerequisites: ['nouns-pronouns'], interaction_type: 'context_weaver', sort_order: 3 },

        // Row 1 — Parts of Speech
        { name: 'Adverbs & Adjectives', slug: 'adverbs-adjectives', description: 'Modifiers, degrees of comparison, and placement rules.', difficulty: 'easy', estimated_minutes: 120, hex_row: 1, hex_col: 0, prerequisites: ['verbs-tenses'], interaction_type: 'context_weaver', sort_order: 4 },
        { name: 'Prepositions', slug: 'prepositions', description: 'Spatial, temporal, and idiomatic preposition usage.', difficulty: 'easy', estimated_minutes: 120, hex_row: 1, hex_col: 1, prerequisites: ['articles-determiners'], interaction_type: 'context_weaver', sort_order: 5 },
        { name: 'Conjunctions', slug: 'conjunctions', description: 'Coordinating, subordinating, and correlative connectors.', difficulty: 'easy', estimated_minutes: 100, hex_row: 1, hex_col: 2, prerequisites: ['prepositions'], interaction_type: 'context_weaver', sort_order: 6 },

        // Row 2 — Vocabulary & Usage
        { name: 'Vocabulary Building', slug: 'vocabulary', description: 'High-frequency words, roots, prefixes, and suffixes.', difficulty: 'medium', estimated_minutes: 200, hex_row: 2, hex_col: 0, prerequisites: [], interaction_type: 'context_weaver', sort_order: 7 },
        { name: 'Synonyms & Antonyms', slug: 'synonyms-antonyms', description: 'Word relationships and contextual meaning shifts.', difficulty: 'medium', estimated_minutes: 150, hex_row: 2, hex_col: 1, prerequisites: ['vocabulary'], interaction_type: 'context_weaver', sort_order: 8 },
        { name: 'Idioms & Phrases', slug: 'idioms-phrases', description: 'Common idioms, phrasal verbs, and figurative language.', difficulty: 'medium', estimated_minutes: 150, hex_row: 2, hex_col: 2, prerequisites: ['vocabulary'], interaction_type: 'context_weaver', sort_order: 9 },

        // Row 3 — Sentence Level
        { name: 'Sentence Completion', slug: 'sentence-completion', description: 'Fill blanks using context clues and grammar.', difficulty: 'medium', estimated_minutes: 150, hex_row: 3, hex_col: 0, prerequisites: ['conjunctions', 'vocabulary'], interaction_type: 'context_weaver', sort_order: 10 },
        { name: 'Error Detection', slug: 'error-detection', description: 'Spot grammatical, usage, and structural errors.', difficulty: 'medium', estimated_minutes: 150, hex_row: 3, hex_col: 1, prerequisites: ['verbs-tenses', 'prepositions'], interaction_type: 'context_weaver', sort_order: 11 },
        { name: 'Sentence Improvement', slug: 'sentence-improvement', description: 'Replace underlined parts with better alternatives.', difficulty: 'medium', estimated_minutes: 120, hex_row: 3, hex_col: 2, prerequisites: ['error-detection'], interaction_type: 'context_weaver', sort_order: 12 },

        // Row 4 — Paragraph Level
        { name: 'Narrative Sequencing', slug: 'narrative-sequencing', description: 'The Logic Magnet — snap sentences in logical order.', difficulty: 'hard', estimated_minutes: 180, hex_row: 4, hex_col: 0, prerequisites: ['conjunctions', 'sentence-completion'], interaction_type: 'context_weaver', sort_order: 13 },
        { name: 'Para Jumbles', slug: 'para-jumbles', description: 'Reorder shuffled sentences into coherent paragraphs.', difficulty: 'hard', estimated_minutes: 180, hex_row: 4, hex_col: 1, prerequisites: ['narrative-sequencing'], interaction_type: 'context_weaver', sort_order: 14 },

        // Row 5 — Comprehension
        { name: 'Reading Comprehension', slug: 'reading-comprehension', description: 'Passage analysis, inference, tone, and main idea.', difficulty: 'hard', estimated_minutes: 250, hex_row: 5, hex_col: 0, prerequisites: ['vocabulary', 'sentence-completion'], interaction_type: 'context_weaver', sort_order: 15 },
        { name: 'Critical Reasoning', slug: 'critical-reasoning', description: 'Strengthen, weaken, and evaluate arguments in passages.', difficulty: 'hard', estimated_minutes: 200, hex_row: 5, hex_col: 1, prerequisites: ['reading-comprehension'], interaction_type: 'context_weaver', sort_order: 16 },
    ],
};

// ═══════════════════════════════════════════════════
// Seed Execution
// ═══════════════════════════════════════════════════
const seedAptitude = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🧠 Seeding Aptitude Skill Tree...\n');

        // Clear existing data
        await client.query('DELETE FROM user_aptitude_progress');
        await client.query('DELETE FROM aptitude_nodes');
        await client.query('DELETE FROM aptitude_units');
        console.log('  🗑️  Cleared existing aptitude data.\n');

        // 1. Insert units
        const unitIdMap = {};
        for (const unit of units) {
            const res = await client.query(
                `INSERT INTO aptitude_units (name, slug, description, icon, color, estimated_hours, sort_order)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [unit.name, unit.slug, unit.description, unit.icon, unit.color, unit.estimated_hours, unit.sort_order]
            );
            unitIdMap[unit.slug] = res.rows[0].id;
            console.log(`  ✓ Unit: ${unit.name} (id: ${res.rows[0].id})`);
        }
        console.log('');

        // 2. Insert nodes per unit
        let totalNodes = 0;
        for (const [unitSlug, unitNodes] of Object.entries(nodes)) {
            const unitId = unitIdMap[unitSlug];
            for (const node of unitNodes) {
                await client.query(
                    `INSERT INTO aptitude_nodes 
                     (unit_id, name, slug, description, estimated_minutes, difficulty, sort_order, hex_row, hex_col, prerequisites, interaction_type, interaction_config, metadata)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                    [
                        unitId, node.name, node.slug, node.description,
                        node.estimated_minutes, node.difficulty, node.sort_order,
                        node.hex_row, node.hex_col,
                        JSON.stringify(node.prerequisites),
                        node.interaction_type,
                        JSON.stringify({}),
                        JSON.stringify({})
                    ]
                );
                totalNodes++;
            }
            console.log(`  📦 ${unitSlug}: ${unitNodes.length} nodes seeded`);
        }

        await client.query('COMMIT');
        console.log(`\n🎉 Done! ${units.length} units, ${totalNodes} nodes seeded.`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
};

seedAptitude();
