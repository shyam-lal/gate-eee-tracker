const express = require('express');
const router = express.Router();
const flashcardService = require('../services/flashcardService');
const flashcardPromptService = require('../services/flashcardPromptService');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all flashcard routes
router.use(authMiddleware);

// --- AI GENERATION ---
router.get('/prompt', async (req, res) => {
    try {
        const { topic, count } = req.query;
        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        const c = parseInt(count) || 10;
        const prompt = flashcardPromptService.generateFlashcardPrompt(topic, c);
        res.json({ prompt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate prompt' });
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
        const updatedCard = await flashcardService.submitReview(req.params.id, score);
        res.json(updatedCard);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

module.exports = router;
