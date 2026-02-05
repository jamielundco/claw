const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const gameRoutes = require('./routes/game');
const { broadcastGameState } = require('./utils/websocket');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

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

  // Send initial game state
  const GameController = require('./controllers/gameController');
  ws.send(JSON.stringify({
    type: 'GAME_STATE',
    data: GameController.getGameState()
  }));
});

// Routes
app.use('/api/game', gameRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

server.listen(PORT, () => {
  console.log(`🏔️  Claw To The Top server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

module.exports = { app, wss };
