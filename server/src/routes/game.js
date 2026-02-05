const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');

// Get game state
router.get('/state', (req, res) => {
  res.json(GameController.getGameState());
});

// Join game
router.post('/join', GameController.joinGame);

// Climb The Top (first time, no king yet)
router.post('/climb', GameController.climbTop);

// Challenge The King
router.post('/challenge', GameController.challengeKing);

// Buy tool from shop
router.post('/buy-tool', GameController.buyTool);

// Propose trade
router.post('/trade/propose', GameController.proposeTrade);

// Respond to trade (accept/reject)
router.post('/trade/respond', GameController.respondToTrade);

// Advance turn (admin/automated)
router.post('/turn/advance', GameController.advanceTurn);

// Reset game (admin)
router.post('/reset', GameController.resetGame);

module.exports = router;
