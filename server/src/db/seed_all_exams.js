#!/usr/bin/env node
/**
 * Seed all exams from bulk_exams.json
 * 
 * Usage: node seed_all_exams.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { importFullExam } = require('../services/syllabusImportService');

async function main() {
    const filePath = path.join(__dirname, 'templates/bulk_exams.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const examsList = data.exams || [];

    console.log('\n🎯 Seeding ALL exams from bulk_exams.json');
    console.log('─'.repeat(60));

    let processed = 0;

    // Map string categories from JSON to DB category IDs (created in seed_exams.js)
    const categoryMap = {
        'Engineering Entrance': 1,
        'Civil Services': 2,
        'Banking & Finance': 3,
        'Medical': 4,
        'Custom': 5
    };

    for (const examData of examsList) {
        if (!examData.exam || !examData.exam.name) continue;

        const slug = examData.exam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        const catName = examData.exam.category || 'Engineering Entrance';
        const catId = categoryMap[catName] || 1;

        console.log(`\n📥 Processing: ${examData.exam.name} (slug: ${slug}, Category ID: ${catId})`);
        
        try {
            const result = await importFullExam(examData, catId);
            console.log(`   ✅ Subjects created: ${result.subjectsCreated}`);
            console.log(`   ✅ Topics created: ${result.topicsCreated}`);
            if (result.errors && result.errors.length > 0) {
                console.log(`   ⚠️  Errors: ${result.errors.join(', ')}`);
            }
            processed++;
        } catch (err) {
            console.error(`   ❌ Failed: ${err.message}`);
        }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`✅ Done! Seeded ${processed} exam(s) completely.`);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
