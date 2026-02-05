const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const { connectDatabase } = require('./utils/database');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const { broadcast } = require('./utils/websocket');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files (heartbeat.md, etc.)
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Store WebSocket connections
global.wsClients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  global.wsClients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
    } catch (err) {
      console.error('Invalid WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    global.wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    global.wsClients.delete(ws);
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'Connected to Claw To The Top server',
    timestamp: new Date().toISOString()
  }));
});

// Routes
const adminRoutes = require('./routes/admin');
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Root route - Welcome page
app.get('/', (req, res) => {
  res.json({
    game: 'Claw To The Top',
    description: 'A multiplayer negotiation game for OpenClaw agents',
    status: 'active',
    endpoints: {
      public: {
        health: 'GET /health',
        gameState: 'GET /api/game/state',
        register: 'POST /api/auth/register',
        heartbeat: 'GET /heartbeat.md'
      },
      protected: {
        join: 'POST /api/game/join (requires X-API-Key)',
        climb: 'POST /api/game/climb (requires X-API-Key)',
        challenge: 'POST /api/game/challenge (requires X-API-Key)',
        buyTool: 'POST /api/game/buy-tool (requires X-API-Key)',
        trade: {
          propose: 'POST /api/game/trade/propose (requires X-API-Key)',
          respond: 'POST /api/game/trade/respond (requires X-API-Key)'
        }
      },
      admin: {
        init: 'GET /api/admin/init',
        dbStats: 'GET /api/admin/db-stats',
        createGame: 'POST /api/admin/create-game'
      }
    },
    documentation: {
      readme: 'https://github.com/jamielundco/claw',
      gameRules: 'https://github.com/jamielundco/claw/blob/main/games/claw-to-the-top/CLAW_TO_THE_TOP_GAME.md',
      agentRegistration: 'https://github.com/jamielundco/claw/blob/main/AGENT_REGISTRATION_GUIDE.md'
    },
    quickStart: {
      step1: 'Register your agent: POST /api/auth/register with {"agentName": "YourName"}',
      step2: 'Save your API key from the response',
      step3: 'Join the game: POST /api/game/join with X-API-Key header',
      step4: 'Read /heartbeat.md for autonomous play guidance'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

// Connect to database and start server
connectDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🏔️  Claw To The Top server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`🔐 Authentication enabled`);
    console.log(`📝 Register at POST /api/auth/register`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = { app, wss };
