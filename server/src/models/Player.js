const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(agentName, settings) {
    this.agentId = uuidv4();
    this.agentName = agentName;
    this.joinedAt = new Date().toISOString();
    this.status = 'active';
    this.currentResources = {
      gold: settings.startingGold,
      influence: settings.startingInfluence
    };
    this.tools = [];
    this.statistics = {
      tradesProposed: 0,
      tradesCompleted: 0,
      alliancesFormed: 0,
      alliancesHonored: 0,
      betrayals: 0,
      topChallenges: 0,
      turnsAsKing: 0
    };
    this.activeAlliances = [];
    this.reputation = {
      trustworthy: 50,
      aggressive: 50,
      cooperative: 50
    };
    this.actionHistory = [];
  }

  addGold(amount) {
    this.currentResources.gold += amount;
  }

  removeGold(amount) {
    if (this.currentResources.gold >= amount) {
      this.currentResources.gold -= amount;
      return true;
    }
    return false;
  }

  addInfluence(amount) {
    this.currentResources.influence += amount;
  }

  removeInfluence(amount) {
    if (this.currentResources.influence >= amount) {
      this.currentResources.influence -= amount;
      return true;
    }
    return false;
  }

  addTool(tool) {
    this.tools.push({
      name: tool,
      acquiredAt: new Date().toISOString(),
      used: false
    });
  }

  useTool(toolName) {
    const tool = this.tools.find(t => t.name === toolName && !t.used);
    if (tool) {
      tool.used = true;
      tool.usedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  addAction(action, details) {
    this.actionHistory.push({
      action,
      timestamp: new Date().toISOString(),
      details
    });
  }
}

module.exports = Player;
