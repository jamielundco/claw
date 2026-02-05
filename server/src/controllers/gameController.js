const Game = require('../models/Game');
const Player = require('../models/Player');
const Message = require('../models/Message');
const { broadcast } = require('../utils/websocket');

// In-memory storage (replace with database in production)
let currentGame = new Game();
let players = [];
let trades = [];
let messages = [];

class GameController {
  static getGameState(req, res) {
    try {
      res.json({
        game: currentGame,
        players: players,
        trades: trades
      });
    } catch (error) {
      console.error('Error getting game state:', error);
      res.status(500).json({ error: 'Failed to get game state' });
    }
  }

  static joinGame(req, res) {
    try {
      const { agentName } = req.body;

      if (!agentName) {
        return res.status(400).json({ error: 'agentName is required' });
      }

      // Check if agent already joined
      const existing = players.find(p => p.agentName === agentName);
      if (existing) {
        return res.status(400).json({ error: 'Agent already in game' });
      }

      const player = new Player(agentName, currentGame.settings);
      players.push(player);

      currentGame.addLogEntry('player_joined', `${agentName} joined the game`, player.agentId);

      broadcast('PLAYER_JOINED', { player });

      res.json({
        success: true,
        player,
        message: `${agentName} joined the game!`
      });
    } catch (error) {
      console.error('Error joining game:', error);
      res.status(500).json({ error: 'Failed to join game' });
    }
  }

  static climbTop(req, res) {
    try {
      const { agentId } = req.body;
      const player = players.find(p => p.agentId === agentId);

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Check if someone already controls The Top
      if (currentGame.summit.currentKing) {
        return res.status(400).json({ error: 'The Top is already controlled. Use /challenge instead.' });
      }

      // Check if player has enough influence
      if (player.currentResources.influence < currentGame.settings.topClimbCost) {
        return res.status(400).json({ error: `Need ${currentGame.settings.topClimbCost} IP to climb The Top` });
      }

      // Climb The Top
      player.removeInfluence(currentGame.settings.topClimbCost);
      currentGame.summit.currentKing = agentId;
      currentGame.summit.kingSince = new Date().toISOString();
      player.statistics.turnsAsKing++;

      currentGame.addLogEntry('top_claimed', `${player.agentName} claimed The Top!`, agentId);
      player.addAction('climb_top', 'Successfully claimed The Top');

      broadcast('TOP_CLAIMED', { player: player.agentName });

      res.json({
        success: true,
        message: `${player.agentName} is now King of The Top!`,
        player
      });
    } catch (error) {
      console.error('Error climbing top:', error);
      res.status(500).json({ error: 'Failed to climb top' });
    }
  }

  static challengeKing(req, res) {
    try {
      const { agentId } = req.body;
      const challenger = players.find(p => p.agentId === agentId);

      if (!challenger) {
        return res.status(404).json({ error: 'Player not found' });
      }

      if (!currentGame.summit.currentKing) {
        return res.status(400).json({ error: 'No one controls The Top. Use /climb instead.' });
      }

      const king = players.find(p => p.agentId === currentGame.summit.currentKing);
      const challengeCost = currentGame.settings.topChallengeCost;

      // Check if challenger has enough influence
      if (challenger.currentResources.influence < challengeCost) {
        return res.status(400).json({ error: `Need ${challengeCost} IP to challenge The King` });
      }

      // Deduct challenge cost
      challenger.removeInfluence(challengeCost);
      challenger.statistics.topChallenges++;

      // Roll dice
      const challengerRoll = Math.floor(Math.random() * 100) + 1 + challenger.currentResources.influence;
      const kingRoll = Math.floor(Math.random() * 100) + 1 + king.currentResources.influence + currentGame.settings.kingDefenseBonus;

      const success = challengerRoll > kingRoll;

      if (success) {
        // Challenger wins
        currentGame.summit.currentKing = agentId;
        currentGame.summit.kingSince = new Date().toISOString();
        challenger.statistics.turnsAsKing++;
        king.removeInfluence(20);

        currentGame.addLogEntry('challenge_success', `${challenger.agentName} defeated ${king.agentName} (${challengerRoll} vs ${kingRoll})`, agentId);

        broadcast('KING_DETHRONED', {
          newKing: challenger.agentName,
          oldKing: king.agentName,
          rolls: { challenger: challengerRoll, king: kingRoll }
        });

        res.json({
          success: true,
          result: 'victory',
          message: `${challenger.agentName} is the new King!`,
          rolls: { challenger: challengerRoll, king: kingRoll }
        });
      } else {
        // King defends successfully
        challenger.removeInfluence(20);

        currentGame.addLogEntry('challenge_failed', `${challenger.agentName} failed to defeat ${king.agentName} (${challengerRoll} vs ${kingRoll})`, agentId);

        broadcast('CHALLENGE_FAILED', {
          challenger: challenger.agentName,
          king: king.agentName,
          rolls: { challenger: challengerRoll, king: kingRoll }
        });

        res.json({
          success: false,
          result: 'defeat',
          message: `${king.agentName} defended The Top!`,
          rolls: { challenger: challengerRoll, king: kingRoll }
        });
      }
    } catch (error) {
      console.error('Error challenging king:', error);
      res.status(500).json({ error: 'Failed to challenge king' });
    }
  }

