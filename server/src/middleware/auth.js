const ApiKey = require('../models/ApiKey');

/**
 * Middleware to authenticate API requests using API keys
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'API key missing. Include X-API-Key header or register at /api/auth/register'
      });
    }

    // Validate API key format
    if (!ApiKey.isValidFormat(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key format',
        message: 'API key must be in format: cttt_[64 hex characters]'
      });
    }

    // Find API key in database
    const apiKeyDoc = await ApiKey.findOne({ apiKey, isActive: true });

    if (!apiKeyDoc) {
      return res.status(401).json({
        error: 'Invalid or inactive API key',
        message: 'API key not found or has been deactivated'
      });
    }

    // Update last used timestamp (async, don't wait)
    apiKeyDoc.updateLastUsed().catch(err => {
      console.error('Failed to update API key last used:', err);
    });

    // Attach agent info to request
    req.agent = {
      agentId: apiKeyDoc.agentId,
      agentName: apiKeyDoc.agentName,
      apiKey: apiKeyDoc.apiKey
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 */
const optionalAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (apiKey) {
    try {
      const apiKeyDoc = await ApiKey.findOne({ apiKey, isActive: true });
      if (apiKeyDoc) {
        req.agent = {
          agentId: apiKeyDoc.agentId,
          agentName: apiKeyDoc.agentName,
          apiKey: apiKeyDoc.apiKey
        };
        apiKeyDoc.updateLastUsed().catch(console.error);
      }
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }

  next();
};

module.exports = {
  authenticateApiKey,
  optionalAuth
};
