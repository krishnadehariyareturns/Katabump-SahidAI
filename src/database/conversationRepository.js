import db from './db.js';
import createLogger from '../utils/logger.js';

const logger = createLogger('ConversationRepository');

const insertMessageStmt = db.prepare(`
  INSERT INTO messages (channel_id, role, author_id, author_name, content)
  VALUES (@channelId, @role, @authorId, @authorName, @content)
`);

const getRecentMessagesStmt = db.prepare(`
  SELECT role, author_id AS authorId, author_name AS authorName, content, created_at AS createdAt
  FROM messages
  WHERE channel_id = @channelId
  ORDER BY created_at DESC, id DESC
  LIMIT @limit
`);

const clearChannelStmt = db.prepare(`
  DELETE FROM messages WHERE channel_id = @channelId
`);

const countChannelMessagesStmt = db.prepare(`
  SELECT COUNT(*) AS count FROM messages WHERE channel_id = @channelId
`);

/**
 * Persists one turn of conversation for a channel.
 * @param {{channelId: string, role: 'user'|'assistant'|'system', authorId?: string|null, authorName?: string|null, content: string}} message
 */
function addMessage({ channelId, role, authorId = null, authorName = null, content }) {
  insertMessageStmt.run({ channelId, role, authorId, authorName, content });
}

/**
 * Returns the most recent `limit` messages for a channel, oldest first
 * (the order the AI provider expects for chat history).
 */
function getRecentHistory(channelId, limit) {
  const rows = getRecentMessagesStmt.all({ channelId, limit });
  return rows.reverse();
}

/**
 * Deletes all stored conversation history for a channel. Used by /clear.
 * @returns {number} number of messages deleted
 */
function clearHistory(channelId) {
  const before = countChannelMessagesStmt.get({ channelId }).count;
  clearChannelStmt.run({ channelId });
  logger.info(`Cleared history for channel ${channelId}`, { messagesDeleted: before });
  return before;
}

export default {
  addMessage,
  getRecentHistory,
  clearHistory,
};
