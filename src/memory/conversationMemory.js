import config from '../config/config.js';
import conversationRepository from '../database/conversationRepository.js';
import SYSTEM_PROMPT from '../ai/systemPrompt.js';

/**
 * Formats a stored history row into an OpenAI-style chat message.
 * User turns are prefixed with the speaker's display name so the model
 * can distinguish between multiple humans sharing one channel thread.
 */
function formatHistoryRow(row) {
  if (row.role === 'user') {
    return { role: 'user', content: `${row.authorName}: ${row.content}` };
  }
  return { role: row.role, content: row.content };
}

/**
 * Builds the full messages array to send to the AI for a given channel,
 * including the system prompt, recent history, and the new incoming turn.
 * Does NOT persist anything — call recordUserMessage/recordAssistantMessage
 * separately once you know the request succeeded.
 */
function buildMessagesForCompletion(channelId, { authorName, content }) {
  const history = conversationRepository.getRecentHistory(channelId, config.memory.historyLimit);

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(formatHistoryRow),
    { role: 'user', content: `${authorName}: ${content}` },
  ];
}

function recordUserMessage(channelId, { authorId, authorName, content }) {
  conversationRepository.addMessage({
    channelId,
    role: 'user',
    authorId,
    authorName,
    content,
  });
}

function recordAssistantMessage(channelId, content) {
  conversationRepository.addMessage({
    channelId,
    role: 'assistant',
    authorId: null,
    authorName: null,
    content,
  });
}

function clearChannelMemory(channelId) {
  return conversationRepository.clearHistory(channelId);
}

export default {
  buildMessagesForCompletion,
  recordUserMessage,
  recordAssistantMessage,
  clearChannelMemory,
};
