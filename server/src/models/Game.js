const { v4: uuidv4 } = require('uuid');

class Game {
  constructor() {
    this.gameId = `claw-${Date.now()}`;
    this.status = 'lobby'; // lobby, active, completed
    this.currentTurn = 0; // 0 = lobby, 1-3 = game turns
    this.maxTurns = 3;
    this.minPlayers = 3;
    this.maxPlayers = 10;
    this.createdAt = new Date().toISOString();
    this.startedAt = null; // Set when game actually starts
    this.winCondition = {
      revealed: false,
      condition: null,
      revealedAt: null,
      possibleConditions: [
        'gold_baron',
        'arsenal_master',
        'master_negotiator',
        'power_broker',
        'top_control'
      ]
    };
    this.summit = {
      currentKing: null,
      kingSince: null,
      challengeHistory: []
    };
    this.turnDeadline = null;
    this.gameLog = [{
      turn: 0,
      action: 'game_created',
      timestamp: new Date().toISOString(),
      details: 'Claw To The Top game initialized'
    }];
    this.settings = {
      startingGold: 50,
      startingInfluence: 20,
      kingIncomeGold: 30,
      playerIncomeGold: 15,
      playerIncomeInfluence: 5,
      topClimbCost: 30,
      topChallengeCost: 50,
      kingDefenseBonus: 10
    };
    this.shop = {
      lockpick: { price: 40, available: true, description: 'Steal 1 random tool from target player' },
      telescope: { price: 35, available: true, description: 'Reveal another player\'s full inventory' },
      shield: { price: 45, available: true, description: 'Blocks one Lockpick or Betrayal action' },
      sword: { price: 50, available: true, description: 'Challenge The King at -10 IP discount, +15% success' },
      chaos_dice: { price: 60, available: true, description: 'Forces re-roll of win condition (Turn 2 only)' }
    };
  }

  revealWinCondition() {
    if (!this.winCondition.revealed) {
      const randomIndex = Math.floor(Math.random() * this.winCondition.possibleConditions.length);
      this.winCondition.condition = this.winCondition.possibleConditions[randomIndex];
      this.winCondition.revealed = true;
      this.winCondition.revealedAt = new Date().toISOString();

      this.gameLog.push({
        turn: this.currentTurn,
        action: 'win_condition_revealed',
        timestamp: new Date().toISOString(),
        details: `Win condition: ${this.winCondition.condition}`
      });
    }
  }

  startGame() {
    if (this.status === 'lobby') {
      this.status = 'active';
      this.currentTurn = 1;
      this.startedAt = new Date().toISOString();

      this.gameLog.push({
        turn: 1,
        action: 'game_started',
        timestamp: new Date().toISOString(),
        details: 'Game started - Turn 1 begins'
      });

      return true;
    }
    return false;
  }

  advanceTurn() {
    if (this.currentTurn < this.maxTurns) {
      this.currentTurn++;

      // Reveal win condition at Turn 2
      if (this.currentTurn === 2) {
        this.revealWinCondition();
      }

      this.gameLog.push({
        turn: this.currentTurn,
        action: 'turn_advanced',
        timestamp: new Date().toISOString(),
        details: `Turn ${this.currentTurn} started`
      });

      return true;
    }
    return false;
  }

  addLogEntry(action, details, agentId = null) {
    this.gameLog.push({
      turn: this.currentTurn,
      action,
      timestamp: new Date().toISOString(),
      agentId,
      details
    });
  }
}

module.exports = Game;
