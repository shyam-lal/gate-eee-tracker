const express = require('express');
const router = express.Router();
const flashcardService = require('../services/flashcardService');
const flashcardPromptService = require('../services/flashcardPromptService');
const authMiddleware = require('../middleware/authMiddleware');
const aiConfigService = require('../services/aiConfigService');
const llmService = require('../services/llmService');
const creditService = require('../services/creditService');
const pool = require('../config/db');

// Protect all flashcard routes
router.use(authMiddleware);

// --- AI GENERATION ---
router.get('/prompt', async (req, res) => {
    try {
        const { topic, count } = req.query;
        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        
        const mode = await aiConfigService.getEffectiveAiMode(req.user.id);
        
        if (mode === 'disabled') {
            return res.status(403).json({ error: 'AI generation is currently disabled.' });
        }
        
        const c = parseInt(count) || 10;
        const prompt = flashcardPromptService.generateFlashcardPrompt(topic, c);
        
        if (mode === 'auto') {
            return res.json({ prompt, auto_mode_placeholder: true, message: 'Auto mode is active.' });
        }
        
        // Manual mode
        res.json({ prompt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate prompt' });
    }
});

router.post('/decks/:deckId/generate', async (req, res) => {
    try {
        const { topic, count } = req.body;
        const deckId = req.params.deckId;
        const userId = req.user.id;

        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        const c = Math.min(parseInt(count) || 10, 10); // Enforce max 10 cards

        const mode = await aiConfigService.getEffectiveAiMode(userId);
        if (mode !== 'auto') {
            return res.status(403).json({ error: 'Auto generation is not enabled.' });
        }

        // Verify deck ownership
        const isOwner = await flashcardService.verifyDeckOwnership(deckId, userId);
        if (!isOwner) {
            return res.status(404).json({ error: 'Deck not found or access denied' });
        }

        // 1. LIGHTWEIGHT CLEANING
        const cleanTopic = (t) => {
            let cleaned = t.toLowerCase();
            cleaned = cleaned.replace(/[^a-z0-9\s]/g, ' '); // Strip special chars/dashes
            cleaned = cleaned.replace(/\s+/g, ' ').trim(); // Normalize spaces
            // Naive plural standardization
            if (cleaned.endsWith('ies')) cleaned = cleaned.slice(0, -3) + 'y';
            else if (cleaned.endsWith('es') && !cleaned.endsWith('ss')) cleaned = cleaned.slice(0, -2);
            else if (cleaned.endsWith('s') && !cleaned.endsWith('ss')) cleaned = cleaned.slice(0, -1);
            return cleaned;
        };
        const normalizedTopic = cleanTopic(topic);

        // 2. GENERATE TOPIC EMBEDDING
        const embedding = await llmService.generateEmbedding(normalizedTopic);
        const embeddingString = `[${embedding.join(',')}]`;

        // 3. SEMANTIC CACHE QUERY
        // pgvector <=> is cosine distance. 1 - cosine_distance > 0.92 is <=> < 0.08
        const cacheRes = await pool.query(
            `SELECT flashcards_json 
             FROM cached_flashcard_decks 
             WHERE card_count = $1 
               AND (embedding <=> $2::vector) < 0.08
             ORDER BY embedding <=> $2::vector ASC 
             LIMIT 1`,
            [c, embeddingString]
        );

        let cards;

        if (cacheRes.rowCount > 0) {
            // CACHE HIT
            cards = cacheRes.rows[0].flashcards_json;
        } else {
            // 4. CACHE MISS PATH
            try {
                await creditService.reserveAndDeductCredits(userId, c);
            } catch (creditErr) {
                if (creditErr.message === 'INSUFFICIENT_CREDITS') {
                    return res.status(402).json({ error: 'Insufficient credits for generation.' });
                }
                throw creditErr;
            }

            try {
                const prompt = flashcardPromptService.generateFlashcardPrompt(topic, c);
                const jsonResponse = await llmService.generateJSON(prompt);
                
                cards = jsonResponse;
                if (jsonResponse && jsonResponse.flashcards && Array.isArray(jsonResponse.flashcards)) {
                    cards = jsonResponse.flashcards;
                }

                if (!Array.isArray(cards) || cards.length === 0) {
                    throw new Error('AI generated invalid data format.');
                }

                // 5. SAVE WITH EMBEDDING
                await pool.query(
                    `INSERT INTO cached_flashcard_decks (normalized_topic, embedding, card_count, flashcards_json)
                     VALUES ($1, $2::vector, $3, $4)`,
                    [normalizedTopic, embeddingString, c, JSON.stringify(cards)]
                );
            } catch (llmErr) {
                // 6. ERROR HANDLING
                console.error('LLM/Save Error:', llmErr);
                await creditService.rollbackCredits(userId, c);
                return res.status(500).json({ error: 'Failed to generate flashcards. Credits refunded.' });
            }
        }

        // Insert all cards
        let insertedCount = 0;
        for (const card of cards) {
            if (card.front && card.back) {
                await flashcardService.createCard(deckId, card.front, card.back);
                insertedCount++;
            }
        }

        res.status(201).json({ message: `Successfully generated and imported ${insertedCount} cards.`, count: insertedCount });
    } catch (err) {
        console.error('Auto Generate Error:', err);
        res.status(500).json({ error: err.message || 'Server error generating cards' });
    }
});

// --- OFFICIAL DECKS ---
router.get('/official', async (req, res) => {
    try {
        const pool = require('../config/db');
        const materials = await pool.query(
            `SELECT s.id, s.title, s.content, es.name as subject_name, et.name as topic_name, s.topic_id 
             FROM study_materials s 
             JOIN exam_subjects es ON es.id = s.subject_id 
             JOIN exam_topics et ON et.id = s.topic_id 
             JOIN users u ON u.active_exam_id = s.exam_id 
             WHERE u.id = $1 AND s.content_type = 'flashcard_json' AND s.is_published = TRUE
             ORDER BY es.sort_order ASC, et.sort_order ASC`,
            [req.user.id]
        );
        res.json(materials.rows);
    } catch (err) {
        console.error('Error fetching official decks:', err);
        res.status(500).json({ error: 'Failed to fetch official decks' });
    }
});

router.post('/official/:id/import', async (req, res) => {
    try {
        const pool = require('../config/db');
        const materialId = req.params.id;
        const { toolId } = req.body;
        
        if (!toolId) return res.status(400).json({ error: 'Tool ID is required' });

        // Verify the tool belongs to the user
        const toolCheck = await pool.query('SELECT id FROM tools WHERE id = $1 AND user_id = $2', [toolId, req.user.id]);
        if (toolCheck.rows.length === 0) return res.status(403).json({ error: 'Tool access denied' });

        // Get the material
        const materialRes = await pool.query(
            `SELECT title, content, topic_id FROM study_materials WHERE id = $1 AND content_type = 'flashcard_json'`,
            [materialId]
        );
        
        if (materialRes.rows.length === 0) return res.status(404).json({ error: 'Deck material not found' });
        
        const mat = materialRes.rows[0];
        const cards = JSON.parse(mat.content);

        // Create the deck
        const deckRes = await pool.query(`INSERT INTO decks (tool_id, name) VALUES ($1, $2) RETURNING id`, [toolId, mat.title]);
        const deckId = deckRes.rows[0].id;

        // Insert cards
        for (const c of cards) {
            await pool.query(
                `INSERT INTO cards (deck_id, front_content, back_content, source_topic_id) VALUES ($1, $2, $3, $4)`,
                [deckId, c.front, c.back, mat.topic_id]
            );
        }

        res.status(201).json({ message: 'Deck imported successfully', deckId });
    } catch (err) {
        console.error('Error importing official deck:', err);
        res.status(500).json({ error: 'Failed to import official deck' });
    }
});

router.post('/decks/:deckId/import', async (req, res) => {
    try {
        const deckId = req.params.deckId;
        const { cards } = req.body; // Expects an array: [{front: '', back: ''}]

        if (!Array.isArray(cards) || cards.length === 0) {
            return res.status(400).json({ error: 'Valid cards array is required' });
        }

        // Verify deck ownership
        const isOwner = await flashcardService.verifyDeckOwnership(deckId, req.user.id);
        if (!isOwner) {
            return res.status(404).json({ error: 'Deck not found or access denied' });
        }

        // Insert all cards
        let insertedCount = 0;
        for (const card of cards) {
            if (card.front && card.back) {
                await flashcardService.createCard(deckId, card.front, card.back);
                insertedCount++;
            }
        }

        res.status(201).json({ message: `Successfully imported ${insertedCount} cards.`, count: insertedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error importing cards' });
    }
});

// --- GROUPS ---

// Create a new group (subject)
router.post('/tools/:toolId/groups', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const group = await flashcardService.createGroup(req.params.toolId, name);
        res.status(201).json(group);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Get all groups and their decks for a tool
router.get('/tools/:toolId/groups', async (req, res) => {
    try {
        const groups = await flashcardService.getGroupsWithDecks(req.params.toolId);
        res.json(groups);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get groups' });
    }
});

// Backward compatibility for mobile app: Get all decks for a tool flattened
router.get('/tools/:toolId/decks', async (req, res) => {
    try {
        const groups = await flashcardService.getGroupsWithDecks(req.params.toolId);
        const decks = [];
        for (const group of groups) {
            for (const deck of group.decks) {
                decks.push({ ...deck, group_name: group.name });
            }
        }
        res.json(decks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get decks' });
    }
});

// Delete a group
router.delete('/groups/:id', async (req, res) => {
    try {
        const group = await flashcardService.deleteGroup(req.params.id);
        res.json({ message: 'Group deleted', group });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

// --- DECKS ---

// Create a new deck inside a group
router.post('/groups/:groupId/decks', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const deck = await flashcardService.createDeck(req.params.groupId, name);
        res.status(201).json(deck);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create deck' });
    }
});

// Get tool analytics
router.get('/tools/:toolId/analytics', async (req, res) => {
    try {
        const analytics = await flashcardService.getToolAnalytics(req.params.toolId);
        res.json(analytics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

// Delete a deck
router.delete('/decks/:id', async (req, res) => {
    try {
        const deck = await flashcardService.deleteDeck(req.params.id);
        res.json({ message: 'Deck deleted', deck });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete deck' });
    }
});

// --- CARDS ---

// Create a new card
router.post('/decks/:deckId/cards', async (req, res) => {
    try {
        const { frontContent, backContent, sourceTopicId } = req.body;
        if (!frontContent || !backContent) return res.status(400).json({ error: 'Front and back content required' });
        const card = await flashcardService.createCard(req.params.deckId, frontContent, backContent, sourceTopicId);
        res.status(201).json(card);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// Get all cards in a deck
router.get('/decks/:deckId/cards', async (req, res) => {
    try {
        const cards = await flashcardService.getCardsByDeck(req.params.deckId);
        res.json(cards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get cards' });
    }
});

// Update a card
router.put('/cards/:id', async (req, res) => {
    try {
        const { frontContent, backContent } = req.body;
        if (!frontContent || !backContent) return res.status(400).json({ error: 'Front and back content required' });
        const card = await flashcardService.updateCard(req.params.id, frontContent, backContent);
        res.json(card);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// Get ALL DUE cards in a deck (for study session)
router.get('/decks/:deckId/due', async (req, res) => {
    try {
        const cards = await flashcardService.getDueCards(req.params.deckId);
        res.json(cards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get due cards' });
    }
});

// Delete a card
router.delete('/cards/:id', async (req, res) => {
    try {
        const card = await flashcardService.deleteCard(req.params.id);
        res.json({ message: 'Card deleted', card });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

// --- SRS REVIEW ---

// Submit a review score (0-5)
router.post('/cards/:id/review', async (req, res) => {
    try {
        const { score } = req.body;
        if (score === undefined || score < 0 || score > 5) {
            return res.status(400).json({ error: 'Valid score (0-5) is required' });
        }
        const updatedCard = await flashcardService.submitReview(req.params.id, score, req.user.id);
        res.json(updatedCard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// Log session completion (Streak tracking)
router.post('/decks/:deckId/complete-session', async (req, res) => {
    try {
        await flashcardService.logSessionComplete(req.params.deckId, req.user.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to complete session' });
    }
});

module.exports = router;
