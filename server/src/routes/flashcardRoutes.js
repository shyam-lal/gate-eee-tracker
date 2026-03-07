const express = require('express');
const router = express.Router();
const flashcardService = require('../services/flashcardService');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all flashcard routes
router.use(authMiddleware);

// --- DECKS ---

// Create a new deck
router.post('/decks', async (req, res) => {
    try {
        const { toolId, name } = req.body;
        if (!toolId || !name) return res.status(400).json({ error: 'Tool ID and name are required' });
        const deck = await flashcardService.createDeck(toolId, name);
        res.status(201).json(deck);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create deck' });
    }
});

// Get all decks for a tool
router.get('/tools/:toolId/decks', async (req, res) => {
    try {
        const decks = await flashcardService.getDecksByTool(req.params.toolId);
        res.json(decks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get decks' });
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