  static buyTool(req, res) {
    try {
      const { agentId, tool } = req.body;
      const player = players.find(p => p.agentId === agentId);

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      if (!currentGame.shop[tool]) {
        return res.status(400).json({ error: 'Invalid tool' });
      }

      const toolInfo = currentGame.shop[tool];

      if (player.currentResources.gold < toolInfo.price) {
        return res.status(400).json({ error: `Need ${toolInfo.price}₲ to buy ${tool}` });
      }

      player.removeGold(toolInfo.price);
      player.addTool(tool);

      currentGame.addLogEntry('tool_purchased', `${player.agentName} bought ${tool}`, agentId);
      player.addAction('buy_tool', `Purchased ${tool} for ${toolInfo.price}₲`);

      broadcast('TOOL_PURCHASED', { player: player.agentName, tool });

      res.json({
        success: true,
        message: `${player.agentName} bought ${tool}!`,
        player
      });
    } catch (error) {
      console.error('Error buying tool:', error);
      res.status(500).json({ error: 'Failed to buy tool' });
    }
  }

  static proposeTrade(req, res) {
    try {
      const { fromAgentId, toAgentId, offering, requesting, terms } = req.body;

      const fromPlayer = players.find(p => p.agentId === fromAgentId);
      const toPlayer = players.find(p => p.agentId === toAgentId);

      if (!fromPlayer || !toPlayer) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const trade = {
        id: `trade-${Date.now()}`,
        from: fromAgentId,
        fromName: fromPlayer.agentName,
        to: toAgentId,
        toName: toPlayer.agentName,
        offering,
        requesting,
        terms: terms || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: null
      };

      trades.push(trade);
      fromPlayer.statistics.tradesProposed++;

      currentGame.addLogEntry('trade_proposed', `${fromPlayer.agentName} proposed trade to ${toPlayer.agentName}`, fromAgentId);

      broadcast('TRADE_PROPOSED', { trade });

      res.json({
        success: true,
        trade,
        message: 'Trade proposal created'
      });
    } catch (error) {
      console.error('Error proposing trade:', error);
      res.status(500).json({ error: 'Failed to propose trade' });
    }
  }

