/**
 * Syllabus Import Service
 * 
 * Reusable logic for bulk-importing exam syllabus from JSON.
 * Used by both the Admin API endpoint and the CLI seed script.
 */

const pool = require('../config/db');
const examService = require('../services/examService');

/**
 * Import a full syllabus (subjects + topics) for an exam from JSON.
 * 
 * Expected JSON format:
 * {
 *   "subjects": [
 *     {
 *       "name": "Electric Circuits",
 *       "weightage": 10,
 *       "topics": [
 *         { "name": "KCL and KVL", "estimated_hours": 8, "difficulty": "easy" },
 *         ...
 *       ]
 *     }
 *   ]
 * }
 * 
 * @param {number} examId - The exam to import syllabus into
 * @param {Object} data - The parsed JSON object with a "subjects" array
 * @param {Object} options
 * @param {boolean} options.clearExisting - If true, delete existing syllabus first (default: false)
 * @returns {{ subjectsCreated: number, topicsCreated: number, errors: string[] }}
 */
const importSyllabus = async (examId, data, options = {}) => {
    const { clearExisting = false } = options;
    const errors = [];
    let subjectsCreated = 0;
    let topicsCreated = 0;

    // Validate
    if (!data || !Array.isArray(data.subjects)) {
        throw new Error('Invalid format: JSON must have a "subjects" array at the top level.');
    }

    // Verify exam exists
    const exam = await examService.getExamById(examId);
    if (!exam) {
        throw new Error(`Exam with ID ${examId} not found.`);
    }

    // Optionally clear existing syllabus
    if (clearExisting) {
        // Topics are CASCADE-deleted when subjects are deleted
        await pool.query('DELETE FROM exam_subjects WHERE exam_id = $1', [examId]);
    }

    // Import each subject
    for (let si = 0; si < data.subjects.length; si++) {
        const subjectData = data.subjects[si];

        if (!subjectData.name) {
            errors.push(`Subject at index ${si}: missing "name" field, skipped.`);
            continue;
        }

        try {
            const subject = await examService.createSubject(examId, {
                name: subjectData.name.trim(),
                sort_order: si + 1,
                weightage: subjectData.weightage || null,
                metadata: subjectData.metadata || {},
            });
            subjectsCreated++;

            // Import topics for this subject
            if (Array.isArray(subjectData.topics)) {
                for (let ti = 0; ti < subjectData.topics.length; ti++) {
                    const topicData = subjectData.topics[ti];

                    if (!topicData.name) {
                        errors.push(`Subject "${subjectData.name}", topic at index ${ti}: missing "name", skipped.`);
                        continue;
                    }

                    try {
                        await examService.createTopic(subject.id, {
                            name: topicData.name.trim(),
                            sort_order: ti + 1,
                            estimated_hours: topicData.estimated_hours || 12,
                            difficulty: topicData.difficulty || 'medium',
                            metadata: topicData.metadata || {},
                        });
                        topicsCreated++;
                    } catch (topicErr) {
                        errors.push(`Subject "${subjectData.name}", topic "${topicData.name}": ${topicErr.message}`);
                    }
                }
            }
        } catch (subErr) {
            errors.push(`Subject "${subjectData.name}": ${subErr.message}`);
        }
    }

    return { subjectsCreated, topicsCreated, errors };
};

/**
 * Import a full exam definition (exam metadata + syllabus) from JSON.
 * Used by the CLI seed script with a complete JSON file.
 * 
 * @param {Object} data - Full JSON with "exam" and "subjects" keys
 * @param {number} categoryId - Category to assign the exam to
 * @returns {{ exam: Object, subjectsCreated: number, topicsCreated: number, errors: string[] }}
 */
const importFullExam = async (data, categoryId) => {
    if (!data.exam || !data.exam.name) {
        throw new Error('Invalid format: JSON must have an "exam" object with at least a "name" field.');
    }

    // Create or find the exam
    const slug = data.exam.slug || data.exam.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let exam = await examService.getExamBySlug(slug);
    if (exam) {
        console.log(`  Exam "${data.exam.name}" already exists (id=${exam.id}), updating syllabus...`);
    } else {
        exam = await examService.createExam({
            category_id: categoryId,
            name: data.exam.name,
            slug,
            full_name: data.exam.full_name || data.exam.name,
            description: data.exam.description || '',
            primary_color: data.exam.primary_color || '#6366f1',
            accent_color: data.exam.accent_color || '#818cf8',
            config: data.exam.config || {},
            available_tools: data.exam.available_tools || ['tracker', 'flashcard', 'revision', 'planner', 'focus', 'analytics'],
        });
        console.log(`  Created exam "${exam.name}" (id=${exam.id})`);
    }

    // Import syllabus
    const result = await importSyllabus(exam.id, data, { clearExisting: true });

    return { exam, ...result };
};

module.exports = { importSyllabus, importFullExam };
