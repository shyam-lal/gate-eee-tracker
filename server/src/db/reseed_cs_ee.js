#!/usr/bin/env node
/**
 * Re-seed specific exams from bulk_exams.json
 * 
 * This script finds GATE CS and GATE EE in the bulk JSON,
 * clears their existing syllabus, and re-imports with proper
 * estimated_hours and difficulty data.
 * 
 * Usage: node reseed_cs_ee.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { importFullExam } = require('../services/syllabusImportService');

const TARGET_SLUGS = ['gate-cs', 'gate-ee'];

async function main() {
    const filePath = path.join(__dirname, 'templates/bulk_exams.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const examsList = data.exams || [];

    console.log('\n🎯 Re-seeding GATE CS & GATE EE with proper difficulty + estimated_hours');
    console.log('─'.repeat(60));

    let processed = 0;

    for (const examData of examsList) {
        if (!examData.exam || !examData.exam.name) continue;

        // Generate slug same way as importFullExam
        const slug = examData.exam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (!TARGET_SLUGS.includes(slug)) continue;

        console.log(`\n📥 Processing: ${examData.exam.name} (slug: ${slug})`);
        console.log(`   Subjects: ${examData.subjects.length}`);
        const topicCount = examData.subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0);
        console.log(`   Topics: ${topicCount}`);

        try {
            // categoryId=1 is 'Engineering Entrance'
            const result = await importFullExam(examData, 1);
            console.log(`   ✅ Subjects created: ${result.subjectsCreated}`);
            console.log(`   ✅ Topics created: ${result.topicsCreated}`);
            if (result.errors.length > 0) {
                console.log(`   ⚠️  Errors: ${result.errors.join(', ')}`);
            }
            processed++;
        } catch (err) {
            console.error(`   ❌ Failed: ${err.message}`);
        }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`✅ Done! Re-seeded ${processed} exam(s).`);
    console.log('   User progress for these exams has been reset (CASCADE).\n');

    process.exit(0);
}

main();
