/**
 * RAG Context Builder
 * 
 * Assembles study material context for AI prompt generation.
 * Used by flashcard generation, revision test generation, and future AI features.
 * 
 * This is the foundation layer for RAG — currently uses direct DB queries.
 * Future: replace with vector similarity search via pgvector or external vector DB.
 */

const pool = require('../config/db');

const ragService = {
    /**
     * Get relevant study material content for given topics/subjects.
     * Returns concatenated context string suitable for AI prompts.
     * 
     * @param {number} examId - The exam ID
     * @param {Object} options
     * @param {number[]} options.topicIds - Specific topic IDs to get materials for
     * @param {number[]} options.subjectIds - Subject IDs to get materials for
     * @param {string[]} options.contentTypes - Filter by content types (notes, formula_sheet, etc.)
     * @param {number} options.maxTokens - Approximate max tokens for context (rough estimate: 4 chars ≈ 1 token)
     * @returns {{ context: string, sources: Array, tokenEstimate: number }}
     */
    getContext: async (examId, options = {}) => {
        const { topicIds = [], subjectIds = [], contentTypes = [], maxTokens = 4000 } = options;
        const maxChars = maxTokens * 4; // rough approximation

        let query = `
            SELECT sm.id, sm.title, sm.content_type, sm.content,
                   es.name as subject_name, et.name as topic_name
            FROM study_materials sm
            LEFT JOIN exam_subjects es ON es.id = sm.subject_id
            LEFT JOIN exam_topics et ON et.id = sm.topic_id
            WHERE sm.exam_id = $1 AND sm.is_published = TRUE AND sm.content IS NOT NULL
        `;
        const params = [examId];
        let idx = 2;

        // Filter by topics
        if (topicIds.length > 0) {
            query += ` AND sm.topic_id = ANY($${idx++})`;
            params.push(topicIds);
        }

        // Filter by subjects
        if (subjectIds.length > 0) {
            query += ` AND sm.subject_id = ANY($${idx++})`;
            params.push(subjectIds);
        }

        // Filter by content types
        if (contentTypes.length > 0) {
            query += ` AND sm.content_type = ANY($${idx++})`;
            params.push(contentTypes);
        }

        // Prioritize notes and formula sheets (more useful for AI)
        query += ` ORDER BY 
            CASE sm.content_type 
                WHEN 'formula_sheet' THEN 1
                WHEN 'notes' THEN 2
                ELSE 3
            END,
            sm.sort_order ASC`;

        const result = await pool.query(query, params);

        // Build context string with source tracking
        let context = '';
        const sources = [];
        let totalChars = 0;

        for (const row of result.rows) {
            if (!row.content) continue;

            const section = `\n--- ${row.subject_name || 'General'}: ${row.topic_name || row.title} (${row.content_type}) ---\n${row.content}\n`;

            if (totalChars + section.length > maxChars) {
                // Truncate if we'd exceed the limit
                const remaining = maxChars - totalChars;
                if (remaining > 100) {
                    context += section.substring(0, remaining) + '\n[truncated]';
                    sources.push({ id: row.id, title: row.title, type: row.content_type, truncated: true });
                }
                break;
            }

            context += section;
            totalChars += section.length;
            sources.push({ id: row.id, title: row.title, type: row.content_type, truncated: false });
        }

        return {
            context: context.trim(),
            sources,
            tokenEstimate: Math.ceil(totalChars / 4),
        };
    },

    /**
     * Get a formatted prompt context block for AI tools.
     * Wraps getContext with standard formatting.
     */
    getPromptContext: async (examId, topicNames, options = {}) => {
        // If topic names are given as strings, resolve them to IDs
        let topicIds = options.topicIds || [];

        if (topicNames && topicNames.length > 0 && topicIds.length === 0) {
            const topicResult = await pool.query(
                `SELECT et.id FROM exam_topics et
                 JOIN exam_subjects es ON es.id = et.subject_id
                 WHERE es.exam_id = $1 AND et.name = ANY($2)`,
                [examId, topicNames]
            );
            topicIds = topicResult.rows.map(r => r.id);
        }

        const { context, sources, tokenEstimate } = await ragService.getContext(examId, {
            ...options,
            topicIds,
        });

        if (!context) {
            return { hasContext: false, promptBlock: '', sources: [], tokenEstimate: 0 };
        }

        const promptBlock = `
[STUDY MATERIAL CONTEXT]
The following study materials are from the exam's official curriculum. Use them to generate more accurate, curriculum-aligned content:

${context}

[END STUDY MATERIAL CONTEXT]
`.trim();

        return { hasContext: true, promptBlock, sources, tokenEstimate };
    },
};

module.exports = ragService;
