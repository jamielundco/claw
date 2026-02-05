function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

  if (global.wsClients) {
    global.wsClients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (err) {
          console.error('Error broadcasting to client:', err);
        }
      }
    });
  }
}

module.exports = { broadcast };
