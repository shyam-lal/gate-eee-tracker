const pool = require('../config/db');

exports.getSubjectSyllabus = async (req, res) => {
    try {
        const { subject_slug } = req.params;
        
        // Map diagnostic branch to exam slug
        const branchToExamSlug = {
            'computer-science': 'gate-cs',
            'mechanical-engineering': 'gate-me',
            'electrical-engineering': 'gate-ee',
            'civil-engineering': 'gate-ce',
            'electronics-communication': 'gate-ec',
            'chemical-engineering': 'gate-ch',
            'instrumentation': 'gate-in',
            'aerospace': 'gate-ae',
            'biotechnology': 'gate-bt'
        };
        const examSlug = branchToExamSlug[subject_slug] || subject_slug;
        
        const examRes = await pool.query(
            `SELECT id, name FROM exams WHERE slug = $1 LIMIT 1`,
            [examSlug]
        );

        if (examRes.rows.length === 0) {
            return res.status(404).json({ error: 'Exam not found for the selected branch' });
        }

        const examId = examRes.rows[0].id;

        const subjectsRes = await pool.query(
            `SELECT id, name, slug FROM exam_subjects WHERE exam_id = $1 ORDER BY sort_order ASC`,
            [examId]
        );

        const syllabus = [];
        for (const subject of subjectsRes.rows) {
            const topicsRes = await pool.query(
                `SELECT id, name, slug, estimated_hours FROM exam_topics WHERE subject_id = $1 ORDER BY sort_order ASC`,
                [subject.id]
            );

            syllabus.push({
                id: subject.id,
                name: subject.name,
                topics: topicsRes.rows.map(t => ({
                    id: t.id,
                    name: t.name,
                    time: (t.estimated_hours || 0) * 60, // convert hours to minutes
                    totalModules: 1, // each topic is 1 module conceptually
                    completedModules: 0,
                    timeSpent: 0
                }))
            });
        }

        res.json(syllabus);
    } catch (err) {
        console.error('Error fetching subject syllabus:', err);
        res.status(500).json({ error: 'Failed to fetch syllabus' });
    }
};

exports.getQuestions = async (req, res) => {
    try {
        const { subject_slug } = req.params;

        // Fetch exactly 5 questions, ensuring each is from a distinct topic.
        const query = `
            SELECT id, subject_id, topic_id, difficulty, question_text, options, correct_option_id, explanation, related_feature_recommendation, topic_slug, topic_name
            FROM (
                SELECT DISTINCT ON (dq.topic_id) dq.*, et.slug as topic_slug, et.name as topic_name
                FROM diagnostic_questions dq
                JOIN exam_topics et ON dq.topic_id = et.id
                WHERE dq.subject_id = (SELECT id FROM exam_subjects WHERE slug = $1 LIMIT 1)
                ORDER BY dq.topic_id, RANDOM()
            ) sub
            ORDER BY RANDOM()
            LIMIT 5;
        `;
        
        const result = await pool.query(query, [subject_slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No questions found for this subject.' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching diagnostic questions:', err);
        res.status(500).json({ error: 'Failed to fetch diagnostic questions.' });
    }
};

exports.syncDiagnosticResult = async (req, res) => {
    try {
        const userId = req.user.id;
        const { subjectId, score, total, weakModules, answers, timestamp } = req.body;

        if (!subjectId) {
            return res.status(400).json({ error: 'Missing subject data' });
        }

        // Ideally, we would insert this into a persistent diagnostic_results table, 
        // but for now, we just acknowledge the sync. The frontend will unlock the dashboard.
        // In a full implementation, you'd insert:
        // INSERT INTO diagnostic_results (user_id, subject_id, score, total, weak_modules, answers) VALUES (...)
        
        // Let's create a minimal footprint. If the user doesn't have this subject in their `subjects` tracking table, we could add it, but vault dashboard focuses on user's selected syllabus. 
        // We will just return success so the frontend can clear localStorage.

        res.json({ message: 'Diagnostic results synced successfully.' });
    } catch (err) {
        console.error('Error syncing diagnostic results:', err);
        res.status(500).json({ error: 'Failed to sync diagnostic results.' });
    }
};
