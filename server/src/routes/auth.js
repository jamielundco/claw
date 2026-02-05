const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ApiKey = require('../models/ApiKey');

/**
 * POST /api/auth/register
 * Register a new agent and receive an API key
 */
router.post('/register', async (req, res) => {
  try {
    const { agentName, metadata } = req.body;

    // Validate agent name
    if (!agentName || typeof agentName !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'agentName is required and must be a string'
      });
    }

    if (agentName.length < 3 || agentName.length > 50) {
      return res.status(400).json({
        error: 'Invalid agent name',
        message: 'agentName must be between 3 and 50 characters'
      });
    }

    // Check if agent name already exists
    const existing = await ApiKey.findOne({ agentName });
    if (existing) {
      return res.status(409).json({
        error: 'Agent name already registered',
        message: `Agent "${agentName}" is already registered. Please use a different name or retrieve your existing API key.`,
        hint: 'If you lost your API key, contact the administrator.'
      });
    }

    // Generate new API key and agent ID
    const apiKey = ApiKey.generateApiKey();
    const agentId = uuidv4();

    // Create API key document
    const apiKeyDoc = new ApiKey({
      agentName,
      apiKey,
      agentId,
      metadata: metadata || {}
    });

    await apiKeyDoc.save();

    res.status(201).json({
      success: true,
      message: `Agent "${agentName}" registered successfully!`,
      credentials: {
        agentId,
        agentName,
        apiKey
      },
      instructions: {
        storage: 'Store this API key in your OpenClaw credentials.json file',
        usage: 'Include this key in the X-API-Key header for all API requests',
        security: 'Keep this API key secret. Do not share it or commit it to version control.'
      },
      nextSteps: [
        'Save your API key securely',
        'Join a game using POST /api/game/join with X-API-Key header',
        'View available games at GET /api/games'
      ]
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify if an API key is valid
 */
router.get('/verify', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key required',
        message: 'Include X-API-Key header to verify'
      });
    }

    const apiKeyDoc = await ApiKey.findOne({ apiKey, isActive: true });

    if (!apiKeyDoc) {
      return res.status(401).json({
        valid: false,
        message: 'API key is invalid or inactive'
      });
    }

    res.json({
      valid: true,
      agent: {
        agentId: apiKeyDoc.agentId,
        agentName: apiKeyDoc.agentName,
        createdAt: apiKeyDoc.createdAt,
        lastUsed: apiKeyDoc.lastUsed
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/info
 * Get information about the authenticated agent
 */
router.get('/info', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Include X-API-Key header'
      });
    }

    const apiKeyDoc = await ApiKey.findOne({ apiKey, isActive: true });

    if (!apiKeyDoc) {
      return res.status(401).json({
        error: 'Invalid API key'
      });
    }

    res.json({
      agent: {
        agentId: apiKeyDoc.agentId,
        agentName: apiKeyDoc.agentName,
        createdAt: apiKeyDoc.createdAt,
        lastUsed: apiKeyDoc.lastUsed,
        isActive: apiKeyDoc.isActive
      }
    });

  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({
      error: 'Failed to get agent info'
    });
  }
});

module.exports = router;
