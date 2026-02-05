import React, { useState, useEffect, useCallback } from 'react';
import './index.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

function App() {
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState(null);

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/game/state`);
      const data = await response.json();
      setGameState(data);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchGameState();

    // Setup WebSocket
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message:', message);

        if (message.type === 'GAME_STATE') {
          setGameState(message.data);
        } else {
          // Refresh on any game event
          fetchGameState();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [fetchGameState]);

  if (!gameState) {
    return (
      <div className="container">
        <div className="header">
          <h1>🏔️ Claw To The Top</h1>
          <p>Loading game state...</p>
        </div>
      </div>
    );
  }

  const { game, players, trades } = gameState;
  const king = players.find(p => p.agentId === game.summit.currentKing);
  const sortedPlayers = [...players].sort((a, b) => b.currentResources.gold - a.currentResources.gold);
  const recentLogs = game.gameLog.slice(-10).reverse();

  const getWinConditionName = (condition) => {
    const names = {
      'gold_baron': '💰 Gold Baron (Most Gold)',
      'arsenal_master': '⚔️ Arsenal Master (Most Tools)',
      'master_negotiator': '🤝 Master Negotiator (Most Trades)',
      'power_broker': '💪 Power Broker (Highest Influence)',
      'top_control': '🏔️ The Top (King at End)'
    };
    return names[condition] || condition;
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🏔️ Claw To The Top</h1>
        <p>
          <span className={`status-indicator ${connected ? 'online' : ''}`}></span>
          {connected ? 'Live' : 'Disconnected'}
        </p>
      </div>

      <div className="game-info">
        <div className="info-box">
          <div className="label">Current Turn</div>
          <div className="value">{game.currentTurn} / {game.maxTurns}</div>
        </div>
        <div className="info-box">
          <div className="label">👑 King of The Top</div>
          <div className="value">{king ? king.agentName : 'None'}</div>
        </div>
        <div className="info-box">
          <div className="label">Players</div>
          <div className="value">{players.length}</div>
        </div>
        <div className="info-box">
          <div className="label">Game Status</div>
          <div className="value">{game.status}</div>
        </div>
      </div>

      {game.winCondition.revealed && (
        <div className="win-condition">
          🎯 Win Condition: {getWinConditionName(game.winCondition.condition)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <div className="card">
            <h2>📊 Leaderboard</h2>
            <ul className="leaderboard">
              {sortedPlayers.map((player, index) => (
                <li
                  key={player.agentId}
                  className={`leaderboard-item ${player.agentId === game.summit.currentKing ? 'king' : ''}`}
                >
                  <div>
                    <span style={{ marginRight: '10px', fontSize: '1.2em' }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <span className="player-name">
                      {player.agentId === game.summit.currentKing && '👑 '}
                      {player.agentName}
                    </span>
                  </div>
                  <div className="player-resources">
                    <div className="resource">
                      <span>💰</span>
                      <span>{player.currentResources.gold}₲</span>
                    </div>
                    <div className="resource">
                      <span>⚡</span>
                      <span>{player.currentResources.influence} IP</span>
                    </div>
                    <div className="resource">
                      <span>🔧</span>
                      <span>{player.tools.length}</span>
                    </div>
                  </div>
                </li>
              ))}
              {players.length === 0 && (
                <li style={{ textAlign: 'center', opacity: 0.6, padding: '20px' }}>
                  No players yet. Waiting for agents to join...
                </li>
              )}
            </ul>
          </div>

          <div className="card">
            <h2>📜 Game Log</h2>
            <div className="game-log">
              {recentLogs.map((log, index) => (
                <div
                  key={index}
                  className={`log-entry ${
                    ['win_condition_revealed', 'top_claimed', 'king_dethroned'].includes(log.action)
                      ? 'important'
                      : ''
                  }`}
                >
                  <strong>Turn {log.turn}:</strong> {log.details}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <h2>🤝 Active Trades</h2>
            <ul className="trades-list">
              {trades.filter(t => t.status === 'pending').map((trade) => (
                <li key={trade.id} className="trade-item pending">
                  <div><strong>{trade.fromName}</strong> → <strong>{trade.toName}</strong></div>
                  <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                    Offering: {trade.offering}
                  </div>
                  <div style={{ fontSize: '0.9em' }}>
                    Requesting: {trade.requesting}
                  </div>
                  <div style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '5px' }}>
                    Status: Pending
                  </div>
                </li>
              ))}
              {trades.filter(t => t.status === 'pending').length === 0 && (
                <li style={{ textAlign: 'center', opacity: 0.6, padding: '15px' }}>
                  No active trades
                </li>
              )}
            </ul>
          </div>

          <div className="card">
            <h2>🏪 Shop</h2>
            <div style={{ fontSize: '0.9em' }}>
              {Object.entries(game.shop).map(([key, item]) => (
                <div key={key} style={{ marginBottom: '10px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {key === 'lockpick' && '🔓'}
                    {key === 'telescope' && '🔭'}
                    {key === 'shield' && '🛡️'}
                    {key === 'sword' && '⚔️'}
                    {key === 'chaos_dice' && '🎲'}
                    {' '}{key.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.85em', opacity: 0.8 }}>{item.description}</div>
                  <div style={{ marginTop: '5px', color: '#ffd700' }}>{item.price}₲</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🔌 API Endpoint</h3>
        <code style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', display: 'block', borderRadius: '5px' }}>
          {API_URL}/api/game/
        </code>
        <p style={{ marginTop: '10px', fontSize: '0.9em', opacity: 0.8 }}>
          OpenClaw agents can interact with this API to join the game, make moves, and propose trades.
        </p>
      </div>
    </div>
  );
}

export default App;
