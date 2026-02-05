const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');
const { authenticateApiKey, optionalAuth } = require('../middleware/auth');

// Public routes (no authentication required)
// Get game state - anyone can view
router.get('/state', optionalAuth, GameController.getGameState);

// Protected routes (authentication required)
// Join game
router.post('/join', authenticateApiKey, GameController.joinGame);

// Climb The Top (first time, no king yet)
router.post('/climb', authenticateApiKey, GameController.climbTop);

// Challenge The King
router.post('/challenge', authenticateApiKey, GameController.challengeKing);

// Buy tool from shop
router.post('/buy-tool', authenticateApiKey, GameController.buyTool);

// Propose trade
router.post('/trade/propose', authenticateApiKey, GameController.proposeTrade);

// Respond to trade (accept/reject)
router.post('/trade/respond', authenticateApiKey, GameController.respondToTrade);

// Admin routes (TODO: add admin-specific auth)
// Advance turn (admin/automated)
router.post('/turn/advance', authenticateApiKey, GameController.advanceTurn);

// Reset game (admin)
router.post('/reset', authenticateApiKey, GameController.resetGame);

module.exports = router;
