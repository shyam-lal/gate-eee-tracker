#!/usr/bin/env node
/**
 * Seed Exam from JSON File
 * 
 * Usage:
 *   node seed_from_json.js <path-to-json> [--category-id <id>] [--exam-id <id>]
 * 
 * Examples:
 *   # Create a new exam + syllabus (requires --category-id):
 *   node seed_from_json.js ./templates/gate_ee.json --category-id 1
 * 
 *   # Import syllabus into an existing exam (requires --exam-id):
 *   node seed_from_json.js ./templates/gate_ee.json --exam-id 5
 * 
 *   # Import and replace existing syllabus:
 *   node seed_from_json.js ./templates/gate_ee.json --exam-id 5 --clear
 * 
 * JSON Format:
 *   See templates/syllabus_template.json for the expected structure.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { importSyllabus, importFullExam } = require('../services/syllabusImportService');

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  Seed Exam from JSON                                         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Usage:                                                       ║
║    node seed_from_json.js <json-file> [options]               ║
║                                                               ║
║  Options:                                                     ║
║    --category-id <id>  Category ID for new exam creation      ║
║    --exam-id <id>      Import syllabus into existing exam     ║
║    --clear             Clear existing syllabus before import  ║
║    --help              Show this help message                 ║
║                                                               ║
║  Examples:                                                    ║
║    node seed_from_json.js ./templates/gate_ee.json --category-id 1  ║
║    node seed_from_json.js ./templates/gate_ee.json --exam-id 5      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
        `);
        process.exit(0);
    }

    // Parse arguments
    const jsonFile = args[0];
    let categoryId = null;
    let examId = null;
    let clearExisting = false;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--category-id' && args[i + 1]) {
            categoryId = parseInt(args[++i], 10);
        } else if (args[i] === '--exam-id' && args[i + 1]) {
            examId = parseInt(args[++i], 10);
        } else if (args[i] === '--clear') {
            clearExisting = true;
        }
    }

    // Read and parse JSON file
    const filePath = path.resolve(jsonFile);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    let data;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(raw);
    } catch (err) {
        console.error(`❌ Failed to parse JSON: ${err.message}`);
        process.exit(1);
    }

    console.log('\n🚀 Syllabus Import');
    console.log('─'.repeat(50));
    console.log(`  File: ${filePath}`);
    console.log('─'.repeat(50));

    try {
        let result;

        // Detect if bulk or single
        const isBulk = Array.isArray(data) || Array.isArray(data.exams);
        const examsList = Array.isArray(data) ? data : (Array.isArray(data.exams) ? data.exams : [data]);

        let totalSubjects = 0;
        let totalTopics = 0;
        const totalErrors = [];

        console.log(`\n📥 Found ${examsList.length} exam(s) to import.`);

        for (const examData of examsList) {
            if (examId) {
                // Import into existing exam
                console.log(`\n📥 Importing syllabus into exam ID ${examId}...`);
                if (clearExisting) console.log('  ⚠️  Clearing existing syllabus first');
                result = await importSyllabus(examId, examData, { clearExisting });
                totalSubjects += result.subjectsCreated;
                totalTopics += result.topicsCreated;
                totalErrors.push(...result.errors.map(e => `[Exam ID ${examId}]: ${e}`));
            } else if (categoryId) {
                // Create new exam + syllabus
                if (!examData.exam) {
                    console.error('❌ JSON must have an "exam" object when creating a new exam. Skipping...');
                    totalErrors.push('Missing "exam" object');
                    continue;
                }
                console.log(`\n📥 Creating exam "${examData.exam.name}" in category ${categoryId}...`);
                result = await importFullExam(examData, categoryId);
                totalSubjects += result.subjectsCreated;
                totalTopics += result.topicsCreated;
                totalErrors.push(...result.errors.map(e => `[${examData.exam.name}]: ${e}`));
            } else {
                console.error('❌ You must provide either --exam-id or --category-id');
                process.exit(1);
            }
        }

        // Report
        console.log('\n✅ Import Complete!');
        console.log('─'.repeat(50));
        console.log(`  Exams processed:  ${examsList.length}`);
        console.log(`  Subjects created: ${totalSubjects}`);
        console.log(`  Topics created:   ${totalTopics}`);

        if (totalErrors.length > 0) {
            console.log(`\n⚠️  ${totalErrors.length} warning(s/error(s)):`);
            totalErrors.forEach(e => console.log(`    - ${e}`));
        }

        console.log('');
    } catch (err) {
        console.error(`\n❌ Import failed: ${err.message}`);
        process.exit(1);
    }

    process.exit(0);
}

main();
