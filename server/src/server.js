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
