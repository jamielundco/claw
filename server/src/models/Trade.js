const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    index: true
  },
  tradeId: {
    type: String,
    required: true,
    unique: true
  },
  from: {
    agentId: String,
    agentName: String
  },
  to: {
    agentId: String,
    agentName: String
  },
  offering: String,
  requesting: String,
  terms: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Trade', tradeSchema);
