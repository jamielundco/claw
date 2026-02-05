const mongoose = require('mongoose');

const gameStateSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  currentTurn: {
    type: Number,
    default: 1
  },
  maxTurns: {
    type: Number,
    default: 3
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  winCondition: {
    revealed: {
      type: Boolean,
      default: false
    },
    condition: {
      type: String,
      enum: ['gold_baron', 'arsenal_master', 'master_negotiator', 'power_broker', 'top_control', null],
      default: null
    },
    revealedAt: Date,
    possibleConditions: {
      type: [String],
      default: ['gold_baron', 'arsenal_master', 'master_negotiator', 'power_broker', 'top_control']
    }
  },
  summit: {
    currentKing: String,
    kingSince: Date,
    challengeHistory: [{
      challenger: String,
      challengerName: String,
      king: String,
      kingName: String,
      challengerRoll: Number,
      kingRoll: Number,
      success: Boolean,
      timestamp: Date
    }]
  },
  turnDeadline: Date,
  gameLog: [{
    turn: Number,
    action: String,
    timestamp: Date,
    agentId: String,
    details: String
  }],
  settings: {
    startingGold: { type: Number, default: 50 },
    startingInfluence: { type: Number, default: 20 },
    kingIncomeGold: { type: Number, default: 30 },
    playerIncomeGold: { type: Number, default: 15 },
    playerIncomeInfluence: { type: Number, default: 5 },
    topClimbCost: { type: Number, default: 30 },
    topChallengeCost: { type: Number, default: 50 },
    kingDefenseBonus: { type: Number, default: 10 }
  },
  shop: {
    type: Map,
    of: {
      price: Number,
      available: Boolean,
      description: String
    },
    default: {
      lockpick: { price: 40, available: true, description: 'Steal 1 random tool from target player' },
      telescope: { price: 35, available: true, description: 'Reveal another player\'s full inventory' },
      shield: { price: 45, available: true, description: 'Blocks one Lockpick or Betrayal action' },
      sword: { price: 50, available: true, description: 'Challenge The King at -10 IP discount, +15% success' },
      chaos_dice: { price: 60, available: true, description: 'Forces re-roll of win condition (Turn 2 only)' }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameState', gameStateSchema);
