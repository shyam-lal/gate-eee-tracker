const pool = require('../config/db');
const { calculateSM2 } = require('./srsService');

/**
 * Get today's date as YYYY-MM-DD in local server time (timezone-safe).
 */
function getLocalDateStr(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const flashcardService = {
    // --- DECKS ---
    createDeck: async (toolId, name) => {
        const res = await pool.query(
            'INSERT INTO decks (tool_id, name) VALUES ($1, $2) RETURNING *',
            [toolId, name]
        );
        return res.rows[0];
    },

    getDecksByTool: async (toolId) => {
        const res = await pool.query(
            `SELECT d.*, 
            COUNT(c.id) as total_cards,
            COUNT(CASE WHEN c.next_review_date <= CURRENT_DATE THEN 1 END) as due_cards
            FROM decks d
            LEFT JOIN cards c ON d.id = c.deck_id
            WHERE d.tool_id = $1
            GROUP BY d.id
            ORDER BY d.created_at ASC`,
            [toolId]
        );
        return res.rows;
    },

    deleteDeck: async (deckId) => {
        const res = await pool.query('DELETE FROM decks WHERE id = $1 RETURNING *', [deckId]);
        return res.rows[0];
    },

    // --- CARDS ---
    createCard: async (deckId, frontContent, backContent, sourceTopicId = null) => {
        const res = await pool.query(
            `INSERT INTO cards (deck_id, front_content, back_content, source_topic_id, repetition, interval_days, ease_factor, next_review_date) 
             VALUES ($1, $2, $3, $4, 0, 0, 2.5, CURRENT_DATE) 
             RETURNING *`,
            [deckId, frontContent, backContent, sourceTopicId]
        );
        return res.rows[0];
    },

    getCardsByDeck: async (deckId) => {
        const res = await pool.query('SELECT * FROM cards WHERE deck_id = $1 ORDER BY created_at DESC', [deckId]);
        return res.rows;
    },

    updateCard: async (cardId, frontContent, backContent) => {
        const res = await pool.query(
            `UPDATE cards 
             SET front_content = $1, back_content = $2 
             WHERE id = $3 
             RETURNING *`,
            [frontContent, backContent, cardId]
        );
        return res.rows[0];
    },

    getDueCards: async (deckId) => {
        const todayStr = getLocalDateStr(new Date());
        const res = await pool.query(
            'SELECT * FROM cards WHERE deck_id = $1 AND next_review_date <= $2 ORDER BY next_review_date ASC, created_at ASC',
            [deckId, todayStr]
        );
        return res.rows;
    },

    deleteCard: async (cardId) => {
        const res = await pool.query('DELETE FROM cards WHERE id = $1 RETURNING *', [cardId]);
        return res.rows[0];
    },

    // --- SRS REVIEW ---
    submitReview: async (cardId, score) => {
        // 1. Fetch current card algorithm state
        const cardRes = await pool.query('SELECT * FROM cards WHERE id = $1', [cardId]);
        if (cardRes.rows.length === 0) throw new Error('Card not found');
        const card = cardRes.rows[0];

        // 2. Calculate new SM-2 values
        const newStats = calculateSM2(score, card.repetition, card.interval_days, card.ease_factor);

        // 3. Calculate new next_review_date
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + newStats.interval);
        const nextDateStr = getLocalDateStr(nextDate);

        // 4. Update Database
        const updateRes = await pool.query(
            `UPDATE cards 
             SET repetition = $1, interval_days = $2, ease_factor = $3, next_review_date = $4 
             WHERE id = $5 
             RETURNING *`,
            [newStats.repetition, newStats.interval, newStats.easeFactor, nextDateStr, cardId]
        );

        return updateRes.rows[0];
    },

    // --- ANALYTICS ---
    getToolAnalytics: async (toolId) => {
        const todayStr = getLocalDateStr(new Date());
        const res = await pool.query(
            `SELECT 
                COUNT(DISTINCT d.id) as total_decks,
                COUNT(c.id) as total_cards,
                COUNT(CASE WHEN c.next_review_date <= $2 THEN 1 END) as due_cards,
                COUNT(CASE WHEN c.repetition > 0 THEN 1 END) as learned_cards,
                ROUND(AVG(CASE WHEN c.repetition > 0 THEN c.ease_factor ELSE NULL END)::numeric, 2) as avg_ease_factor
             FROM decks d
             LEFT JOIN cards c ON d.id = c.deck_id
             WHERE d.tool_id = $1`,
            [toolId, todayStr]
        );
        return res.rows[0];
    }
};

module.exports = flashcardService;
