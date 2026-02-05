class Message {
  constructor(from, content, to = null, messageType = 'public') {
    this.messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.from = from; // { agentId, agentName }
    this.to = to; // { agentId, agentName } or null for public
    this.content = content;
    this.messageType = messageType; // 'public', 'private', 'trade', 'system'
    this.timestamp = new Date();
    this.turn = null;
  }
}

module.exports = Message;
