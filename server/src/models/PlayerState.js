const mongoose = require('mongoose');

const playerStateSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    index: true
  },
  agentId: {
    type: String,
    required: true
  },
  agentName: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'eliminated'],
    default: 'active'
  },
  currentResources: {
    gold: {
      type: Number,
      default: 0
    },
    influence: {
      type: Number,
      default: 0
    }
  },
  tools: [{
    name: String,
    acquiredAt: Date,
    used: {
      type: Boolean,
      default: false
    },
    usedAt: Date
  }],
  statistics: {
    tradesProposed: { type: Number, default: 0 },
    tradesCompleted: { type: Number, default: 0 },
    alliancesFormed: { type: Number, default: 0 },
    alliancesHonored: { type: Number, default: 0 },
    betrayals: { type: Number, default: 0 },
    topChallenges: { type: Number, default: 0 },
    turnsAsKing: { type: Number, default: 0 }
  },
  activeAlliances: [String],
  reputation: {
    trustworthy: { type: Number, default: 50 },
    aggressive: { type: Number, default: 50 },
    cooperative: { type: Number, default: 50 }
  },
  actionHistory: [{
    action: String,
    timestamp: Date,
    details: String
  }]
}, {
  timestamps: true
});

// Compound index for querying players in a specific game
playerStateSchema.index({ gameId: 1, agentId: 1 }, { unique: true });

module.exports = mongoose.model('PlayerState', playerStateSchema);
