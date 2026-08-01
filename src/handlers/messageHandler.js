import { ChannelType } from 'discord.js';
import createLogger from '../utils/logger.js';
import { splitMessage } from '../utils/discordHelpers.js';
import conversationMemory from '../memory/conversationMemory.js';
import { generateReply } from '../ai/aiClient.js';

const logger = createLogger('MessageHandler');

/**
 * Determines whether the bot should respond to this message:
 * - Always in DMs
 * - When the bot is @mentioned
 * - When the message is a reply to one of the bot's own messages
 */
async function shouldRespond(client, message) {
  if (message.channel.type === ChannelType.DM) return true;
  if (message.mentions.has(client.user.id)) return true;

  if (message.reference?.messageId) {
    try {
      const referenced = await message.fetchReference();
      if (referenced.author.id === client.user.id) return true;
    } catch (err) {
      logger.debug('Could not fetch referenced message', err.message);
    }
  }

  return false;
}

/**
 * Strips the bot's own mention (e.g. "<@123456789>") out of the message
 * content so it doesn't get sent to the AI as literal text.
 */
function stripBotMention(client, content) {
  const mentionPattern = new RegExp(`<@!?${client.user.id}>`, 'g');
  return content.replace(mentionPattern, '').trim();
}

export async function handleMessage(client, message) {
  if (message.author.bot) return;
  if (!message.content && message.attachments.size === 0) return;

  const willRespond = await shouldRespond(client, message);
  if (!willRespond) return;

  const channelId = message.channel.id;
  const authorId = message.author.id;
  const authorName = message.member?.displayName || message.author.username;
  const content = stripBotMention(client, message.content) || '(no text content)';

  try {
    await message.channel.sendTyping();

    const messages = conversationMemory.buildMessagesForCompletion(channelId, {
      authorName,
      content,
    });

    const { content: replyText, model } = await generateReply(messages);

    conversationMemory.recordUserMessage(channelId, { authorId, authorName, content });
    conversationMemory.recordAssistantMessage(channelId, replyText);

    logger.info(`Replied in channel ${channelId} using model ${model}`);

    const chunks = splitMessage(replyText);
    for (const [index, chunk] of chunks.entries()) {
      // Only the first chunk is a true "reply" (with the reply reference);
      // subsequent chunks are plain follow-up sends to avoid reply spam.
      if (index === 0) {
        await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
      } else {
        await message.channel.send(chunk);
      }
    }
  } catch (err) {
    logger.error(`Failed to handle message in channel ${channelId}`, err);
    await message
      .reply({
        content: "Sorry, I couldn't get a response from any AI model right now. Please try again in a moment.",
        allowedMentions: { repliedUser: false },
      })
      .catch((replyErr) => logger.error('Failed to send error reply', replyErr));
  }
}

export default { handleMessage };
