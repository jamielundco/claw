const express = require('express');
const router = express.Router();
const GameState = require('../models/GameState');
const PlayerState = require('../models/PlayerState');
const Trade = require('../models/Trade');
const ApiKey = require('../models/ApiKey');

/**
 * Initialize database collections and indexes
 * GET /api/admin/init
 */
router.get('/init', async (req, res) => {
  try {
    // Create indexes for all models
    await Promise.all([
      GameState.createIndexes(),
      PlayerState.createIndexes(),
      Trade.createIndexes(),
      ApiKey.createIndexes()
    ]);

    // Get collection stats
    const db = require('mongoose').connection.db;
    const collections = await db.listCollections().toArray();

    res.json({
      success: true,
      message: 'Database initialized successfully',
      collections: collections.map(c => c.name),
      indexes: {
        gameStates: await GameState.listIndexes(),
        playerStates: await PlayerState.listIndexes(),
        trades: await Trade.listIndexes(),
        apiKeys: await ApiKey.listIndexes()
      }
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({
      error: 'Failed to initialize database',
      message: error.message
    });
  }
});

/**
 * Get database stats
 * GET /api/admin/db-stats
 */
router.get('/db-stats', async (req, res) => {
  try {
    const [apiKeyCount, gameCount, playerCount, tradeCount] = await Promise.all([
      ApiKey.countDocuments(),
      GameState.countDocuments(),
      PlayerState.countDocuments(),
      Trade.countDocuments()
    ]);

    const db = require('mongoose').connection.db;
    const collections = await db.listCollections().toArray();

    res.json({
      success: true,
      database: {
        name: db.databaseName,
        collections: collections.map(c => c.name)
      },
      counts: {
        apiKeys: apiKeyCount,
        games: gameCount,
        players: playerCount,
        trades: tradeCount
      }
    });
  } catch (error) {
    console.error('Database stats error:', error);
    res.status(500).json({
      error: 'Failed to get database stats',
      message: error.message
    });
  }
});

/**
 * Create initial game
 * POST /api/admin/create-game
 */
router.post('/create-game', async (req, res) => {
  try {
    const game = new GameState({
      gameId: `claw-${Date.now()}`,
      status: 'active',
      currentTurn: 1,
      maxTurns: 3,
      gameLog: [{
        turn: 0,
        action: 'game_created',
        timestamp: new Date(),
        details: 'Claw To The Top game initialized'
      }]
    });

    await game.save();

    res.json({
      success: true,
      message: 'Game created successfully',
      game: {
        gameId: game.gameId,
        status: game.status,
        currentTurn: game.currentTurn
      }
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({
      error: 'Failed to create game',
      message: error.message
    });
  }
});

module.exports = router;
