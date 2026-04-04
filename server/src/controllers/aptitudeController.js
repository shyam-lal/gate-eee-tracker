const db = require('../config/db');

// GET /api/aptitude — Get all units with their nodes
const getSkillTree = async (req, res) => {
    try {
        // Fetch all units
        const unitsResult = await db.query(
            'SELECT * FROM aptitude_units ORDER BY sort_order'
        );

        // Fetch all nodes
        const nodesResult = await db.query(
            'SELECT * FROM aptitude_nodes ORDER BY unit_id, sort_order'
        );

        // Group nodes under their units
        const tree = unitsResult.rows.map(unit => ({
            ...unit,
            nodes: nodesResult.rows.filter(n => n.unit_id === unit.id)
        }));

        res.json(tree);
    } catch (err) {
        console.error('getSkillTree error:', err.message);
        res.status(500).json({ error: 'Failed to fetch skill tree' });
    }
};

// GET /api/aptitude/progress — Get authenticated user's progress
const getUserProgress = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT uap.*, an.slug as node_slug, an.name as node_name
             FROM user_aptitude_progress uap
             JOIN aptitude_nodes an ON an.id = uap.node_id
             WHERE uap.user_id = $1
             ORDER BY uap.node_id`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('getUserProgress error:', err.message);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
};

// POST /api/aptitude/progress/:nodeId — Update progress for a node
const updateNodeProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const nodeId = parseInt(req.params.nodeId);
        const { status, time_spent_seconds, arena_score, mastery_percentage } = req.body;

        // Build dynamic SET clauses
        const updates = [];
        const values = [userId, nodeId];
        let paramIndex = 3;

        // Determine timestamp columns to set based on status
        let sparkAt = null, forgeAt = null, arenaAt = null;
        if (status === 'spark_done') sparkAt = 'NOW()';
        if (status === 'forge_done') forgeAt = 'NOW()';
        if (status === 'arena_done' || status === 'mastered') arenaAt = 'NOW()';

        const result = await db.query(
            `INSERT INTO user_aptitude_progress (user_id, node_id, status, time_spent_seconds, arena_score, mastery_percentage, spark_completed_at, forge_completed_at, arena_completed_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6,
                ${status === 'spark_done' || status === 'forge_done' || status === 'arena_done' || status === 'mastered' ? 'COALESCE((SELECT spark_completed_at FROM user_aptitude_progress WHERE user_id=$1 AND node_id=$2), NOW())' : 'NULL'},
                ${status === 'forge_done' || status === 'arena_done' || status === 'mastered' ? 'COALESCE((SELECT forge_completed_at FROM user_aptitude_progress WHERE user_id=$1 AND node_id=$2), NOW())' : 'NULL'},
                ${status === 'arena_done' || status === 'mastered' ? 'NOW()' : 'NULL'},
                NOW())
             ON CONFLICT (user_id, node_id) DO UPDATE SET
                status = COALESCE($3, user_aptitude_progress.status),
                time_spent_seconds = COALESCE($4, user_aptitude_progress.time_spent_seconds),
                arena_score = COALESCE($5, user_aptitude_progress.arena_score),
                mastery_percentage = COALESCE($6, user_aptitude_progress.mastery_percentage),
                spark_completed_at = CASE WHEN $3 IN ('spark_done','forge_done','arena_done','mastered') THEN COALESCE(user_aptitude_progress.spark_completed_at, NOW()) ELSE user_aptitude_progress.spark_completed_at END,
                forge_completed_at = CASE WHEN $3 IN ('forge_done','arena_done','mastered') THEN COALESCE(user_aptitude_progress.forge_completed_at, NOW()) ELSE user_aptitude_progress.forge_completed_at END,
                arena_completed_at = CASE WHEN $3 IN ('arena_done','mastered') THEN NOW() ELSE user_aptitude_progress.arena_completed_at END,
                updated_at = NOW()
             RETURNING *`,
            [userId, nodeId, status || 'unlocked', time_spent_seconds || 0, arena_score || null, mastery_percentage || 0]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('updateNodeProgress error:', err.message);
        res.status(500).json({ error: 'Failed to update progress' });
    }
};

// GET /api/aptitude/nodes/:nodeId/spark — Get Spark lesson
const getSparkContent = async (req, res) => {
    try {
        const nodeId = parseInt(req.params.nodeId);
        const result = await db.query(
            `SELECT * FROM aptitude_content WHERE node_id = $1 AND content_type = 'spark_lesson' ORDER BY sort_order LIMIT 1`,
            [nodeId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'No Spark content for this node' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('getSparkContent error:', err.message);
        res.status(500).json({ error: 'Failed to fetch Spark content' });
    }
};

// GET /api/aptitude/nodes/:nodeId/forge — Get Forge questions
const getForgeContent = async (req, res) => {
    try {
        const nodeId = parseInt(req.params.nodeId);
        const result = await db.query(
            `SELECT id, node_id, content_type, title, body, options, difficulty, sort_order FROM aptitude_content WHERE node_id = $1 AND content_type = 'forge_question' ORDER BY sort_order`,
            [nodeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('getForgeContent error:', err.message);
        res.status(500).json({ error: 'Failed to fetch Forge content' });
    }
};

// GET /api/aptitude/nodes/:nodeId/arena — Get Arena questions
const getArenaContent = async (req, res) => {
    try {
        const nodeId = parseInt(req.params.nodeId);
        const result = await db.query(
            `SELECT id, node_id, content_type, title, body, options, difficulty, time_limit_seconds, sort_order FROM aptitude_content WHERE node_id = $1 AND content_type = 'arena_question' ORDER BY sort_order`,
            [nodeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('getArenaContent error:', err.message);
        res.status(500).json({ error: 'Failed to fetch Arena content' });
    }
};

// POST /api/aptitude/nodes/:nodeId/complete-stage — Complete a mastery loop stage
const completeStage = async (req, res) => {
    try {
        const userId = req.user.id;
        const nodeId = parseInt(req.params.nodeId);
        const { stage, score, timeSpent } = req.body;
        // stage: 'spark', 'forge', 'arena'

        let newStatus, newMastery;
        if (stage === 'spark') {
            newStatus = 'spark_done';
            newMastery = 33;
        } else if (stage === 'forge') {
            if (score < 75) return res.status(400).json({ error: 'Need ≥75% to pass Forge', score });
            newStatus = 'forge_done';
            newMastery = 66;
        } else if (stage === 'arena') {
            if (score < 60) return res.status(400).json({ error: 'Need ≥60% to pass Arena', score });
            newStatus = 'mastered';
            newMastery = 100;
        } else {
            return res.status(400).json({ error: 'Invalid stage' });
        }

        const result = await db.query(
            `INSERT INTO user_aptitude_progress (user_id, node_id, status, mastery_percentage, time_spent_seconds,
                spark_completed_at, forge_completed_at, arena_completed_at, arena_score, updated_at)
             VALUES ($1, $2, $3, $4, $5,
                ${stage === 'spark' ? 'NOW()' : 'NULL'},
                ${stage === 'forge' ? 'NOW()' : 'NULL'},
                ${stage === 'arena' ? 'NOW()' : 'NULL'},
                ${stage === 'arena' ? '$6' : 'NULL'},
                NOW())
             ON CONFLICT (user_id, node_id) DO UPDATE SET
                status = $3,
                mastery_percentage = $4,
                time_spent_seconds = user_aptitude_progress.time_spent_seconds + $5,
                spark_completed_at = CASE WHEN $3 IN ('spark_done','forge_done','mastered') THEN COALESCE(user_aptitude_progress.spark_completed_at, NOW()) ELSE user_aptitude_progress.spark_completed_at END,
                forge_completed_at = CASE WHEN $3 IN ('forge_done','mastered') THEN COALESCE(user_aptitude_progress.forge_completed_at, NOW()) ELSE user_aptitude_progress.forge_completed_at END,
                arena_completed_at = CASE WHEN $3 = 'mastered' THEN NOW() ELSE user_aptitude_progress.arena_completed_at END,
                arena_score = CASE WHEN $3 = 'mastered' THEN $6 ELSE user_aptitude_progress.arena_score END,
                updated_at = NOW()
             RETURNING *`,
            [userId, nodeId, newStatus, newMastery, timeSpent || 0, score || null]
        );

        res.json({ progress: result.rows[0], passed: true });
    } catch (err) {
        console.error('completeStage error:', err.message);
        res.status(500).json({ error: 'Failed to complete stage' });
    }
};

// POST /api/aptitude/answers — Submit answers for Forge/Arena
const submitAnswers = async (req, res) => {
    try {
        const userId = req.user.id;
        const { answers } = req.body;
        // answers: [{contentId, nodeId, stage, selectedAnswer, timeTaken}]

        const results = [];
        for (const a of answers) {
            // Look up correct answer
            const contentRes = await db.query(
                'SELECT answer, explanation FROM aptitude_content WHERE id = $1', [a.contentId]
            );
            const correct = contentRes.rows[0];
            const isCorrect = correct && correct.answer === a.selectedAnswer;

            await db.query(
                `INSERT INTO user_aptitude_answers (user_id, content_id, node_id, stage, selected_answer, is_correct, time_taken_seconds)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, a.contentId, a.nodeId, a.stage, a.selectedAnswer, isCorrect, a.timeTaken || 0]
            );

            results.push({
                contentId: a.contentId,
                selectedAnswer: a.selectedAnswer,
                correctAnswer: correct?.answer,
                isCorrect,
                explanation: correct?.explanation
            });
        }

        const totalCorrect = results.filter(r => r.isCorrect).length;
        const score = Math.round((totalCorrect / results.length) * 100);

        res.json({ results, score, totalCorrect, totalQuestions: results.length });
    } catch (err) {
        console.error('submitAnswers error:', err.message);
        res.status(500).json({ error: 'Failed to submit answers' });
    }
};

module.exports = { getSkillTree, getUserProgress, updateNodeProgress, getSparkContent, getForgeContent, getArenaContent, completeStage, submitAnswers };