  static respondToTrade(req, res) {
    try {
      const { tradeId, agentId, accept } = req.body;

      const trade = trades.find(t => t.id === tradeId);
      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' });
      }

      if (trade.to !== agentId) {
        return res.status(403).json({ error: 'Not authorized to respond to this trade' });
      }

      const fromPlayer = players.find(p => p.agentId === trade.from);
      const toPlayer = players.find(p => p.agentId === trade.to);

      if (accept) {
        trade.status = 'accepted';

        // Execute trade (simplified - you'd need to parse offering/requesting)
        fromPlayer.statistics.tradesCompleted++;
        toPlayer.statistics.tradesCompleted++;

        currentGame.addLogEntry('trade_accepted', `${toPlayer.agentName} accepted trade from ${fromPlayer.agentName}`, agentId);

        broadcast('TRADE_ACCEPTED', { trade });

        res.json({
          success: true,
          message: 'Trade accepted and executed',
          trade
        });
      } else {
        trade.status = 'rejected';

        currentGame.addLogEntry('trade_rejected', `${toPlayer.agentName} rejected trade from ${fromPlayer.agentName}`, agentId);

        broadcast('TRADE_REJECTED', { trade });

        res.json({
          success: true,
          message: 'Trade rejected',
          trade
        });
      }
    } catch (error) {
      console.error('Error responding to trade:', error);
      res.status(500).json({ error: 'Failed to respond to trade' });
    }
  }

  static advanceTurn(req, res) {
    try {
      const success = currentGame.advanceTurn();

      if (!success) {
        return res.status(400).json({ error: 'Game already at max turns' });
      }

      // Distribute income to all players
      players.forEach(player => {
        if (player.agentId === currentGame.summit.currentKing) {
          player.addGold(currentGame.settings.kingIncomeGold);
        } else {
          player.addGold(currentGame.settings.playerIncomeGold);
        }
        player.addInfluence(currentGame.settings.playerIncomeInfluence);
      });

      broadcast('TURN_ADVANCED', { turn: currentGame.currentTurn });

      res.json({
        success: true,
        turn: currentGame.currentTurn,
        winCondition: currentGame.winCondition
      });
    } catch (error) {
      console.error('Error advancing turn:', error);
      res.status(500).json({ error: 'Failed to advance turn' });
    }
  }

  static resetGame(req, res) {
    try {
      currentGame = new Game();
      players = [];
      trades = [];

      broadcast('GAME_RESET', {});

      res.json({
        success: true,
        message: 'Game reset successfully'
      });
    } catch (error) {
      console.error('Error resetting game:', error);
      res.status(500).json({ error: 'Failed to reset game' });
    }
  }

  // Send a message
  static sendMessage(req, res) {
    try {
      const { content, toAgentId, messageType } = req.body;
      const fromAgent = req.agent; // Set by auth middleware

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const from = {
        agentId: fromAgent.agentId,
        agentName: fromAgent.agentName
      };

      let to = null;
      let type = messageType || 'public';

      if (toAgentId) {
        const targetPlayer = players.find(p => p.agentId === toAgentId);
        if (!targetPlayer) {
          return res.status(404).json({ error: 'Target agent not found in game' });
        }
        to = {
          agentId: targetPlayer.agentId,
          agentName: targetPlayer.agentName
        };
        type = 'private';
      }

      const message = new Message(from, content, to, type);
      message.turn = currentGame.currentTurn;
      messages.push(message);

      // Broadcast to WebSocket clients
      broadcast('NEW_MESSAGE', { message });

      res.json({
        success: true,
        message,
        messageCount: messages.length
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Get messages
  static getMessages(req, res) {
    try {
      const { limit = 50, since } = req.query;
      const agentId = req.agent?.agentId;

      let filteredMessages = messages;

      // Filter by timestamp if 'since' is provided
      if (since) {
        const sinceDate = new Date(since);
        filteredMessages = filteredMessages.filter(m => m.timestamp > sinceDate);
      }

      // Filter private messages - only show if you're sender or recipient
      if (agentId) {
        filteredMessages = filteredMessages.filter(m =>
          m.messageType === 'public' ||
          m.messageType === 'system' ||
          m.from.agentId === agentId ||
          (m.to && m.to.agentId === agentId)
        );
      } else {
        // If not authenticated, only show public messages
        filteredMessages = filteredMessages.filter(m =>
          m.messageType === 'public' || m.messageType === 'system'
        );
      }

      // Sort by timestamp, newest first, then limit
      const sortedMessages = filteredMessages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, parseInt(limit));

      res.json({
        messages: sortedMessages.reverse(), // Oldest first for display
        total: filteredMessages.length,
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }
}

module.exports = GameController;
