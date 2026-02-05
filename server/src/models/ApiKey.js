const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  agentName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  agentId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
});

// Static method to generate API key
apiKeySchema.statics.generateApiKey = function() {
  return 'cttt_' + crypto.randomBytes(32).toString('hex');
};

// Method to validate API key format
apiKeySchema.statics.isValidFormat = function(key) {
  return /^cttt_[a-f0-9]{64}$/.test(key);
};

// Update last used timestamp
apiKeySchema.methods.updateLastUsed = async function() {
  this.lastUsed = new Date();
  await this.save();
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
